import 'server-only';
import { query, queryOne } from './db';

export type TipoTx = 'INGRESO' | 'EGRESO';

export const CATEGORIAS = [
  'Turnitin Pasada',
  'Afiliado',
  'Servicio Adicional',
  'Proveedor Turnitin',
  'Proveedor IA',
  'Gasto Operativo',
  'Otro',
] as const;

export type Transaccion = {
  id: string;
  tipo: TipoTx;
  categoria: string;
  monto: number;
  moneda: string;
  descripcion: string | null;
  cliente_nombre: string | null;
  proveedor_id: string | null;
  comprobante_url: string | null;
  fecha: string;
  created_at: string;
};

export type FiltroTx = {
  from?: string;
  to?: string;
  tipo?: TipoTx;
  categoria?: string;
};

function whereClause(f: FiltroTx, params: unknown[]): string {
  const conds: string[] = [];
  if (f.from) { params.push(f.from); conds.push(`fecha >= $${params.length}`); }
  if (f.to) { params.push(f.to); conds.push(`fecha <= $${params.length}`); }
  if (f.tipo) { params.push(f.tipo); conds.push(`tipo = $${params.length}`); }
  if (f.categoria) { params.push(f.categoria); conds.push(`categoria = $${params.length}`); }
  return conds.length ? 'where ' + conds.join(' and ') : '';
}

export function listarTransacciones(f: FiltroTx = {}): Promise<Transaccion[]> {
  const params: unknown[] = [];
  const where = whereClause(f, params);
  return query<Transaccion>(
    `select * from transacciones ${where} order by fecha desc, created_at desc`,
    params
  );
}

export function crearTransaccion(input: {
  tipo: TipoTx;
  categoria: string;
  monto: number;
  moneda?: string;
  descripcion?: string | null;
  cliente_nombre?: string | null;
  proveedor_id?: string | null;
  comprobante_url?: string | null;
  fecha?: string;
}): Promise<Transaccion | null> {
  return queryOne<Transaccion>(
    `insert into transacciones
       (tipo, categoria, monto, moneda, descripcion, cliente_nombre, proveedor_id, comprobante_url, fecha)
     values ($1,$2,$3,$4,$5,$6,$7,$8, coalesce($9, current_date))
     returning *`,
    [
      input.tipo,
      input.categoria,
      input.monto,
      input.moneda ?? 'PEN',
      input.descripcion ?? null,
      input.cliente_nombre ?? null,
      input.proveedor_id ?? null,
      input.comprobante_url ?? null,
      input.fecha ?? null,
    ]
  );
}

const CAMPOS_TX = ['tipo', 'categoria', 'monto', 'moneda', 'descripcion', 'cliente_nombre', 'proveedor_id', 'comprobante_url', 'fecha'] as const;

export function actualizarTransaccion(id: string, fields: Record<string, unknown>): Promise<Transaccion | null> {
  const sets: string[] = [];
  const values: unknown[] = [id];
  for (const c of CAMPOS_TX) {
    if (c in fields && fields[c] !== undefined) {
      values.push(fields[c]);
      sets.push(`${c} = $${values.length}`);
    }
  }
  if (!sets.length) return queryOne<Transaccion>('select * from transacciones where id=$1', [id]);
  return queryOne<Transaccion>(
    `update transacciones set ${sets.join(', ')} where id=$1 returning *`,
    values
  );
}

export async function eliminarTransaccion(id: string): Promise<void> {
  await query('delete from transacciones where id = $1', [id]);
}

// ---------- Resumen / KPIs ----------
export type ResumenMes = {
  ingresos: number;
  egresos: number;
  neto: number;
};

async function totalesEntre(from: string, to: string): Promise<ResumenMes> {
  const row = await queryOne<{ ingresos: string; egresos: string }>(
    `select
       coalesce(sum(monto) filter (where tipo='INGRESO'),0) as ingresos,
       coalesce(sum(monto) filter (where tipo='EGRESO'),0)  as egresos
     from transacciones where fecha >= $1 and fecha <= $2`,
    [from, to]
  );
  const ingresos = Number(row?.ingresos ?? 0);
  const egresos = Number(row?.egresos ?? 0);
  return { ingresos, egresos, neto: ingresos - egresos };
}

function rangoMes(offset = 0): { from: string; to: string } {
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const last = new Date(now.getFullYear(), now.getMonth() + offset + 1, 0);
  const fmt = (d: Date) => d.toISOString().split('T')[0];
  return { from: fmt(first), to: fmt(last) };
}

export async function resumenDashboard() {
  const mesActual = rangoMes(0);
  const mesAnterior = rangoMes(-1);
  const [actual, anterior] = await Promise.all([
    totalesEntre(mesActual.from, mesActual.to),
    totalesEntre(mesAnterior.from, mesAnterior.to),
  ]);

  const variacion = (a: number, b: number) =>
    b === 0 ? (a === 0 ? 0 : 100) : ((a - b) / b) * 100;

  // Distribución de ingresos por categoría (mes actual)
  const porCategoria = await query<{ categoria: string; total: string }>(
    `select categoria, sum(monto) as total
       from transacciones
      where tipo='INGRESO' and fecha >= $1 and fecha <= $2
      group by categoria order by total desc`,
    [mesActual.from, mesActual.to]
  );

  // Serie de los últimos 6 meses (ingresos vs egresos)
  const serie = await query<{ mes: string; ingresos: string; egresos: string }>(
    `select to_char(date_trunc('month', fecha), 'YYYY-MM') as mes,
            coalesce(sum(monto) filter (where tipo='INGRESO'),0) as ingresos,
            coalesce(sum(monto) filter (where tipo='EGRESO'),0)  as egresos
       from transacciones
      where fecha >= (date_trunc('month', current_date) - interval '5 months')
      group by 1 order by 1`
  );

  return {
    mesActual: actual,
    mesAnterior: anterior,
    variacion: {
      ingresos: variacion(actual.ingresos, anterior.ingresos),
      egresos: variacion(actual.egresos, anterior.egresos),
      neto: variacion(actual.neto, anterior.neto),
    },
    porCategoria: porCategoria.map((r) => ({ categoria: r.categoria, total: Number(r.total) })),
    serie: serie.map((r) => ({ mes: r.mes, ingresos: Number(r.ingresos), egresos: Number(r.egresos) })),
  };
}

// ---------- Proveedores ----------
export type Proveedor = {
  id: string;
  nombre: string;
  servicio: string | null;
  costo_por_uso: number | null;
  umbral_alerta: number | null;
  created_at: string;
};

export function listarProveedores(): Promise<Proveedor[]> {
  return query<Proveedor>('select * from proveedores order by nombre');
}

export function crearProveedor(input: {
  nombre: string;
  servicio?: string | null;
  costo_por_uso?: number | null;
  umbral_alerta?: number | null;
}): Promise<Proveedor | null> {
  return queryOne<Proveedor>(
    `insert into proveedores (nombre, servicio, costo_por_uso, umbral_alerta)
     values ($1,$2,$3,$4) returning *`,
    [input.nombre, input.servicio ?? null, input.costo_por_uso ?? null, input.umbral_alerta ?? null]
  );
}

export async function eliminarProveedor(id: string): Promise<void> {
  await query('delete from proveedores where id = $1', [id]);
}

// Proveedor + gasto total del mes en curso + flag de alerta por umbral.
export type ProveedorConGasto = Proveedor & {
  gasto_mes: number;
  pagos: number;
  alerta: boolean;
};

export async function listarProveedoresConGasto(): Promise<ProveedorConGasto[]> {
  const { from, to } = rangoMes(0);
  const rows = await query<Proveedor & { gasto_mes: string; pagos: string }>(
    `select p.*,
            coalesce(sum(t.monto) filter (where t.tipo='EGRESO' and t.fecha >= $1 and t.fecha <= $2), 0) as gasto_mes,
            count(t.id) filter (where t.fecha >= $1 and t.fecha <= $2) as pagos
       from proveedores p
       left join transacciones t on t.proveedor_id = p.id
      group by p.id
      order by p.nombre`,
    [from, to]
  );
  return rows.map((r) => {
    const gasto = Number(r.gasto_mes);
    return {
      ...r,
      gasto_mes: gasto,
      pagos: Number(r.pagos),
      alerta: r.umbral_alerta != null && gasto > Number(r.umbral_alerta),
    };
  });
}

export function historialProveedor(id: string): Promise<Transaccion[]> {
  return query<Transaccion>(
    'select * from transacciones where proveedor_id = $1 order by fecha desc limit 100',
    [id]
  );
}

// Resumen financiero de un cliente (por nombre) para el panel contextual del CRM.
export async function resumenPorCliente(nombre: string): Promise<{
  ingresos: number; egresos: number; total: number; ultimas: Transaccion[];
}> {
  const tot = await queryOne<{ ingresos: string; egresos: string; n: string }>(
    `select
       coalesce(sum(monto) filter (where tipo='INGRESO'),0) ingresos,
       coalesce(sum(monto) filter (where tipo='EGRESO'),0) egresos,
       count(*) n
     from transacciones where lower(cliente_nombre) = lower($1)`,
    [nombre]
  );
  const ultimas = await query<Transaccion>(
    'select * from transacciones where lower(cliente_nombre) = lower($1) order by fecha desc limit 5',
    [nombre]
  );
  const ingresos = Number(tot?.ingresos ?? 0);
  const egresos = Number(tot?.egresos ?? 0);
  return { ingresos, egresos, total: Number(tot?.n ?? 0), ultimas };
}

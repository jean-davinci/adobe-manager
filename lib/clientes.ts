import 'server-only';
import { query, queryOne } from './db';

export type ClienteAdobe = {
  id: string;
  numero_pedido: string;
  nombre_cliente: string;
  email_cliente: string | null;
  telefono: string | null;
  plan_duracion: number;
  costo_servicio: number;
  email_adobe: string | null;
  'contraseña_adobe_encriptada': string | null;
  estado: string;
  fecha_compra: string;
  fecha_renovacion_proxima: string | null;
  created_at: string;
  updated_at: string;
};

export function listarClientes(): Promise<ClienteAdobe[]> {
  return query<ClienteAdobe>(
    'select * from clientes_adobe order by fecha_renovacion_proxima asc nulls last'
  );
}

export async function siguienteNumeroPedido(): Promise<string> {
  const row = await queryOne<{ numero_pedido: string }>(
    `select numero_pedido from clientes_adobe order by numero_pedido desc limit 1`
  );
  if (!row) return '#0001';
  const n = parseInt(row.numero_pedido.replace('#', ''), 10) + 1;
  return '#' + String(n).padStart(4, '0');
}

export function crearCliente(input: {
  numero_pedido: string;
  nombre_cliente: string;
  email_cliente?: string;
  telefono?: string;
  plan_duracion?: number;
  costo_servicio?: number;
  email_adobe?: string;
  contraseña_adobe?: string;
  fecha_renovacion_proxima: string;
}): Promise<ClienteAdobe | null> {
  return queryOne<ClienteAdobe>(
    `insert into clientes_adobe
      (numero_pedido, nombre_cliente, email_cliente, telefono, plan_duracion,
       costo_servicio, email_adobe, "contraseña_adobe_encriptada", estado, fecha_renovacion_proxima)
     values ($1,$2,$3,$4,$5,$6,$7,$8,'ACTIVO',$9)
     returning *`,
    [
      input.numero_pedido,
      input.nombre_cliente,
      input.email_cliente ?? null,
      input.telefono ?? '',
      input.plan_duracion ?? 1,
      input.costo_servicio ?? 0,
      input.email_adobe ?? '',
      input.contraseña_adobe ?? '',
      input.fecha_renovacion_proxima,
    ]
  );
}

export function actualizarCliente(
  id: string,
  fields: {
    fecha_renovacion_proxima?: string;
    costo_servicio?: number;
    plan_duracion?: number;
    estado?: string;
    contraseña_adobe?: string;
  }
): Promise<ClienteAdobe | null> {
  return queryOne<ClienteAdobe>(
    `update clientes_adobe set
       fecha_renovacion_proxima = coalesce($2, fecha_renovacion_proxima),
       costo_servicio           = coalesce($3, costo_servicio),
       plan_duracion            = coalesce($4, plan_duracion),
       estado                   = coalesce($5, estado),
       "contraseña_adobe_encriptada" = coalesce($6, "contraseña_adobe_encriptada")
     where id = $1
     returning *`,
    [
      id,
      fields.fecha_renovacion_proxima ?? null,
      fields.costo_servicio ?? null,
      fields.plan_duracion ?? null,
      fields.estado ?? null,
      fields.contraseña_adobe && fields.contraseña_adobe.trim() !== ''
        ? fields.contraseña_adobe
        : null,
    ]
  );
}

export async function eliminarCliente(id: string): Promise<void> {
  await query('delete from clientes_adobe where id = $1', [id]);
}

// Afiliados cuyo acceso vence dentro de los próximos `dias` (y aún no vencidos).
export function clientesPorVencer(dias = 7): Promise<ClienteAdobe[]> {
  return query<ClienteAdobe>(
    `select * from clientes_adobe
      where estado = 'ACTIVO'
        and fecha_renovacion_proxima is not null
        and fecha_renovacion_proxima >= current_date
        and fecha_renovacion_proxima <= current_date + ($1 || ' days')::interval
      order by fecha_renovacion_proxima asc`,
    [String(dias)]
  );
}

// Para el portal del cliente: su afiliación Adobe activa por email.
export function getClientePorEmail(email: string): Promise<ClienteAdobe | null> {
  return queryOne<ClienteAdobe>(
    `select * from clientes_adobe
      where lower(email_cliente) = lower($1)
      order by fecha_renovacion_proxima desc limit 1`,
    [email]
  );
}

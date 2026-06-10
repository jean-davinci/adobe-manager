import 'server-only';
import { query, queryOne } from './db';

export type ServicioCliente = {
  id: string;
  tipo_servicio: string;
  nombre_cliente: string;
  email: string | null;
  telefono: string | null;
  estado: string;
  monto: number;
  prioridad: string;
  fecha_entrega_esperada: string | null;
  fecha_entrega_real: string | null;
  descripcion: string | null;
  porcentaje_actual: number | null;
  created_at: string;
  updated_at: string;
};

export function listarServicios(): Promise<ServicioCliente[]> {
  return query<ServicioCliente>(
    'select * from servicios_clientes order by created_at desc'
  );
}

export function crearServicio(input: {
  tipo_servicio: string;
  nombre_cliente: string;
  email?: string | null;
  telefono?: string | null;
  monto: number;
  prioridad?: string;
  fecha_entrega_esperada?: string | null;
  descripcion?: string | null;
  porcentaje_actual?: number;
}): Promise<ServicioCliente | null> {
  return queryOne<ServicioCliente>(
    `insert into servicios_clientes
      (tipo_servicio, nombre_cliente, email, telefono, estado, monto, prioridad,
       fecha_entrega_esperada, descripcion, porcentaje_actual)
     values ($1,$2,$3,$4,'PENDIENTE',$5,$6,$7,$8,$9)
     returning *`,
    [
      input.tipo_servicio,
      input.nombre_cliente,
      input.email ?? null,
      input.telefono ?? null,
      input.monto,
      input.prioridad ?? 'NORMAL',
      input.fecha_entrega_esperada ?? null,
      input.descripcion ?? null,
      input.porcentaje_actual ?? 0,
    ]
  );
}

export function actualizarServicio(
  id: string,
  f: Partial<Pick<ServicioCliente,
    'estado' | 'descripcion' | 'porcentaje_actual' | 'monto' |
    'fecha_entrega_esperada' | 'fecha_entrega_real' | 'prioridad'>>
): Promise<ServicioCliente | null> {
  return queryOne<ServicioCliente>(
    `update servicios_clientes set
       estado                 = coalesce($2, estado),
       descripcion            = coalesce($3, descripcion),
       porcentaje_actual      = coalesce($4, porcentaje_actual),
       monto                  = coalesce($5, monto),
       fecha_entrega_esperada = coalesce($6, fecha_entrega_esperada),
       fecha_entrega_real     = coalesce($7, fecha_entrega_real),
       prioridad              = coalesce($8, prioridad)
     where id = $1
     returning *`,
    [
      id,
      f.estado ?? null,
      f.descripcion ?? null,
      f.porcentaje_actual ?? null,
      f.monto ?? null,
      f.fecha_entrega_esperada ?? null,
      f.fecha_entrega_real ?? null,
      f.prioridad ?? null,
    ]
  );
}

export async function eliminarServicio(id: string): Promise<void> {
  await query('delete from servicios_clientes where id = $1', [id]);
}

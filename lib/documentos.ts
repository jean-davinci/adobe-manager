import 'server-only';
import { query, queryOne } from './db';

export type DocEstado = 'RECIBIDO' | 'EN_PROCESO' | 'COMPLETADO';
export type TipoServicioDoc = 'IA' | 'SIMILITUD' | 'AMBOS' | 'TURNITIN_OFICIAL';

export type Documento = {
  id: string;
  user_id: string | null;
  cliente_nombre: string;
  cliente_email: string | null;
  nombre_archivo: string;
  tipo_servicio: string;
  estado: DocEstado;
  tamano_bytes: number | null;
  url_local: string | null;
  url_drive: string | null;
  url_informe: string | null;
  informe_publico: boolean;
  reporte_ia_url: string | null;
  reporte_similitud_url: string | null;
  operador: string | null;
  created_at: string;
  updated_at: string;
};

export type FiltroDoc = { estado?: DocEstado; tipo?: string; email?: string };

export function listarDocumentos(f: FiltroDoc = {}): Promise<Documento[]> {
  const params: unknown[] = [];
  const conds: string[] = [];
  if (f.estado) { params.push(f.estado); conds.push(`estado = $${params.length}`); }
  if (f.tipo) { params.push(f.tipo); conds.push(`tipo_servicio = $${params.length}`); }
  if (f.email) { params.push(f.email.toLowerCase()); conds.push(`lower(cliente_email) = $${params.length}`); }
  const where = conds.length ? 'where ' + conds.join(' and ') : '';
  return query<Documento>(`select * from documentos ${where} order by created_at desc`, params);
}

export function getDocumento(id: string): Promise<Documento | null> {
  return queryOne<Documento>('select * from documentos where id = $1', [id]);
}

export function crearDocumento(input: {
  cliente_nombre: string;
  cliente_email?: string | null;
  nombre_archivo: string;
  tipo_servicio: string;
  tamano_bytes?: number | null;
  url_local?: string | null;
  operador?: string | null;
  user_id?: string | null;
}): Promise<Documento | null> {
  return queryOne<Documento>(
    `insert into documentos
       (cliente_nombre, cliente_email, nombre_archivo, tipo_servicio, tamano_bytes, url_local, operador, user_id)
     values ($1,$2,$3,$4,$5,$6,$7,$8)
     returning *`,
    [
      input.cliente_nombre,
      input.cliente_email ?? null,
      input.nombre_archivo,
      input.tipo_servicio,
      input.tamano_bytes ?? null,
      input.url_local ?? null,
      input.operador ?? null,
      input.user_id ?? null,
    ]
  );
}

export function actualizarEstado(id: string, estado: DocEstado, operador?: string): Promise<Documento | null> {
  return queryOne<Documento>(
    `update documentos set estado = $2, operador = coalesce($3, operador) where id = $1 returning *`,
    [id, estado, operador ?? null]
  );
}

export function setUrlDrive(id: string, url_drive: string): Promise<Documento | null> {
  return queryOne<Documento>(
    'update documentos set url_drive = $2 where id = $1 returning *',
    [id, url_drive]
  );
}

export function setInforme(id: string, url_informe: string, publico = false): Promise<Documento | null> {
  return queryOne<Documento>(
    `update documentos set url_informe = $2, informe_publico = $3, estado = 'COMPLETADO' where id = $1 returning *`,
    [id, url_informe, publico]
  );
}

export function setReporte(
  id: string,
  plataforma: 'iverificate' | 'canvas',
  url: string
): Promise<Documento | null> {
  const col = plataforma === 'iverificate' ? 'reporte_ia_url' : 'reporte_similitud_url';
  return queryOne<Documento>(
    `update documentos set ${col} = $2, estado = case when estado = 'RECIBIDO' then 'EN_PROCESO'::doc_estado else estado end
       where id = $1 returning *`,
    [id, url]
  );
}

export async function eliminarDocumento(id: string): Promise<void> {
  await query('delete from documentos where id = $1', [id]);
}

export function registroDiario(fecha: string): Promise<Documento[]> {
  return query<Documento>(
    `select * from documentos
       where created_at >= $1::date and created_at < ($1::date + interval '1 day')
     order by created_at asc`,
    [fecha]
  );
}

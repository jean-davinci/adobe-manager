import 'server-only';
import { query, queryOne } from './db';

export type ProyectoTesis = {
  id: string;
  nombre_alumno: string;
  carrera: string | null;
  curso_tesis: string | null;
  titulo_tesis: string | null;
  drive_link: string | null;
  j1_nota: number | null;
  j2_nota: number | null;
  j3_nota: number | null;
  j4_nota: number | null;
  porcentaje_avance: number;
  notas: string | null;
  created_at: string;
  updated_at: string;
};

export function listarProyectos(): Promise<ProyectoTesis[]> {
  return query<ProyectoTesis>('select * from proyectos_tesis order by created_at desc');
}

export function crearProyecto(input: {
  nombre_alumno: string;
  carrera?: string;
  curso_tesis?: string;
  titulo_tesis?: string | null;
  drive_link?: string | null;
  notas?: string | null;
}): Promise<ProyectoTesis | null> {
  return queryOne<ProyectoTesis>(
    `insert into proyectos_tesis
       (nombre_alumno, carrera, curso_tesis, titulo_tesis, drive_link, notas, porcentaje_avance)
     values ($1,$2,$3,$4,$5,$6,0)
     returning *`,
    [
      input.nombre_alumno,
      input.carrera ?? 'Comunicación',
      input.curso_tesis ?? null,
      input.titulo_tesis ?? null,
      input.drive_link ?? null,
      input.notas ?? null,
    ]
  );
}

const CAMPOS_EDITABLES = [
  'nombre_alumno', 'carrera', 'curso_tesis', 'titulo_tesis', 'drive_link',
  'j1_nota', 'j2_nota', 'j3_nota', 'j4_nota', 'porcentaje_avance', 'notas',
] as const;

export function actualizarProyecto(
  id: string,
  fields: Record<string, unknown>
): Promise<ProyectoTesis | null> {
  const sets: string[] = [];
  const values: unknown[] = [id];
  for (const campo of CAMPOS_EDITABLES) {
    if (campo in fields && fields[campo] !== undefined) {
      values.push(fields[campo]);
      sets.push(`${campo} = $${values.length}`);
    }
  }
  if (sets.length === 0) {
    return queryOne<ProyectoTesis>('select * from proyectos_tesis where id = $1', [id]);
  }
  return queryOne<ProyectoTesis>(
    `update proyectos_tesis set ${sets.join(', ')} where id = $1 returning *`,
    values
  );
}

export async function eliminarProyecto(id: string): Promise<void> {
  await query('delete from proyectos_tesis where id = $1', [id]);
}

export function actualizarEtapaEstado(id: string, estado: string) {
  return queryOne(
    'update etapas_tesis set estado = $2 where id = $1 returning *',
    [id, estado]
  );
}

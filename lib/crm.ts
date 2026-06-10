import 'server-only';
import { query, queryOne } from './db';

export type Contacto = {
  id: string;
  user_id: string | null;
  nombre: string;
  telefono: string;
  email: string | null;
  etiquetas: string[];
  notas: string | null;
  created_at: string;
  updated_at: string;
};

export type Mensaje = {
  id: string;
  contacto_id: string;
  origen: 'CLIENTE' | 'OPERADOR' | 'AUTO';
  tipo: 'TEXTO' | 'IMAGEN' | 'TEMPLATE';
  contenido: string;
  media_url: string | null;
  leido: boolean;
  timestamp: string;
};

export type RespuestaRapida = {
  id: string;
  trigger: string;
  texto: string;
  media_url: string | null;
  created_at: string;
};

// Contacto + último mensaje + no leídos, para la lista del inbox.
export type ContactoInbox = Contacto & {
  ultimo_mensaje: string | null;
  ultimo_at: string | null;
  no_leidos: number;
};

export function listarContactos(filtroEtiqueta?: string): Promise<ContactoInbox[]> {
  const params: unknown[] = [];
  let where = '';
  if (filtroEtiqueta) {
    params.push(filtroEtiqueta);
    where = `where $1 = any(c.etiquetas)`;
  }
  return query<ContactoInbox>(
    `select c.*,
            m.contenido as ultimo_mensaje,
            m.timestamp as ultimo_at,
            coalesce(nl.n, 0)::int as no_leidos
       from contactos c
       left join lateral (
         select contenido, timestamp from mensajes
          where contacto_id = c.id order by timestamp desc limit 1
       ) m on true
       left join lateral (
         select count(*) n from mensajes
          where contacto_id = c.id and leido = false and origen = 'CLIENTE'
       ) nl on true
       ${where}
      order by m.timestamp desc nulls last`,
    params
  );
}

export function getContacto(id: string): Promise<Contacto | null> {
  return queryOne<Contacto>('select * from contactos where id = $1', [id]);
}

export function getContactoPorTelefono(telefono: string): Promise<Contacto | null> {
  return queryOne<Contacto>('select * from contactos where telefono = $1', [telefono]);
}

export function getContactoPorEmail(email: string): Promise<Contacto | null> {
  return queryOne<Contacto>('select * from contactos where lower(email) = lower($1) limit 1', [email]);
}

// Agrega una etiqueta si no la tiene ya (idempotente).
export function agregarEtiqueta(id: string, etiqueta: string): Promise<Contacto | null> {
  return queryOne<Contacto>(
    `update contactos
        set etiquetas = (select array(select distinct unnest(etiquetas || $2::text)))
      where id = $1 returning *`,
    [id, etiqueta]
  );
}

export function upsertContacto(input: {
  id?: string;
  nombre: string;
  telefono: string;
  email?: string | null;
  etiquetas?: string[];
  notas?: string | null;
}): Promise<Contacto | null> {
  if (input.id) {
    return queryOne<Contacto>(
      `update contactos set
         nombre = $2, email = $3,
         etiquetas = coalesce($4, etiquetas),
         notas = $5
       where id = $1 returning *`,
      [input.id, input.nombre, input.email ?? null, input.etiquetas ?? null, input.notas ?? null]
    );
  }
  return queryOne<Contacto>(
    `insert into contactos (nombre, telefono, email, etiquetas, notas)
     values ($1,$2,$3,$4,$5)
     on conflict (telefono) do update set nombre = excluded.nombre, email = excluded.email
     returning *`,
    [input.nombre, input.telefono, input.email ?? null, input.etiquetas ?? [], input.notas ?? null]
  );
}

export function setEtiquetas(id: string, etiquetas: string[]): Promise<Contacto | null> {
  return queryOne<Contacto>(
    'update contactos set etiquetas = $2 where id = $1 returning *',
    [id, etiquetas]
  );
}

export function setNotas(id: string, notas: string): Promise<Contacto | null> {
  return queryOne<Contacto>('update contactos set notas = $2 where id = $1 returning *', [id, notas]);
}

export function listarMensajes(contactoId: string): Promise<Mensaje[]> {
  return query<Mensaje>(
    'select * from mensajes where contacto_id = $1 order by timestamp asc',
    [contactoId]
  );
}

export async function marcarLeidos(contactoId: string): Promise<void> {
  await query(
    `update mensajes set leido = true where contacto_id = $1 and origen = 'CLIENTE' and leido = false`,
    [contactoId]
  );
}

export function guardarMensaje(input: {
  contacto_id: string;
  origen: Mensaje['origen'];
  tipo?: Mensaje['tipo'];
  contenido: string;
  media_url?: string | null;
  leido?: boolean;
}): Promise<Mensaje | null> {
  return queryOne<Mensaje>(
    `insert into mensajes (contacto_id, origen, tipo, contenido, media_url, leido)
     values ($1,$2,$3,$4,$5,$6) returning *`,
    [
      input.contacto_id,
      input.origen,
      input.tipo ?? 'TEXTO',
      input.contenido,
      input.media_url ?? null,
      input.leido ?? (input.origen !== 'CLIENTE'),
    ]
  );
}

// ---- Respuestas rápidas ----
export function listarRespuestas(): Promise<RespuestaRapida[]> {
  return query<RespuestaRapida>('select * from respuestas_rapidas order by trigger');
}

export function crearRespuesta(input: { trigger: string; texto: string; media_url?: string | null }): Promise<RespuestaRapida | null> {
  const trig = input.trigger.startsWith('/') ? input.trigger : '/' + input.trigger;
  return queryOne<RespuestaRapida>(
    `insert into respuestas_rapidas (trigger, texto, media_url) values ($1,$2,$3)
     on conflict (trigger) do update set texto = excluded.texto, media_url = excluded.media_url
     returning *`,
    [trig, input.texto, input.media_url ?? null]
  );
}

export async function eliminarRespuesta(id: string): Promise<void> {
  await query('delete from respuestas_rapidas where id = $1', [id]);
}

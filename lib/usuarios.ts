import 'server-only';
import { query, queryOne, type Usuario } from './db';

export type UsuarioPublico = Omit<Usuario, 'password_hash'>;

export function getUsuarioByEmail(email: string): Promise<Usuario | null> {
  return queryOne<Usuario>(
    'select * from usuarios where email = $1 limit 1',
    [email.toLowerCase()]
  );
}

export function getUsuarioById(id: string): Promise<UsuarioPublico | null> {
  return queryOne<UsuarioPublico>(
    `select id, email, nombre, rol, activo, created_at, updated_at
       from usuarios where id = $1 limit 1`,
    [id]
  );
}

export async function contarUsuarios(): Promise<number> {
  const rows = await query<{ n: string }>('select count(*)::int as n from usuarios');
  return Number(rows[0]?.n ?? 0);
}

export function crearUsuario(input: {
  email: string;
  nombre: string;
  password_hash: string;
  rol: Usuario['rol'];
}): Promise<UsuarioPublico | null> {
  return queryOne<UsuarioPublico>(
    `insert into usuarios (email, nombre, password_hash, rol)
       values ($1, $2, $3, $4)
       returning id, email, nombre, rol, activo, created_at, updated_at`,
    [input.email.toLowerCase(), input.nombre, input.password_hash, input.rol]
  );
}

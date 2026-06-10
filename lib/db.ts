import 'server-only';
import { Pool, types, type QueryResultRow } from 'pg';

// Devolver las columnas DATE (oid 1082) tal cual ('YYYY-MM-DD'), sin
// convertirlas a Date (que al serializar a JSON arrastra hora/zona).
types.setTypeParser(1082, (v) => v);

// Pool de conexiones a Postgres (desarrollo local). En serverless conviene
// un solo pool por proceso; lo cacheamos en globalThis para sobrevivir al
// hot-reload de Next en dev.
const globalForPg = globalThis as unknown as { _pgPool?: Pool };

// SSL para Postgres hosteado (Railway/Render/Supabase). Local no usa SSL.
const url = process.env.DATABASE_URL ?? '';
const necesitaSSL =
  process.env.PGSSL === 'true' ||
  /sslmode=require/.test(url) ||
  (!/localhost|127\.0\.0\.1/.test(url) && process.env.NODE_ENV === 'production');

export const pool =
  globalForPg._pgPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
    ssl: necesitaSSL ? { rejectUnauthorized: false } : undefined,
  });

if (process.env.NODE_ENV !== 'production') globalForPg._pgPool = pool;

// Helper tipado para consultas. Uso: const rows = await query<Usuario>(sql, [..])
export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<T[]> {
  const res = await pool.query<T>(text, params as never[]);
  return res.rows;
}

export async function queryOne<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}

// --- Tipos de dominio compartidos ---
export type Rol = 'ADMIN' | 'OPERATOR' | 'CLIENT';

export type Usuario = {
  id: string;
  email: string;
  nombre: string;
  password_hash: string;
  rol: Rol;
  activo: boolean;
  created_at: string;
  updated_at: string;
};

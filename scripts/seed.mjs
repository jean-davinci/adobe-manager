// Carga los seeds de desarrollo (idempotentes) contra DATABASE_URL.
// Uso: node --env-file=.env.local scripts/seed.mjs
import pg from 'pg';
import { readFile } from 'fs/promises';
import path from 'path';

const url = process.env.DATABASE_URL;
if (!url) { console.error('Falta DATABASE_URL'); process.exit(1); }
const ssl = process.env.PGSSL === 'true' || /sslmode=require/.test(url) || !/localhost|127\.0\.0\.1/.test(url);
const pool = new pg.Pool({ connectionString: url, ssl: ssl ? { rejectUnauthorized: false } : undefined });

const seeds = ['seed_dev.sql', 'seed_finanzas.sql', 'seed_crm.sql'];
for (const s of seeds) {
  const sql = await readFile(path.join(process.cwd(), 'supabase', s), 'utf-8');
  process.stdout.write(`  • ${s} … `);
  await pool.query(sql);
  console.log('ok');
}
await pool.end();
console.log('✅ Seeds cargados.');

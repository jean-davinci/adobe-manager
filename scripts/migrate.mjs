// Ejecuta todas las migraciones SQL en orden contra DATABASE_URL.
// Uso: node --env-file=.env.local scripts/migrate.mjs
//   o (en hosting): DATABASE_URL=... node scripts/migrate.mjs
import pg from 'pg';
import { readdir, readFile } from 'fs/promises';
import path from 'path';

const url = process.env.DATABASE_URL;
if (!url) { console.error('Falta DATABASE_URL'); process.exit(1); }

const ssl = process.env.PGSSL === 'true' || /sslmode=require/.test(url) || !/localhost|127\.0\.0\.1/.test(url);
const pool = new pg.Pool({ connectionString: url, ssl: ssl ? { rejectUnauthorized: false } : undefined });

const dir = path.join(process.cwd(), 'supabase', 'migrations');
const files = (await readdir(dir)).filter((f) => f.endsWith('.sql')).sort();

console.log(`Aplicando ${files.length} migraciones a ${url.replace(/\/\/.*@/, '//***@')}`);
for (const f of files) {
  const sql = await readFile(path.join(dir, f), 'utf-8');
  process.stdout.write(`  • ${f} … `);
  try {
    await pool.query(sql);
    console.log('ok');
  } catch (e) {
    console.log('ERROR');
    console.error(e.message);
    process.exit(1);
  }
}
await pool.end();
console.log('✅ Migraciones aplicadas.');

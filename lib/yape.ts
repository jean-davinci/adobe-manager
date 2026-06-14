import 'server-only';
import { query, queryOne } from './db';
import { crearTransaccion } from './finanzas';

// ─── Tipos ─────────────────────────────────────────────────────────────────
export type PagoYape = {
  id: string;
  contacto_id: string | null;
  monto: number;
  pagador: string | null;
  fecha_pago: string;
  imagen_url: string | null;
  registrado_en_finanzas: boolean;
  transaccion_id: string | null;
  created_at: string;
};

// ─── Crear un Yape detectado por el agente ────────────────────────────────
export async function crearPagoYape(input: {
  contacto_id?: string | null;
  monto: number;
  pagador?: string | null;
  fecha_pago?: string;
  imagen_url?: string | null;
  registrarEnFinanzas?: boolean;
}): Promise<PagoYape> {
  const fecha = input.fecha_pago ?? new Date().toISOString().slice(0, 10);
  const pago = await queryOne<PagoYape>(
    `insert into pagos_yape (contacto_id, monto, pagador, fecha_pago, imagen_url)
     values ($1, $2, $3, $4, $5)
     returning *`,
    [input.contacto_id ?? null, input.monto, input.pagador ?? null, fecha, input.imagen_url ?? null]
  );
  if (!pago) throw new Error('No se pudo registrar el Yape');

  // Auto-registrar como ingreso en finanzas si se solicita.
  if (input.registrarEnFinanzas !== false) {
    const descripcion = input.pagador ? `Yape — ${input.pagador}` : 'Yape (pagador desconocido)';
    const tx = await crearTransaccion({
      tipo: 'INGRESO',
      categoria: 'Servicio Adicional',
      monto: input.monto,
      moneda: 'PEN',
      descripcion,
      cliente_nombre: input.pagador ?? null,
      fecha,
    });
    if (tx) {
      await query(
        `update pagos_yape set registrado_en_finanzas = true, transaccion_id = $2 where id = $1`,
        [pago.id, tx.id]
      );
      pago.registrado_en_finanzas = true;
      pago.transaccion_id = tx.id;
    }
  }
  return pago;
}

export function listarYapes(opts: { desde?: string; hasta?: string } = {}): Promise<PagoYape[]> {
  const where: string[] = [];
  const params: unknown[] = [];
  if (opts.desde) { params.push(opts.desde); where.push(`fecha_pago >= $${params.length}`); }
  if (opts.hasta) { params.push(opts.hasta); where.push(`fecha_pago <= $${params.length}`); }
  const sql = `select * from pagos_yape ${where.length ? 'where ' + where.join(' and ') : ''} order by fecha_pago desc, created_at desc limit 500`;
  return query<PagoYape>(sql, params);
}

export function getYape(id: string): Promise<PagoYape | null> {
  return queryOne<PagoYape>(`select * from pagos_yape where id = $1`, [id]);
}

// Suma de Yapes en un rango.
export async function resumenYapes(desde?: string, hasta?: string): Promise<{ total: number; cantidad: number }> {
  const where: string[] = [];
  const params: unknown[] = [];
  if (desde) { params.push(desde); where.push(`fecha_pago >= $${params.length}`); }
  if (hasta) { params.push(hasta); where.push(`fecha_pago <= $${params.length}`); }
  const row = await queryOne<{ total: string | null; cantidad: string }>(
    `select coalesce(sum(monto), 0)::text as total, count(*)::text as cantidad
     from pagos_yape ${where.length ? 'where ' + where.join(' and ') : ''}`,
    params
  );
  return { total: Number(row?.total ?? 0), cantidad: Number(row?.cantidad ?? 0) };
}

// ─── Heurística para extraer datos de un comprobante Yape (texto plano) ───
// Parsea la respuesta del modelo (que ya viene con monto/pagador/fecha) o
// hace un parseo "best effort" de un texto extraído por OCR. El agente
// devuelve los campos directamente en JSON cuando se le pide.
export function parsearMontoTexto(texto: string): number | null {
  const m = texto.match(/S\/\.?\s*([\d,]+\.\d{2})/i);
  if (m) return Number(m[1].replace(/,/g, ''));
  const m2 = texto.match(/([\d,]+\.\d{2})/);
  return m2 ? Number(m2[1].replace(/,/g, '')) : null;
}

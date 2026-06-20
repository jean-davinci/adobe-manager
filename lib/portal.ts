import 'server-only';
import { query, queryOne } from './db';
import { PAQUETES } from './portal-config';
import type { CreditosCliente, CompraCreditos, PedidoTurnitin, AccesoServicio, CuentaAdobeCliente } from './portal-types';

export { PAQUETES };
export type { CreditosCliente, CompraCreditos, PedidoTurnitin, AccesoServicio, CuentaAdobeCliente };

// ─── Créditos ─────────────────────────────────────────────────────────────────
export async function getSaldo(usuarioId: string): Promise<number> {
  await query(
    `INSERT INTO creditos_cliente (usuario_id, saldo) VALUES ($1, 0) ON CONFLICT DO NOTHING`,
    [usuarioId]
  );
  const r = await queryOne<{ saldo: string }>(
    `SELECT saldo FROM creditos_cliente WHERE usuario_id = $1`,
    [usuarioId]
  );
  return Number(r?.saldo ?? 0);
}

export async function agregarCreditos(usuarioId: string, cantidad: number): Promise<void> {
  await query(
    `INSERT INTO creditos_cliente (usuario_id, saldo) VALUES ($1, $2)
     ON CONFLICT (usuario_id) DO UPDATE
       SET saldo = creditos_cliente.saldo + $2, updated_at = NOW()`,
    [usuarioId, cantidad]
  );
}

export async function descontarCredito(usuarioId: string): Promise<boolean> {
  const r = await queryOne<{ ok: boolean }>(
    `UPDATE creditos_cliente SET saldo = saldo - 1, updated_at = NOW()
     WHERE usuario_id = $1 AND saldo >= 1
     RETURNING TRUE AS ok`,
    [usuarioId]
  );
  return !!r?.ok;
}

// ─── Compras de créditos ──────────────────────────────────────────────────────
export function crearCompra(input: {
  usuarioId: string;
  paquete: string;
  imagenUrl?: string | null;
  referencia?: string | null;
}): Promise<CompraCreditos | null> {
  const p = PAQUETES[input.paquete];
  if (!p) throw new Error('Paquete inválido');
  return queryOne<CompraCreditos>(
    `INSERT INTO compras_creditos (usuario_id, paquete, cantidad, monto, imagen_url, referencia)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [input.usuarioId, input.paquete, p.cantidad, p.monto, input.imagenUrl ?? null, input.referencia ?? null]
  );
}

export function listarCompras(usuarioId: string): Promise<CompraCreditos[]> {
  return query<CompraCreditos>(
    `SELECT * FROM compras_creditos WHERE usuario_id = $1 ORDER BY created_at DESC LIMIT 30`,
    [usuarioId]
  );
}

export function listarComprasPendientes(): Promise<Array<CompraCreditos & { nombre: string; email: string }>> {
  return query(
    `SELECT cc.*, u.nombre, u.email
     FROM compras_creditos cc
     JOIN usuarios u ON u.id = cc.usuario_id
     WHERE cc.estado = 'pendiente'
     ORDER BY cc.created_at ASC`
  );
}

export async function confirmarCompra(id: string, notas?: string): Promise<void> {
  const compra = await queryOne<CompraCreditos>(
    `UPDATE compras_creditos SET estado = 'confirmado', confirmado_at = NOW(), notas = $2
     WHERE id = $1 AND estado = 'pendiente' RETURNING *`,
    [id, notas ?? null]
  );
  if (compra) await agregarCreditos(compra.usuario_id, Number(compra.cantidad));
}

export async function rechazarCompra(id: string, notas?: string): Promise<void> {
  await query(
    `UPDATE compras_creditos SET estado = 'rechazado', notas = $2 WHERE id = $1`,
    [id, notas ?? null]
  );
}

// ─── Pedidos Turnitin ─────────────────────────────────────────────────────────
export function crearPedido(input: {
  usuarioId: string;
  nombreArchivo: string;
  archivoUrl: string;
}): Promise<PedidoTurnitin | null> {
  return queryOne<PedidoTurnitin>(
    `INSERT INTO pedidos_turnitin (usuario_id, nombre_archivo, archivo_url)
     VALUES ($1, $2, $3) RETURNING *`,
    [input.usuarioId, input.nombreArchivo, input.archivoUrl]
  );
}

export function listarPedidos(usuarioId: string): Promise<PedidoTurnitin[]> {
  return query<PedidoTurnitin>(
    `SELECT * FROM pedidos_turnitin WHERE usuario_id = $1 ORDER BY created_at DESC LIMIT 50`,
    [usuarioId]
  );
}

export function listarTodosPedidos(): Promise<Array<PedidoTurnitin & { nombre: string; email: string }>> {
  return query(
    `SELECT pt.*, u.nombre, u.email
     FROM pedidos_turnitin pt
     JOIN usuarios u ON u.id = pt.usuario_id
     ORDER BY pt.created_at DESC LIMIT 200`
  );
}

export function getPedido(id: string): Promise<PedidoTurnitin | null> {
  return queryOne<PedidoTurnitin>(`SELECT * FROM pedidos_turnitin WHERE id = $1`, [id]);
}

export function actualizarPedido(id: string, data: {
  estado: PedidoTurnitin['estado'];
  similitudPct?: number | null;
  iaPct?: number | null;
  palabras?: number | null;
  reporteUrl?: string | null;
  errorMsg?: string | null;
}): Promise<PedidoTurnitin | null> {
  return queryOne<PedidoTurnitin>(
    `UPDATE pedidos_turnitin
     SET estado = $2, similitud_pct = $3, ia_pct = $4, palabras = $5,
         reporte_url = $6, error_msg = $7,
         completado_at = CASE WHEN $2 IN ('completado','error') THEN NOW() ELSE completado_at END
     WHERE id = $1 RETURNING *`,
    [id, data.estado, data.similitudPct ?? null, data.iaPct ?? null,
     data.palabras ?? null, data.reporteUrl ?? null, data.errorMsg ?? null]
  );
}

// ─── Acceso a servicios ───────────────────────────────────────────────────────
export function listarAccesoServicios(usuarioId: string): Promise<AccesoServicio[]> {
  return query<AccesoServicio>(
    `SELECT * FROM acceso_servicios WHERE usuario_id = $1`,
    [usuarioId]
  );
}

export function tieneAcceso(usuarioId: string, servicio: string): Promise<boolean> {
  return queryOne(
    `SELECT id FROM acceso_servicios WHERE usuario_id = $1 AND servicio = $2 AND activo = TRUE`,
    [usuarioId, servicio]
  ).then(Boolean);
}

export async function otorgarAcceso(usuarioId: string, servicio: string, otorgadoPor: string): Promise<void> {
  await query(
    `INSERT INTO acceso_servicios (usuario_id, servicio, otorgado_por)
     VALUES ($1, $2, $3)
     ON CONFLICT (usuario_id, servicio) DO UPDATE SET activo = TRUE, otorgado_por = $3`,
    [usuarioId, servicio, otorgadoPor]
  );
}

export async function revocarAcceso(usuarioId: string, servicio: string): Promise<void> {
  await query(
    `UPDATE acceso_servicios SET activo = FALSE WHERE usuario_id = $1 AND servicio = $2`,
    [usuarioId, servicio]
  );
}

// ─── Cuenta Adobe ─────────────────────────────────────────────────────────────
export function getCuentaAdobe(usuarioId: string): Promise<CuentaAdobeCliente | null> {
  return queryOne<CuentaAdobeCliente>(
    `SELECT * FROM cuentas_adobe_cliente WHERE usuario_id = $1 AND activo = TRUE`,
    [usuarioId]
  );
}

export function asignarCuentaAdobe(input: {
  usuarioId: string;
  emailAdobe: string;
  plan?: string;
  fechaInicio?: string | null;
  fechaVencimiento?: string | null;
  notas?: string | null;
}): Promise<CuentaAdobeCliente | null> {
  return queryOne<CuentaAdobeCliente>(
    `INSERT INTO cuentas_adobe_cliente (usuario_id, email_adobe, plan, fecha_inicio, fecha_vencimiento, notas)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (usuario_id) DO UPDATE SET
       email_adobe = EXCLUDED.email_adobe, plan = EXCLUDED.plan,
       fecha_inicio = EXCLUDED.fecha_inicio, fecha_vencimiento = EXCLUDED.fecha_vencimiento,
       notas = EXCLUDED.notas, activo = TRUE
     RETURNING *`,
    [input.usuarioId, input.emailAdobe, input.plan ?? 'Creative Cloud',
     input.fechaInicio ?? null, input.fechaVencimiento ?? null, input.notas ?? null]
  );
}

// ─── Admin: clientes ──────────────────────────────────────────────────────────
export function listarClientesPortal(): Promise<Array<{
  id: string;
  nombre: string;
  email: string;
  activo: boolean;
  created_at: string;
  saldo: number;
  servicios: string[];
}>> {
  return query(`
    SELECT u.id, u.nombre, u.email, u.activo, u.created_at,
           COALESCE(cc.saldo, 0)::int AS saldo,
           COALESCE(
             ARRAY_AGG(DISTINCT s.servicio) FILTER (WHERE s.servicio IS NOT NULL AND s.activo = TRUE),
             ARRAY[]::text[]
           ) AS servicios
    FROM usuarios u
    LEFT JOIN creditos_cliente cc ON cc.usuario_id = u.id
    LEFT JOIN acceso_servicios s ON s.usuario_id = u.id
    WHERE u.rol = 'CLIENT'
    GROUP BY u.id, u.nombre, u.email, u.activo, u.created_at, cc.saldo
    ORDER BY u.created_at DESC
  `);
}

// Estadísticas rápidas para admin
export async function statsPortal(): Promise<{
  clientes: number;
  pedidosPendientes: number;
  comprasPendientes: number;
  pedidosHoy: number;
}> {
  const [r] = await query<{
    clientes: string;
    pedidos_pendientes: string;
    compras_pendientes: string;
    pedidos_hoy: string;
  }>(`
    SELECT
      (SELECT count(*) FROM usuarios WHERE rol = 'CLIENT')::text AS clientes,
      (SELECT count(*) FROM pedidos_turnitin WHERE estado IN ('pendiente','procesando'))::text AS pedidos_pendientes,
      (SELECT count(*) FROM compras_creditos WHERE estado = 'pendiente')::text AS compras_pendientes,
      (SELECT count(*) FROM pedidos_turnitin WHERE created_at >= current_date)::text AS pedidos_hoy
  `);
  return {
    clientes: Number(r?.clientes ?? 0),
    pedidosPendientes: Number(r?.pedidos_pendientes ?? 0),
    comprasPendientes: Number(r?.compras_pendientes ?? 0),
    pedidosHoy: Number(r?.pedidos_hoy ?? 0),
  };
}

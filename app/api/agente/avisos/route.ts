import { NextRequest, NextResponse } from 'next/server';
import { requireApi } from '@/lib/api-auth';
import { listarAvisos, marcarAvisoVisto, generarAvisosProactivos } from '@/lib/agente-acciones';

// GET /api/agente/avisos — avisos pendientes (visto=false).
export async function GET() {
  const auth = await requireApi('ADMIN', 'OPERATOR');
  if (!auth.ok) return auth.response;
  const avisos = await listarAvisos(true);
  return NextResponse.json(avisos);
}

// POST /api/agente/avisos → regenera avisos proactivos (manual o cron).
export async function POST() {
  const auth = await requireApi('ADMIN', 'OPERATOR');
  if (!auth.ok) return auth.response;
  const creados = await generarAvisosProactivos();
  return NextResponse.json({ ok: true, creados });
}

// PATCH /api/agente/avisos { id } → marcar visto.
export async function PATCH(req: NextRequest) {
  const auth = await requireApi('ADMIN', 'OPERATOR');
  if (!auth.ok) return auth.response;
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'Falta id' }, { status: 400 });
  await marcarAvisoVisto(String(id));
  return NextResponse.json({ ok: true });
}

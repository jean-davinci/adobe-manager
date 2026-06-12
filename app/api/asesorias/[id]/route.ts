import { NextRequest, NextResponse } from 'next/server';
import { requireApi } from '@/lib/api-auth';
import { cancelarAsesoria, marcarCompletada } from '@/lib/asesorias';

// DELETE /api/asesorias/:id — cancelar (staff). Borra el evento de Calendar.
export async function DELETE(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await requireApi('ADMIN', 'OPERATOR');
  if (!auth.ok) return auth.response;
  const { id } = await context.params;
  const asesoria = await cancelarAsesoria(id);
  if (!asesoria) return NextResponse.json({ error: 'No encontrada' }, { status: 404 });
  return NextResponse.json({ ok: true, asesoria });
}

// PATCH /api/asesorias/:id — marcar completada (staff).
export async function PATCH(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await requireApi('ADMIN', 'OPERATOR');
  if (!auth.ok) return auth.response;
  const { id } = await context.params;
  await marcarCompletada(id);
  return NextResponse.json({ ok: true });
}

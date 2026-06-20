import { NextRequest, NextResponse } from 'next/server';
import { requireApi } from '@/lib/api-auth';
import { confirmarCompra, rechazarCompra } from '@/lib/portal';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApi('ADMIN', 'OPERATOR');
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const { accion, notas } = await req.json();

  if (accion === 'confirmar') {
    await confirmarCompra(id, notas);
    return NextResponse.json({ ok: true });
  }
  if (accion === 'rechazar') {
    await rechazarCompra(id, notas);
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: 'Acción inválida.' }, { status: 400 });
}

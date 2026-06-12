import { NextRequest, NextResponse } from 'next/server';
import { actualizarProyecto, eliminarProyecto } from '@/lib/proyectos';
import { requireApi } from '@/lib/api-auth';

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await requireApi('ADMIN', 'OPERATOR');
  if (!auth.ok) return auth.response;

  try {
    const { id } = await context.params;
    const body = await req.json();
    const data = await actualizarProyecto(id, body);
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await requireApi('ADMIN', 'OPERATOR');
  if (!auth.ok) return auth.response;

  try {
    const { id } = await context.params;
    await eliminarProyecto(id);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { actualizarServicio, eliminarServicio } from '@/lib/servicios';
import { requireApi } from '@/lib/api-auth';

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await requireApi('ADMIN', 'OPERATOR');
  if (!auth.ok) return auth.response;

  try {
    const { id } = await context.params;
    const body = await req.json();
    const data = await actualizarServicio(id, {
      estado: body.estado,
      descripcion: body.descripcion,
      porcentaje_actual: body.porcentaje_actual,
      monto: body.monto,
      fecha_entrega_esperada: body.fecha_entrega_esperada,
      fecha_entrega_real: body.fecha_entrega_real,
      prioridad: body.prioridad,
    });
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
    await eliminarServicio(id);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

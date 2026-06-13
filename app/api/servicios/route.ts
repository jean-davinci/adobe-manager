import { NextRequest, NextResponse } from 'next/server';
import { listarServicios, crearServicio } from '@/lib/servicios';
import { requireApi } from '@/lib/api-auth';

export async function GET() {
  const auth = await requireApi('ADMIN', 'OPERATOR');
  if (!auth.ok) return auth.response;

  try {
    const data = await listarServicios();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireApi('ADMIN', 'OPERATOR');
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json();
    const data = await crearServicio({
      tipo_servicio: body.tipo_servicio,
      nombre_cliente: body.nombre_cliente,
      email: body.email,
      telefono: body.telefono,
      monto: body.monto,
      prioridad: body.prioridad,
      fecha_entrega_esperada: body.fecha_entrega_esperada,
      descripcion: body.descripcion,
      porcentaje_actual: body.porcentaje_actual,
    });
    return NextResponse.json(data, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

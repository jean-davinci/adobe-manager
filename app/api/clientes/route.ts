import { NextRequest, NextResponse } from 'next/server';
import { listarClientes, crearCliente } from '@/lib/clientes';
import { requireApi } from '@/lib/api-auth';

export async function GET() {
  const auth = await requireApi('ADMIN', 'OPERATOR');
  if (!auth.ok) return auth.response;

  try {
    const data = await listarClientes();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Error interno' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireApi('ADMIN', 'OPERATOR');
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json();
    if (!body.numero_pedido || !body.nombre_cliente) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
    }

    const dias = body.plan_duracion === 12 ? 365 : (body.plan_duracion ?? 1) * 30;
    const fechaRenovacion = new Date();
    fechaRenovacion.setDate(fechaRenovacion.getDate() + dias);

    const data = await crearCliente({
      numero_pedido: body.numero_pedido,
      nombre_cliente: body.nombre_cliente,
      email_cliente: body.email_cliente,
      telefono: body.telefono,
      plan_duracion: body.plan_duracion,
      costo_servicio: body.costo_servicio,
      email_adobe: body.email_adobe,
      contraseña_adobe: body.contraseña_adobe,
      fecha_renovacion_proxima: fechaRenovacion.toISOString().split('T')[0],
    });
    return NextResponse.json(data, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Error interno' }, { status: 500 });
  }
}

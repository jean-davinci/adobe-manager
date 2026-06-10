import { NextRequest, NextResponse } from 'next/server';
import { actualizarCliente, eliminarCliente } from '@/lib/clientes';
import { enviarCodigoAcceso } from '@/lib/automatizaciones';
import { notificarRenovacion } from '@/lib/email';

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = await req.json();
    const data = await actualizarCliente(id, {
      fecha_renovacion_proxima: body.fecha_renovacion_proxima,
      costo_servicio: body.costo_servicio != null ? parseFloat(body.costo_servicio) : undefined,
      plan_duracion: body.plan_duracion != null ? parseInt(body.plan_duracion) : undefined,
      estado: body.estado,
      contraseña_adobe: body.contraseña_adobe,
    });
    // Automatización: al activar/renovar el afiliado, enviar código por WhatsApp
    // y notificación de renovación por email.
    if (body.estado === 'ACTIVO' && data) {
      enviarCodigoAcceso(data).catch((e) => console.error('enviarCodigoAcceso:', e));
      notificarRenovacion(data).catch((e) => console.error('notificarRenovacion:', e));
    }
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    await eliminarCliente(id);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

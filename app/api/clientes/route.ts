import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('clientes_adobe')
      .select('*')
      .order('fecha_renovacion_proxima', { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.numero_pedido || !body.nombre_cliente) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
    }

    const dias = body.plan_duracion === 12 ? 365 : 30;
    const fechaRenovacion = new Date();
    fechaRenovacion.setDate(fechaRenovacion.getDate() + dias);

    const { data, error } = await supabase
      .from('clientes_adobe')
      .insert({
        numero_pedido: body.numero_pedido,
        nombre_cliente: body.nombre_cliente,
        email_cliente: body.email_cliente,
        telefono: body.telefono || '',
        plan_duracion: body.plan_duracion || 1,
        costo_servicio: body.costo_servicio || 0,
        email_adobe: body.email_adobe || '',
        contraseña_adobe_encriptada: body.contraseña_adobe || '',
        estado: 'ACTIVO',
        fecha_renovacion_proxima: fechaRenovacion.toISOString().split('T')[0],
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

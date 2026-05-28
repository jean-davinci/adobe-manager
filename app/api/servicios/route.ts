import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  const { data, error } = await supabase
    .from('servicios_clientes')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { data, error } = await supabase
      .from('servicios_clientes')
      .insert({
        tipo_servicio:          body.tipo_servicio,
        nombre_cliente:         body.nombre_cliente,
        email:                  body.email || null,
        telefono:               body.telefono || null,
        estado:                 'PENDIENTE',
        monto:                  body.monto,
        prioridad:              body.prioridad || 'NORMAL',
        fecha_entrega_esperada: body.fecha_entrega_esperada || null,
        descripcion:            body.descripcion || null,
        porcentaje_actual:      body.porcentaje_actual || 0,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
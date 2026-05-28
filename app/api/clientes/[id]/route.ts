import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function PUT(req: NextRequest, context: any) {
  try {
    const { id } = await context.params;
    const body = await req.json();

    const updateData: any = {
      fecha_renovacion_proxima: body.fecha_renovacion_proxima,
      costo_servicio: parseFloat(body.costo_servicio),
      plan_duracion: parseInt(body.plan_duracion),
      updated_at: new Date().toISOString(),
    };

    if (body.estado) updateData.estado = body.estado;
    if (body.contraseña_adobe && body.contraseña_adobe.trim() !== '') {
      updateData.contraseña_adobe_encriptada = body.contraseña_adobe;
    }

    const { data, error } = await supabase
      .from('clientes_adobe')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, context: any) {
  try {
    const { id } = await context.params;

    const { error } = await supabase
      .from('clientes_adobe')
      .delete()
      .eq('id', id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

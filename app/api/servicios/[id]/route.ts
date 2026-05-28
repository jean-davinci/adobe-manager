import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function PUT(req: NextRequest, context: any) {
  try {
    const { id } = await context.params;
    const body = await req.json();

    const { data, error } = await supabase
      .from('servicios_clientes')
      .update({
        estado: body.estado,
        descripcion: body.descripcion,
        porcentaje_actual: body.porcentaje_actual,
        monto: body.monto,
        fecha_entrega_esperada: body.fecha_entrega_esperada,
        fecha_entrega_real: body.fecha_entrega_real,
        prioridad: body.prioridad,
        updated_at: new Date().toISOString(),
      })
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
      .from('servicios_clientes')
      .delete()
      .eq('id', id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

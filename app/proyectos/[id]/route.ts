import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  const { data, error } = await supabase
    .from('proyectos_tesis')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { data, error } = await supabase
      .from('proyectos_tesis')
      .insert({
        nombre_alumno:    body.nombre_alumno,
        carrera:          body.carrera || 'Comunicación',
        curso_tesis:      body.curso_tesis,
        titulo_tesis:     body.titulo_tesis || null,
        drive_link:       body.drive_link || null,
        notas:            body.notas || null,
        porcentaje_avance: 0,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { listarProyectos, crearProyecto } from '@/lib/proyectos';

export async function GET() {
  try {
    const data = await listarProyectos();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = await crearProyecto({
      nombre_alumno: body.nombre_alumno,
      carrera: body.carrera,
      curso_tesis: body.curso_tesis,
      titulo_tesis: body.titulo_tesis,
      drive_link: body.drive_link,
      notas: body.notas,
    });
    return NextResponse.json(data, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

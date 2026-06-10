import { NextRequest, NextResponse } from 'next/server';
import { actualizarEtapaEstado } from '@/lib/proyectos';

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const data = await actualizarEtapaEstado(body.id, body.estado);
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

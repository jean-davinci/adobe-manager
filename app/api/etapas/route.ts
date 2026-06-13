import { NextRequest, NextResponse } from 'next/server';
import { actualizarEtapaEstado } from '@/lib/proyectos';
import { requireApi } from '@/lib/api-auth';

export async function PUT(req: NextRequest) {
  const auth = await requireApi('ADMIN', 'OPERATOR');
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json();
    const data = await actualizarEtapaEstado(body.id, body.estado);
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

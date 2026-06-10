import { NextRequest, NextResponse } from 'next/server';
import { requireApi } from '@/lib/api-auth';
import { listarRespuestas, crearRespuesta, eliminarRespuesta } from '@/lib/crm';

export async function GET() {
  const auth = await requireApi('ADMIN', 'OPERATOR');
  if (!auth.ok) return auth.response;
  return NextResponse.json(await listarRespuestas());
}

export async function POST(req: NextRequest) {
  const auth = await requireApi('ADMIN', 'OPERATOR');
  if (!auth.ok) return auth.response;
  try {
    const body = await req.json();
    if (!body.trigger || !body.texto) {
      return NextResponse.json({ error: 'Falta trigger o texto' }, { status: 400 });
    }
    return NextResponse.json(await crearRespuesta(body), { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await requireApi('ADMIN', 'OPERATOR');
  if (!auth.ok) return auth.response;
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Falta id' }, { status: 400 });
  await eliminarRespuesta(id);
  return NextResponse.json({ ok: true });
}

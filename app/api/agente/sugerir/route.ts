import { NextRequest, NextResponse } from 'next/server';
import { requireApi } from '@/lib/api-auth';
import { sugerirRespuesta } from '@/lib/agente-acciones';

// POST /api/agente/sugerir { contactoId, instruccion? }
export async function POST(req: NextRequest) {
  const auth = await requireApi('ADMIN', 'OPERATOR');
  if (!auth.ok) return auth.response;
  try {
    const body = await req.json();
    const contactoId = String(body?.contactoId ?? '');
    if (!contactoId) return NextResponse.json({ error: 'Falta contactoId' }, { status: 400 });
    const instruccion = typeof body?.instruccion === 'string' ? body.instruccion.slice(0, 500) : undefined;
    const r = await sugerirRespuesta(contactoId, instruccion);
    return NextResponse.json(r);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

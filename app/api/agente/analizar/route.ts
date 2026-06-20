import { NextRequest, NextResponse } from 'next/server';
import { requireApi } from '@/lib/api-auth';
import { analizarConversacion } from '@/lib/agente-acciones';

// POST /api/agente/analizar { contactoId }
export async function POST(req: NextRequest) {
  const auth = await requireApi('ADMIN', 'OPERATOR');
  if (!auth.ok) return auth.response;
  try {
    const { contactoId } = await req.json();
    if (!contactoId) return NextResponse.json({ error: 'Falta contactoId' }, { status: 400 });
    const r = await analizarConversacion(String(contactoId));
    return NextResponse.json(r);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

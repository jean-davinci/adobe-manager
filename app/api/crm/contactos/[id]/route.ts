import { NextRequest, NextResponse } from 'next/server';
import { requireApi } from '@/lib/api-auth';
import { setEtiquetas, setNotas } from '@/lib/crm';

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await requireApi('ADMIN', 'OPERATOR');
  if (!auth.ok) return auth.response;
  try {
    const { id } = await context.params;
    const body = await req.json();
    let data;
    if (Array.isArray(body.etiquetas)) data = await setEtiquetas(id, body.etiquetas);
    if (typeof body.notas === 'string') data = await setNotas(id, body.notas);
    return NextResponse.json(data ?? {});
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

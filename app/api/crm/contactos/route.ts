import { NextRequest, NextResponse } from 'next/server';
import { requireApi } from '@/lib/api-auth';
import { listarContactos, upsertContacto } from '@/lib/crm';

export async function GET(req: NextRequest) {
  const auth = await requireApi('ADMIN', 'OPERATOR');
  if (!auth.ok) return auth.response;
  const etiqueta = req.nextUrl.searchParams.get('etiqueta') ?? undefined;
  return NextResponse.json(await listarContactos(etiqueta));
}

export async function POST(req: NextRequest) {
  const auth = await requireApi('ADMIN', 'OPERATOR');
  if (!auth.ok) return auth.response;
  try {
    const body = await req.json();
    if (!body.nombre || !body.telefono) {
      return NextResponse.json({ error: 'Falta nombre o teléfono' }, { status: 400 });
    }
    const data = await upsertContacto(body);
    return NextResponse.json(data, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

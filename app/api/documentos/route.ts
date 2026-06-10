import { NextRequest, NextResponse } from 'next/server';
import { requireApi } from '@/lib/api-auth';
import { listarDocumentos, type DocEstado } from '@/lib/documentos';

export async function GET(req: NextRequest) {
  const auth = await requireApi('ADMIN', 'OPERATOR');
  if (!auth.ok) return auth.response;

  const sp = req.nextUrl.searchParams;
  const data = await listarDocumentos({
    estado: (sp.get('estado') as DocEstado) ?? undefined,
    tipo: sp.get('tipo') ?? undefined,
    email: sp.get('email') ?? undefined,
  });
  return NextResponse.json(data);
}

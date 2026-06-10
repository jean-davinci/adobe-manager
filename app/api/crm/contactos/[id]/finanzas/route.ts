import { NextRequest, NextResponse } from 'next/server';
import { requireApi } from '@/lib/api-auth';
import { getContacto } from '@/lib/crm';
import { resumenPorCliente } from '@/lib/finanzas';

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await requireApi('ADMIN', 'OPERATOR');
  if (!auth.ok) return auth.response;
  const { id } = await context.params;
  const contacto = await getContacto(id);
  if (!contacto) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
  return NextResponse.json(await resumenPorCliente(contacto.nombre));
}

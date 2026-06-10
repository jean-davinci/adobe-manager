import { NextRequest, NextResponse } from 'next/server';
import { requireApi } from '@/lib/api-auth';
import { getContacto, listarMensajes, marcarLeidos } from '@/lib/crm';

export async function GET(req: NextRequest, context: { params: Promise<{ contactId: string }> }) {
  const auth = await requireApi('ADMIN', 'OPERATOR');
  if (!auth.ok) return auth.response;

  const { contactId } = await context.params;
  const contacto = await getContacto(contactId);
  if (!contacto) return NextResponse.json({ error: 'Contacto no encontrado' }, { status: 404 });

  const mensajes = await listarMensajes(contactId);
  // Al abrir la conversación, marcamos como leídos los del cliente.
  if (req.nextUrl.searchParams.get('marcar') !== 'no') {
    await marcarLeidos(contactId);
  }
  return NextResponse.json({ contacto, mensajes });
}

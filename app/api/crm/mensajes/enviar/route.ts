import { NextRequest, NextResponse } from 'next/server';
import { requireApi } from '@/lib/api-auth';
import { getContacto, guardarMensaje } from '@/lib/crm';
import { enviarMensaje } from '@/lib/whatsapp';

export async function POST(req: NextRequest) {
  const auth = await requireApi('ADMIN', 'OPERATOR');
  if (!auth.ok) return auth.response;
  try {
    const { contacto_id, texto, media_url, tipo } = await req.json();
    if (!contacto_id || !texto) {
      return NextResponse.json({ error: 'Falta contacto o texto' }, { status: 400 });
    }
    const contacto = await getContacto(contacto_id);
    if (!contacto) return NextResponse.json({ error: 'Contacto no encontrado' }, { status: 404 });

    // Enviar por WhatsApp (mock en dev) y registrar en el historial.
    const envio = await enviarMensaje({ telefono: contacto.telefono, texto, mediaUrl: media_url, tipo });
    const mensaje = await guardarMensaje({
      contacto_id,
      origen: 'OPERADOR',
      tipo: tipo ?? (media_url ? 'IMAGEN' : 'TEXTO'),
      contenido: texto,
      media_url,
      leido: true,
    });
    return NextResponse.json({ mensaje, envio });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

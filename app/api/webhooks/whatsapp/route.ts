import { NextRequest, NextResponse } from 'next/server';
import { getContactoPorTelefono, upsertContacto, guardarMensaje } from '@/lib/crm';
import { autoRespuestaFueraHorario } from '@/lib/automatizaciones';

// Verificación del webhook (Meta hace un GET con hub.challenge al configurarlo).
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const mode = sp.get('hub.mode');
  const token = sp.get('hub.verify_token');
  const challenge = sp.get('hub.challenge');
  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new NextResponse(challenge ?? '', { status: 200 });
  }
  return new NextResponse('Forbidden', { status: 403 });
}

// Mensajes entrantes. Acepta el formato de Meta y también un formato simple
// para pruebas en local: { telefono, nombre, texto }.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Formato simple para pruebas locales (sin Meta)
    if (body.telefono && body.texto) {
      await recibir(body.telefono, body.nombre ?? body.telefono, body.texto);
      return NextResponse.json({ ok: true, mock: true });
    }

    // Formato Meta WhatsApp Cloud API
    const value = body?.entry?.[0]?.changes?.[0]?.value;
    const msg = value?.messages?.[0];
    if (msg) {
      const telefono = msg.from as string;
      const nombre = value?.contacts?.[0]?.profile?.name ?? telefono;
      const texto = msg.text?.body ?? '[mensaje no textual]';
      await recibir(telefono, nombre, texto);
    }
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

async function recibir(telefono: string, nombre: string, texto: string) {
  let contacto = await getContactoPorTelefono(telefono);
  if (!contacto) {
    contacto = await upsertContacto({ nombre, telefono, etiquetas: ['Nuevo'] });
  }
  if (contacto) {
    await guardarMensaje({ contacto_id: contacto.id, origen: 'CLIENTE', contenido: texto, leido: false });
    // Automatización: auto-respuesta si llega fuera del horario de atención.
    await autoRespuestaFueraHorario(contacto.id, contacto.telefono);
  }
}

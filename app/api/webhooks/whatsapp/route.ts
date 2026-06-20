import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getContactoPorTelefono, upsertContacto, guardarMensaje } from '@/lib/crm';
import { autoRespuestaFueraHorario } from '@/lib/automatizaciones';

function hmacValido(body: string, secret: string, header: string | null): boolean {
  if (!header || !header.startsWith('sha256=')) return false;
  const esperado = crypto.createHmac('sha256', secret).update(body).digest('hex');
  const recibido = header.slice('sha256='.length);
  try {
    return crypto.timingSafeEqual(Buffer.from(esperado, 'hex'), Buffer.from(recibido, 'hex'));
  } catch {
    return false;
  }
}

// Acepta firma de Meta (x-hub-signature-256) o del microservicio (x-wa-service-sig).
// Si no hay secrets configurados se acepta sin firma (modo dev).
function firmaValida(rawBody: string, req: Request): boolean {
  const metaSecret = process.env.WHATSAPP_APP_SECRET;
  const serviceSecret = process.env.WA_SERVICE_SECRET;
  if (!metaSecret && !serviceSecret) return true;

  if (serviceSecret) {
    const sig = (req as any).headers?.get?.('x-wa-service-sig') ?? null;
    if (sig && hmacValido(rawBody, serviceSecret, sig)) return true;
  }
  if (metaSecret) {
    const sig = (req as any).headers?.get?.('x-hub-signature-256') ?? null;
    if (sig && hmacValido(rawBody, metaSecret, sig)) return true;
  }
  return false;
}

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
    const rawBody = await req.text();
    if (!firmaValida(rawBody, req)) {
      return NextResponse.json({ error: 'Firma inválida' }, { status: 401 });
    }
    const body = JSON.parse(rawBody);

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

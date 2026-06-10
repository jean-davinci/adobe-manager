import 'server-only';

import { esMock } from './mock';

// Integración con WhatsApp Business Cloud API (Meta). Real cuando hay token y
// phone number id; mock en desarrollo.
const TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const GRAPH_VERSION = process.env.WHATSAPP_GRAPH_VERSION || 'v21.0';

function isMock(): boolean {
  return esMock('MOCK_WHATSAPP', !!TOKEN && !!PHONE_ID);
}

export type EnvioResult = { ok: boolean; id: string; mock: boolean };

// Normaliza el teléfono a solo dígitos (formato E.164 sin '+').
function normalizar(tel: string): string {
  return tel.replace(/[^\d]/g, '');
}

export async function enviarMensaje(opts: {
  telefono: string;
  texto: string;
  mediaUrl?: string | null;
  tipo?: 'TEXTO' | 'IMAGEN' | 'TEMPLATE';
}): Promise<EnvioResult> {
  if (isMock()) {
    console.log(`[MOCK WhatsApp →] ${opts.telefono}: ${opts.texto}${opts.mediaUrl ? ' (media)' : ''}`);
    return { ok: true, id: 'wamid.mock_' + Date.now(), mock: true };
  }

  const to = normalizar(opts.telefono);
  const body =
    opts.tipo === 'IMAGEN' && opts.mediaUrl
      ? { messaging_product: 'whatsapp', to, type: 'image', image: { link: opts.mediaUrl, caption: opts.texto } }
      : { messaging_product: 'whatsapp', to, type: 'text', text: { body: opts.texto } };

  const res = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${PHONE_ID}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(`WhatsApp API: ${data?.error?.message || res.statusText}`);
  }
  return { ok: true, id: data?.messages?.[0]?.id || 'sent', mock: false };
}

export function isMockWhatsapp() {
  return isMock();
}

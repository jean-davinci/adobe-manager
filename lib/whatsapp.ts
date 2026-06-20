import 'server-only';

import { esMock } from './mock';

// ─── Configuración ────────────────────────────────────────────────────────────
// Microservicio whatsapp-web.js (Opción A — se prefiere si está configurado)
const WA_SERVICE_URL = process.env.WA_SERVICE_URL;       // ej: https://wa.railway.app
const WA_SERVICE_SECRET = process.env.WA_SERVICE_SECRET;

// Meta WhatsApp Business Cloud API (Opción B — fallback)
const TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const GRAPH_VERSION = process.env.WHATSAPP_GRAPH_VERSION || 'v21.0';

export type EnvioResult = { ok: boolean; id: string; mock: boolean; via?: string };

function normalizar(tel: string): string {
  return tel.replace(/[^\d]/g, '');
}

function usarServicio(): boolean {
  return !!(WA_SERVICE_URL && WA_SERVICE_SECRET);
}

function isMock(): boolean {
  if (usarServicio()) return false;
  return esMock('MOCK_WHATSAPP', !!TOKEN && !!PHONE_ID);
}

// ─── Envío vía microservicio whatsapp-web.js ──────────────────────────────────
async function enviarPorServicio(opts: {
  telefono: string;
  texto: string;
  mediaUrl?: string | null;
}): Promise<EnvioResult> {
  const to = normalizar(opts.telefono);
  const endpoint = opts.mediaUrl
    ? `${WA_SERVICE_URL}/send-media`
    : `${WA_SERVICE_URL}/send`;

  const body = opts.mediaUrl
    ? { to, url: opts.mediaUrl, caption: opts.texto }
    : { to, body: opts.texto };

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${WA_SERVICE_SECRET}`,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`WA Service: ${data?.error || res.statusText}`);
  return { ok: true, id: data.id ?? 'sent', mock: false, via: 'service' };
}

// ─── Envío vía Meta Cloud API ─────────────────────────────────────────────────
async function enviarPorMeta(opts: {
  telefono: string;
  texto: string;
  mediaUrl?: string | null;
  tipo?: 'TEXTO' | 'IMAGEN' | 'TEMPLATE';
}): Promise<EnvioResult> {
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
  if (!res.ok) throw new Error(`WhatsApp API: ${data?.error?.message || res.statusText}`);
  return { ok: true, id: data?.messages?.[0]?.id || 'sent', mock: false, via: 'meta' };
}

// ─── Función principal ────────────────────────────────────────────────────────
export async function enviarMensaje(opts: {
  telefono: string;
  texto: string;
  mediaUrl?: string | null;
  tipo?: 'TEXTO' | 'IMAGEN' | 'TEMPLATE';
}): Promise<EnvioResult> {
  if (isMock()) {
    console.log(`[MOCK WhatsApp →] ${opts.telefono}: ${opts.texto}${opts.mediaUrl ? ' (media)' : ''}`);
    return { ok: true, id: 'wamid.mock_' + Date.now(), mock: true, via: 'mock' };
  }
  if (usarServicio()) return enviarPorServicio(opts);
  return enviarPorMeta(opts);
}

// ─── Estado del microservicio (para el dashboard) ─────────────────────────────
export async function getServiceStatus(): Promise<{
  connected: boolean;
  hasQr: boolean;
  phone?: string;
  name?: string;
  error?: string;
} | null> {
  if (!usarServicio()) return null;
  try {
    const res = await fetch(`${WA_SERVICE_URL}/status`, {
      headers: { Authorization: `Bearer ${WA_SERVICE_SECRET}` },
      next: { revalidate: 10 },
    });
    if (!res.ok) return { connected: false, hasQr: false, error: `HTTP ${res.status}` };
    const d = await res.json();
    return { connected: d.ready, hasQr: d.hasQr, phone: d.phone, name: d.name, error: d.error };
  } catch (e: any) {
    return { connected: false, hasQr: false, error: e.message };
  }
}

export async function getServiceQr(): Promise<string | null> {
  if (!usarServicio()) return null;
  try {
    const res = await fetch(`${WA_SERVICE_URL}/qr`, {
      headers: { Authorization: `Bearer ${WA_SERVICE_SECRET}` },
      cache: 'no-store',
    });
    const d = await res.json();
    return d.qr ?? null;
  } catch {
    return null;
  }
}

export function isMockWhatsapp() {
  return isMock();
}

export function getWhatsappMode(): 'service' | 'meta' | 'mock' {
  if (usarServicio()) return 'service';
  if (isMock()) return 'mock';
  return 'meta';
}

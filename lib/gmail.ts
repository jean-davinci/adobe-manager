import 'server-only';
import { googleConfigurado, getGmailClient } from './google';
import { esMock } from './mock';

// Lectura de la bandeja de Gmail (davincilabs.peru@gmail.com) vía Gmail API.
// Real cuando hay credenciales de Google; mock en desarrollo.
function isMock(): boolean {
  return esMock('MOCK_GMAIL', googleConfigurado());
}

export type EmailCodigo = { from: string; subject: string; date: string; code: string | null; snippet: string };
export type EmailInformeIA = { from: string; subject: string; date: string; cliente: string; adjunto: string };

function header(payload: any, name: string): string {
  return payload?.headers?.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || '';
}

function extraerTexto(payload: any): string {
  if (!payload) return '';
  if (payload.body?.data) return Buffer.from(payload.body.data, 'base64').toString('utf-8');
  const parts = payload.parts || [];
  const txt = parts.find((p: any) => p.mimeType === 'text/plain');
  if (txt?.body?.data) return Buffer.from(txt.body.data, 'base64').toString('utf-8');
  return parts.map((p: any) => extraerTexto(p)).join('\n');
}

export async function leerCodigosAcceso(): Promise<EmailCodigo[]> {
  if (isMock()) {
    const ahora = Date.now();
    const min = (m: number) => new Date(ahora - m * 60000).toISOString();
    return [
      { from: 'Adobe <message@adobe.com>', subject: 'Tu código de verificación', date: min(4), code: '482913', snippet: 'Usa este código para iniciar sesión: 482913' },
      { from: 'Adobe <message@adobe.com>', subject: 'Verification code', date: min(22), code: '710244', snippet: 'Your one-time code is 710244' },
      { from: 'Adobe <message@adobe.com>', subject: 'Código de acceso Creative Cloud', date: min(63), code: '305517', snippet: 'Código: 305517 (válido 10 min)' },
    ];
  }

  const gmail = getGmailClient();
  const list = await gmail.users.messages.list({
    userId: 'me',
    q: 'from:adobe.com (subject:código OR subject:code OR subject:verification) newer_than:1d',
    maxResults: 8,
  });
  const out: EmailCodigo[] = [];
  for (const m of (list.data.messages || []).slice(0, 8)) {
    const det = await gmail.users.messages.get({ userId: 'me', id: m.id!, format: 'full' });
    const p = det.data.payload;
    const body = extraerTexto(p);
    const code = body.match(/\b\d{6}\b/)?.[0] ?? null;
    out.push({
      from: header(p, 'From'), subject: header(p, 'Subject'), date: header(p, 'Date'),
      code, snippet: det.data.snippet || body.slice(0, 140),
    });
  }
  return out;
}

export async function leerInformesIA(): Promise<EmailInformeIA[]> {
  if (isMock()) {
    const ahora = Date.now();
    const hr = (h: number) => new Date(ahora - h * 3600000).toISOString();
    return [
      { from: 'iVerificate <no-reply@iverificate.com>', subject: 'Informe de detección de IA listo', date: hr(1), cliente: 'Lucía Torres', adjunto: 'informe_IA_lucia.pdf' },
      { from: 'Canvas Academic <reports@canvasacademic.com>', subject: 'Reporte de similitud disponible', date: hr(3), cliente: 'María Gómez', adjunto: 'similitud_maria.pdf' },
    ];
  }

  const gmail = getGmailClient();
  const list = await gmail.users.messages.list({
    userId: 'me',
    q: '(from:iverificate.com OR from:canvasacademic.com OR subject:informe OR subject:reporte) has:attachment newer_than:7d',
    maxResults: 10,
  });
  const out: EmailInformeIA[] = [];
  for (const m of (list.data.messages || []).slice(0, 10)) {
    const det = await gmail.users.messages.get({ userId: 'me', id: m.id!, format: 'full' });
    const p = det.data.payload;
    const adjunto = (p?.parts || []).find((x: any) => x.filename)?.filename || 'adjunto.pdf';
    out.push({
      from: header(p, 'From'), subject: header(p, 'Subject'), date: header(p, 'Date'),
      cliente: '', adjunto,
    });
  }
  return out;
}

export function isMockGmail() {
  return isMock();
}

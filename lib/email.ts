import 'server-only';
import { Resend } from 'resend';
import { esMock } from './mock';

// Envío de email vía Resend. Mock si MOCK_EMAIL/MOCK_MODE o sin API key.
const MOCK = esMock('MOCK_EMAIL', !!process.env.RESEND_API_KEY);
const resend = MOCK ? null : new Resend(process.env.RESEND_API_KEY);
const FROM = 'Davinci Labs <onboarding@resend.dev>';

export async function enviarEmail(to: string, subject: string, html: string): Promise<{ ok: boolean; mock: boolean; id?: string; error?: string }> {
  if (MOCK || !resend) {
    console.log(`[MOCK email →] ${to} :: ${subject}`);
    return { ok: true, mock: true };
  }
  const { data, error } = await resend.emails.send({ from: FROM, to: [to], subject, html });
  if (error) {
    console.error('Resend error:', error);
    return { ok: false, mock: false, error: error.message };
  }
  return { ok: true, mock: false, id: data?.id };
}

type ClienteEmail = {
  nombre_cliente: string;
  email_cliente?: string | null;
  email_adobe?: string | null;
  costo_servicio?: number;
  fecha_renovacion_proxima?: string | null;
};

function plantilla(titulo: string, cuerpo: string, c: ClienteEmail): string {
  const venc = c.fecha_renovacion_proxima
    ? new Date(c.fecha_renovacion_proxima).toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' })
    : '—';
  return `
  <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;background:#0f172a;color:#f1f5f9;padding:32px;border-radius:12px;">
    <h1 style="color:#60a5fa;font-size:22px;margin-bottom:4px;">Davinci Labs</h1>
    <p style="color:#94a3b8;font-size:13px;margin-top:0;">Adobe Creative Cloud</p>
    <hr style="border-color:#1e293b;margin:20px 0;"/>
    <h2 style="font-size:18px;">${titulo}</h2>
    <p>Hola <strong>${c.nombre_cliente}</strong>,</p>
    <p>${cuerpo}</p>
    <div style="background:#1e293b;border-radius:8px;padding:16px;margin:16px 0;">
      <p style="margin:6px 0;"><span style="color:#94a3b8;">📅 Vence:</span> <strong>${venc}</strong></p>
      ${c.email_adobe ? `<p style="margin:6px 0;"><span style="color:#94a3b8;">📧 Cuenta Adobe:</span> <strong>${c.email_adobe}</strong></p>` : ''}
    </div>
    <p style="color:#94a3b8;font-size:12px;">Cualquier duda, respóndenos por WhatsApp. 🙌</p>
  </div>`;
}

export function notificarRenovacion(c: ClienteEmail) {
  if (!c.email_cliente) return Promise.resolve({ ok: false, mock: MOCK });
  return enviarEmail(c.email_cliente, '🔄 Tu acceso Adobe ha sido renovado',
    plantilla('¡Renovación exitosa! 🔄', 'Tu suscripción Adobe Creative Cloud fue renovada correctamente.', c));
}

export function notificarVencimiento(c: ClienteEmail, dias: number) {
  if (!c.email_cliente) return Promise.resolve({ ok: false, mock: MOCK });
  return enviarEmail(c.email_cliente, '⏳ Tu acceso Adobe está por vencer',
    plantilla('Tu suscripción vence pronto ⏳',
      `Tu acceso Adobe vence en <strong>${dias} día(s)</strong>. Renueva para no perder el servicio.`, c));
}

export function isMockEmail() {
  return MOCK;
}

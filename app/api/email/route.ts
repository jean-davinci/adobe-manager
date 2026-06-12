import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { requireApi } from '@/lib/api-auth';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  const auth = await requireApi('ADMIN', 'OPERATOR');
  if (!auth.ok) return auth.response;

  try {
    const { tipo, cliente } = await req.json();

    const esNuevo = tipo === 'nuevo';
    const asunto = esNuevo
      ? '✅ Tu cuenta Adobe está lista'
      : '🔄 Tu cuenta Adobe ha sido renovada';

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;background:#0f172a;color:#f1f5f9;padding:32px;border-radius:12px;">
        <h1 style="color:#60a5fa;font-size:22px;margin-bottom:4px;">🎨 Adobe Manager</h1>
        <p style="color:#94a3b8;font-size:13px;margin-top:0;">Gestión de cuentas Adobe Creative Cloud</p>
        <hr style="border-color:#1e293b;margin:20px 0;"/>
        <h2 style="font-size:18px;">${esNuevo ? '¡Tu cuenta está lista! 🎉' : '¡Renovación exitosa! 🔄'}</h2>
        <p>Hola <strong>${cliente.nombre_cliente}</strong>,</p>
        <p>${esNuevo ? 'Tu cuenta Adobe Creative Cloud ha sido activada.' : 'Tu cuenta Adobe ha sido renovada exitosamente.'}</p>
        <div style="background:#1e293b;border-radius:8px;padding:20px;margin:20px 0;">
          <p style="margin:6px 0;"><span style="color:#94a3b8;">📦 Plan:</span> <strong>${cliente.plan_duracion === 12 ? '12 Meses' : cliente.plan_duracion === 6 ? '6 Meses' : cliente.plan_duracion === 3 ? '3 Meses' : '1 Mes'}</strong></p>
          <p style="margin:6px 0;"><span style="color:#94a3b8;">💰 Costo:</span> <strong style="color:#4ade80;">S/. ${Number(cliente.costo_servicio).toFixed(2)}</strong></p>
          <p style="margin:6px 0;"><span style="color:#94a3b8;">📅 Vence:</span> <strong>${new Date(cliente.fecha_renovacion_proxima).toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' })}</strong></p>
          <p style="margin:6px 0;"><span style="color:#94a3b8;">📧 Email Adobe:</span> <strong>${cliente.email_adobe}</strong></p>
        </div>
        <p style="color:#94a3b8;font-size:12px;">Si tienes dudas, responde este correo o contáctanos por WhatsApp.</p>
        <hr style="border-color:#1e293b;margin:20px 0;"/>
        <p style="color:#475569;font-size:11px;text-align:center;">Adobe Manager — Perú 🇵🇪</p>
      </div>
    `;

    const { data, error } = await resend.emails.send({
      from: 'Adobe Manager <onboarding@resend.dev>',
      to: [cliente.email_cliente],
      subject: asunto,
      html,
    });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

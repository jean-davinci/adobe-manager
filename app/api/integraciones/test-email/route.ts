import { NextRequest, NextResponse } from 'next/server';
import { requireApi } from '@/lib/api-auth';
import { enviarEmail, isMockEmail } from '@/lib/email';

// Envía un email de prueba. Solo ADMIN. Útil para verificar Resend.
export async function POST(req: NextRequest) {
  const auth = await requireApi('ADMIN');
  if (!auth.ok) return auth.response;

  const { to } = await req.json().catch(() => ({}));
  if (!to) return NextResponse.json({ error: 'Falta "to"' }, { status: 400 });

  const r = await enviarEmail(
    to,
    '✅ Prueba de integración — Davinci Labs',
    '<div style="font-family:Arial"><h2>Funciona 🎉</h2><p>Este es un email de prueba enviado desde la plataforma Davinci Labs (Resend).</p></div>'
  );
  return NextResponse.json({ mock: isMockEmail(), resultado: r });
}

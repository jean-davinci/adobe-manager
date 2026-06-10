import { NextRequest, NextResponse } from 'next/server';
import { requireApi } from '@/lib/api-auth';
import { clientesPorVencer } from '@/lib/clientes';
import { notificarVencimiento, isMockEmail } from '@/lib/email';

// Notifica por email a los afiliados cuyo acceso vence pronto.
export async function POST(req: NextRequest) {
  const auth = await requireApi('ADMIN', 'OPERATOR');
  if (!auth.ok) return auth.response;

  const dias = Number(req.nextUrl.searchParams.get('dias') ?? 7);
  const clientes = await clientesPorVencer(dias);

  let enviados = 0;
  for (const c of clientes) {
    const hoy = new Date();
    const vence = new Date(c.fecha_renovacion_proxima!);
    const restantes = Math.max(0, Math.ceil((vence.getTime() - hoy.getTime()) / 86400000));
    const r = await notificarVencimiento(c, restantes);
    if (r.ok) enviados++;
  }

  return NextResponse.json({
    mock: isMockEmail(),
    total: clientes.length,
    enviados,
    clientes: clientes.map((c) => ({ nombre: c.nombre_cliente, email: c.email_cliente, vence: c.fecha_renovacion_proxima })),
  });
}

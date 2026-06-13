import { NextRequest, NextResponse } from 'next/server';
import { slotsDisponibles, configAsesorias } from '@/lib/asesorias';
import { rateLimit, clienteIP } from '@/lib/rate-limit';

// GET /api/asesorias/disponibilidad?fecha=YYYY-MM-DD — público (lo usa la landing).
// Rate-limit anti-scraping: 60 consultas por IP cada 5 minutos.
export async function GET(req: NextRequest) {
  const ip = clienteIP(req.headers);
  const limite = rateLimit(`disponibilidad:${ip}`, 60, 5 * 60 * 1000);
  if (!limite.ok) {
    return NextResponse.json(
      { error: `Demasiadas consultas. Intenta en ${limite.retryAfter}s.` },
      { status: 429, headers: { 'Retry-After': String(limite.retryAfter) } }
    );
  }
  try {
    const fecha = req.nextUrl.searchParams.get('fecha');
    if (!fecha || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      return NextResponse.json({ error: 'Fecha inválida (YYYY-MM-DD)' }, { status: 400 });
    }
    const slots = await slotsDisponibles(fecha);
    return NextResponse.json({ fecha, slots, config: configAsesorias() });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

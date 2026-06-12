import { NextRequest, NextResponse } from 'next/server';
import { requireApi } from '@/lib/api-auth';
import { listarAsesorias, reservarAsesoria } from '@/lib/asesorias';
import { rateLimit, clienteIP } from '@/lib/rate-limit';

const recortar = (v: unknown, max: number) =>
  typeof v === 'string' ? v.trim().slice(0, max) : undefined;

// GET /api/asesorias — agenda (staff).
export async function GET(req: NextRequest) {
  const auth = await requireApi('ADMIN', 'OPERATOR');
  if (!auth.ok) return auth.response;
  const desde = req.nextUrl.searchParams.get('desde') ?? undefined;
  const lista = await listarAsesorias({ desde });
  return NextResponse.json(lista);
}

// POST /api/asesorias — reservar (público: lo usa la landing).
export async function POST(req: NextRequest) {
  try {
    // Anti-spam: máx. 5 reservas por IP cada 10 minutos.
    const ip = clienteIP(req.headers);
    const limite = rateLimit(`asesoria:${ip}`, 5, 10 * 60 * 1000);
    if (!limite.ok) {
      return NextResponse.json(
        { error: `Demasiadas solicitudes. Intenta en ${limite.retryAfter}s.` },
        { status: 429 }
      );
    }

    const body = await req.json();
    const nombre = recortar(body?.nombre, 120);
    const email = recortar(body?.email, 160);
    const telefono = recortar(body?.telefono, 30);
    const fecha = recortar(body?.fecha, 10);
    const hora = recortar(body?.hora, 5);
    const notas = recortar(body?.notas, 500);

    if (!nombre || !fecha || !hora) {
      return NextResponse.json({ error: 'nombre, fecha y hora son requeridos' }, { status: 400 });
    }
    if (!telefono && !email) {
      return NextResponse.json({ error: 'Deja al menos un medio de contacto (WhatsApp o email)' }, { status: 400 });
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Email inválido' }, { status: 400 });
    }
    const asesoria = await reservarAsesoria({ nombre, email, telefono, fecha, hora, notas });
    return NextResponse.json({ ok: true, asesoria });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { requireApi } from '@/lib/api-auth';
import { listarYapes, resumenYapes, crearPagoYape } from '@/lib/yape';

// GET /api/agente/yapes?desde=YYYY-MM-DD&hasta=YYYY-MM-DD
export async function GET(req: NextRequest) {
  const auth = await requireApi('ADMIN', 'OPERATOR');
  if (!auth.ok) return auth.response;
  const desde = req.nextUrl.searchParams.get('desde') ?? undefined;
  const hasta = req.nextUrl.searchParams.get('hasta') ?? undefined;
  const [pagos, resumen] = await Promise.all([
    listarYapes({ desde, hasta }),
    resumenYapes(desde, hasta),
  ]);
  return NextResponse.json({ pagos, resumen });
}

// POST /api/agente/yapes  → registro manual de un Yape
export async function POST(req: NextRequest) {
  const auth = await requireApi('ADMIN', 'OPERATOR');
  if (!auth.ok) return auth.response;
  try {
    const body = await req.json();
    const monto = Number(body?.monto);
    if (!Number.isFinite(monto) || monto <= 0) {
      return NextResponse.json({ error: 'Monto inválido' }, { status: 400 });
    }
    const pago = await crearPagoYape({
      contacto_id: body?.contacto_id ?? null,
      monto,
      pagador: typeof body?.pagador === 'string' ? body.pagador.slice(0, 120) : null,
      fecha_pago: body?.fecha_pago,
      imagen_url: body?.imagen_url ?? null,
      registrarEnFinanzas: body?.registrar !== false,
    });
    return NextResponse.json({ ok: true, pago });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

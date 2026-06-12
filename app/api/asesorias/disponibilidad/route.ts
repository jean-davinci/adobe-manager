import { NextRequest, NextResponse } from 'next/server';
import { slotsDisponibles, configAsesorias } from '@/lib/asesorias';

// GET /api/asesorias/disponibilidad?fecha=YYYY-MM-DD — público (lo usa la landing).
export async function GET(req: NextRequest) {
  try {
    const fecha = req.nextUrl.searchParams.get('fecha');
    if (!fecha) return NextResponse.json({ error: 'Falta fecha' }, { status: 400 });
    const slots = await slotsDisponibles(fecha);
    return NextResponse.json({ fecha, slots, config: configAsesorias() });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

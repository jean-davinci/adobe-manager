import { NextRequest, NextResponse } from 'next/server';
import { requireApi } from '@/lib/api-auth';
import { procesarInforme } from '@/lib/informes';

// POST /api/informes/generate
// Body: { documentoId, porcentajeIA, porcentajeSimilitud, notas? }
// Genera el PDF, lo sube a Drive y notifica al cliente por email + WhatsApp.
export async function POST(req: NextRequest) {
  const auth = await requireApi('ADMIN', 'OPERATOR');
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json();
    const { documentoId, porcentajeIA, porcentajeSimilitud, notas } = body ?? {};

    if (!documentoId || typeof documentoId !== 'string') {
      return NextResponse.json({ success: false, error: 'documentoId requerido' }, { status: 400 });
    }
    const ia = Number(porcentajeIA);
    const sim = Number(porcentajeSimilitud);
    if (!Number.isFinite(ia) || !Number.isFinite(sim) || ia < 0 || ia > 100 || sim < 0 || sim > 100) {
      return NextResponse.json({ success: false, error: 'Porcentajes inválidos (0–100)' }, { status: 400 });
    }

    const r = await procesarInforme({
      documentoId,
      porcentajeIA: ia,
      porcentajeSimilitud: sim,
      notas: typeof notas === 'string' ? notas : undefined,
      operador: auth.session.nombre,
    });

    return NextResponse.json({ success: true, ...r });
  } catch (err: any) {
    console.error('[informes/generate]', err);
    return NextResponse.json({ success: false, error: err.message ?? 'Error interno' }, { status: 500 });
  }
}

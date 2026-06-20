import { NextRequest, NextResponse } from 'next/server';
import { requireApi } from '@/lib/api-auth';
import { generarReporteDiario, reporteGuardado } from '@/lib/agente-acciones';

// GET /api/agente/reporte-diario?fecha=YYYY-MM-DD&generar=true
// Sin generar=true → devuelve el reporte guardado (si existe).
// Con generar=true o si no existe → llama a Davinci para generarlo.
export async function GET(req: NextRequest) {
  const auth = await requireApi('ADMIN', 'OPERATOR');
  if (!auth.ok) return auth.response;
  const sp = req.nextUrl.searchParams;
  const fecha = sp.get('fecha') ?? new Date().toLocaleDateString('en-CA', { timeZone: 'America/Lima' });
  const generar = sp.get('generar') === 'true';

  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    return NextResponse.json({ error: 'Fecha inválida (YYYY-MM-DD)' }, { status: 400 });
  }

  if (!generar) {
    const guardado = await reporteGuardado(fecha);
    if (guardado) return NextResponse.json({ fecha: guardado.fecha, contenido: guardado.contenido, metricas: guardado.metricas, generado: false });
  }
  const r = await generarReporteDiario(fecha);
  return NextResponse.json({ ...r, generado: true });
}

// POST /api/agente/reporte-diario → fuerza la regeneración del día actual.
export async function POST() {
  const auth = await requireApi('ADMIN', 'OPERATOR');
  if (!auth.ok) return auth.response;
  const r = await generarReporteDiario();
  return NextResponse.json({ ...r, generado: true });
}

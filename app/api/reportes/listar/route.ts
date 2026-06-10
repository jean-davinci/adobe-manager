// app/api/reportes/listar/route.ts
// GET /api/reportes/listar?plataforma=iverificate | canvas
import { NextRequest, NextResponse } from 'next/server';
import { requireApi } from '@/lib/api-auth';
import { listarReportesIVerificate } from '@/lib/scrapers/iverificate-scraper';
import { listarReportesCanvas } from '@/lib/scrapers/canvas-scraper';
import { isMockScrapers } from '@/lib/scrapers/scraper-base';

export async function GET(req: NextRequest) {
  const auth = await requireApi('ADMIN', 'OPERATOR');
  if (!auth.ok) return auth.response;

  const plataforma = req.nextUrl.searchParams.get('plataforma');
  if (!plataforma) {
    return NextResponse.json({ error: 'Parámetro plataforma requerido' }, { status: 400 });
  }

  try {
    let reportes;
    if (plataforma === 'iverificate') reportes = await listarReportesIVerificate();
    else if (plataforma === 'canvas') reportes = await listarReportesCanvas();
    else return NextResponse.json({ error: 'Plataforma no soportada' }, { status: 400 });

    return NextResponse.json({ mock: isMockScrapers(), reportes });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

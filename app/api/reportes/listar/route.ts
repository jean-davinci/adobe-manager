// app/api/reportes/listar/route.ts
// GET /api/reportes/listar?plataforma=iverificate
// GET /api/reportes/listar?plataforma=canvas

import { NextRequest, NextResponse } from 'next/server';
import { listarReportesIVerificate } from '@/lib/scrapers/iverificate-scraper';
import { listarReportesCanvas } from '@/lib/scrapers/canvas-scraper';

export async function GET(req: NextRequest) {
  const plataforma = req.nextUrl.searchParams.get('plataforma');

  if (!plataforma) {
    return NextResponse.json({ error: 'Parámetro plataforma requerido' }, { status: 400 });
  }

  try {
    let reportes;

    if (plataforma === 'iverificate') {
      reportes = await listarReportesIVerificate();
    } else if (plataforma === 'canvas') {
      reportes = await listarReportesCanvas();
    } else {
      return NextResponse.json({ error: 'Plataforma no soportada' }, { status: 400 });
    }

    return NextResponse.json({ reportes });

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error desconocido';
    console.error('Error al listar reportes:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
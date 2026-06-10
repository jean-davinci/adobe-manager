// app/api/reportes/descargar/route.ts
// POST /api/reportes/descargar
// Body: { plataforma, reporteId, documentoId, nombreCliente }
import { NextRequest, NextResponse } from 'next/server';
import { requireApi } from '@/lib/api-auth';
import { descargarReporteIVerificate } from '@/lib/scrapers/iverificate-scraper';
import { descargarReporteCanvas } from '@/lib/scrapers/canvas-scraper';
import { isMockScrapers } from '@/lib/scrapers/scraper-base';
import { getDocumento, setReporte } from '@/lib/documentos';

export async function POST(req: NextRequest) {
  const auth = await requireApi('ADMIN', 'OPERATOR');
  if (!auth.ok) return auth.response;

  const { plataforma, reporteId, documentoId, nombreCliente } = await req.json();
  if (!plataforma || !reporteId || !documentoId) {
    return NextResponse.json({ error: 'Faltan parámetros (plataforma, reporteId, documentoId)' }, { status: 400 });
  }

  const doc = await getDocumento(documentoId);
  if (!doc) return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 });
  const cliente = nombreCliente || doc.cliente_nombre;

  try {
    let urlReporte: string;
    if (plataforma === 'iverificate') urlReporte = await descargarReporteIVerificate(reporteId, cliente);
    else if (plataforma === 'canvas') urlReporte = await descargarReporteCanvas(reporteId, cliente);
    else return NextResponse.json({ error: 'Plataforma no soportada' }, { status: 400 });

    const actualizado = await setReporte(documentoId, plataforma, urlReporte);
    return NextResponse.json({
      success: true,
      mock: isMockScrapers(),
      urlReporte,
      documento: actualizado,
      mensaje: `Reporte de ${plataforma === 'iverificate' ? 'iVerificate (IA)' : 'Canvas (Similitud)'} adjuntado.`,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

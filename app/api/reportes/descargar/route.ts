// app/api/reportes/descargar/route.ts
// POST /api/reportes/descargar
// Body: { plataforma, reporteId, servicioId, nombreCliente }

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { descargarReporteIVerificate } from '@/lib/scrapers/iverificate-scraper';
import { descargarReporteCanvas } from '@/lib/scrapers/canvas-scraper';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const { plataforma, reporteId, servicioId, nombreCliente } = await req.json();

  if (!plataforma || !reporteId || !servicioId || !nombreCliente) {
    return NextResponse.json({ error: 'Faltan parámetros requeridos' }, { status: 400 });
  }

  try {
    let urlReporte: string;

    // 1. Descargar de la plataforma y subir a Supabase Storage
    if (plataforma === 'iverificate') {
      urlReporte = await descargarReporteIVerificate(reporteId, nombreCliente);
    } else if (plataforma === 'canvas') {
      urlReporte = await descargarReporteCanvas(reporteId, nombreCliente);
    } else {
      return NextResponse.json({ error: 'Plataforma no soportada' }, { status: 400 });
    }

    // 2. Guardar la URL en el servicio correspondiente en Supabase DB
    const campoReporte = plataforma === 'iverificate' ? 'reporte_ia_url' : 'reporte_turnitin_url';

    const { error: dbError } = await supabase
      .from('servicios')
      .update({
        [campoReporte]: urlReporte,
        updated_at: new Date().toISOString(),
      })
      .eq('id', servicioId);

    if (dbError) {
      console.error('Error guardando URL en BD:', dbError);
      // No es fatal — la URL se descargó igual, solo no se guardó en BD
    }

    return NextResponse.json({
      success: true,
      urlReporte,
      mensaje: `Reporte de ${plataforma === 'iverificate' ? 'iVerificate (IA)' : 'Canvas (Turnitin)'} descargado correctamente`,
    });

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error desconocido';
    console.error('Error al descargar reporte:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
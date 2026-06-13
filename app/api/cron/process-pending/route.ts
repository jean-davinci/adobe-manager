import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { procesarInforme } from '@/lib/informes';

// GET /api/cron/process-pending — worker periódico (cada 5 min).
// 1. Documentos RECIBIDO → en MOCK los procesa con % simulados; en real los
//    pasa a EN_PROCESO para que el operador complete desde el panel.
// 2. (Asesorías) recordatorios WhatsApp 1h antes — ver sección al final.
function autorizado(req: NextRequest): boolean {
  const auth = req.headers.get('authorization');
  if (process.env.CRON_SECRET && auth === `Bearer ${process.env.CRON_SECRET}`) return true;
  if (req.headers.get('x-vercel-cron')) return true;
  // En desarrollo permitimos invocarlo a mano. En producción exigimos CRON_SECRET.
  if (process.env.NODE_ENV === 'production') return false;
  return true;
}

export async function GET(req: NextRequest) {
  if (!autorizado(req)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const isMock = process.env.MOCK_MODE === 'true';
  const autoEnabled = process.env.AUTO_PROCESS_ENABLED !== 'false';

  const resultados: { id: string; status: string; error?: string }[] = [];

  if (autoEnabled) {
    const pendientes = await query<{ id: string }>(
      `select id from documentos where estado = 'RECIBIDO' order by created_at asc limit 10`
    );

    for (const doc of pendientes) {
      try {
        // Marcar EN_PROCESO para evitar doble procesamiento
        await query(`update documentos set estado = 'EN_PROCESO' where id = $1 and estado = 'RECIBIDO'`, [doc.id]);

        if (isMock) {
          // MOCK: resultados simulados → informe completo automático
          const mockIA = Math.floor(Math.random() * 25);
          const mockSim = Math.floor(Math.random() * 20);
          await procesarInforme({
            documentoId: doc.id,
            porcentajeIA: mockIA,
            porcentajeSimilitud: mockSim,
            operador: 'Worker automático',
          });
          resultados.push({ id: doc.id, status: 'completado-mock' });
        } else {
          // PRODUCCIÓN: integración con iVerificate/Canvas pendiente de API.
          // El documento queda EN_PROCESO para que el operador lo complete.
          resultados.push({ id: doc.id, status: 'en_proceso_manual' });
        }
      } catch (err: any) {
        await query(`update documentos set estado = 'RECIBIDO' where id = $1`, [doc.id]).catch(() => {});
        resultados.push({ id: doc.id, status: 'error', error: err.message });
      }
    }
  }

  // ── Recordatorios de asesorías (1h antes) ────────────────────────────────
  let recordatorios = 0;
  try {
    const { enviarRecordatoriosPendientes } = await import('@/lib/asesorias');
    recordatorios = await enviarRecordatoriosPendientes();
  } catch {
    // Módulo de asesorías aún sin migrar — ignorar.
  }

  return NextResponse.json({
    processed: resultados.filter((r) => r.status !== 'error').length,
    failed: resultados.filter((r) => r.status === 'error').length,
    recordatorios,
    resultados,
    timestamp: new Date().toISOString(),
  });
}

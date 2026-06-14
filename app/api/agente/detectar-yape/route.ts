import { NextRequest, NextResponse } from 'next/server';
import { requireApi } from '@/lib/api-auth';
import { detectarYape, registrarYapeDetectado } from '@/lib/agente-acciones';
import { validarImagenBase64 } from '@/lib/agente-davinci';

// POST /api/agente/detectar-yape
// Body: { imagen: { base64, mimeType }, contactoId?, imagenUrl?, registrar?: boolean = true }
// Devuelve la detección y, si registrar = true (default), crea pagos_yape + transacción.
export async function POST(req: NextRequest) {
  const auth = await requireApi('ADMIN', 'OPERATOR');
  if (!auth.ok) return auth.response;
  try {
    const body = await req.json();
    if (!body?.imagen?.base64 || !body?.imagen?.mimeType) {
      return NextResponse.json({ error: 'Falta imagen { base64, mimeType }' }, { status: 400 });
    }
    const v = validarImagenBase64(body.imagen.base64, body.imagen.mimeType);
    if (!v.ok) return NextResponse.json({ error: v.error }, { status: 400 });

    const deteccion = await detectarYape({ mimeType: body.imagen.mimeType, base64: body.imagen.base64 });

    if (deteccion.monto == null) {
      return NextResponse.json({ ok: false, deteccion, error: 'No se pudo extraer el monto' });
    }

    let pago = null;
    if (body?.registrar !== false) {
      pago = await registrarYapeDetectado({
        contactoId: body?.contactoId ?? null,
        monto: deteccion.monto,
        pagador: deteccion.pagador,
        fecha: deteccion.fecha ?? undefined,
        imagenUrl: body?.imagenUrl ?? null,
      });
    }
    return NextResponse.json({ ok: true, deteccion, pago });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

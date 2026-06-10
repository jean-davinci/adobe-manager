import { NextRequest, NextResponse } from 'next/server';
import { requireApi } from '@/lib/api-auth';
import { actualizarEstado, type DocEstado } from '@/lib/documentos';
import { etiquetarPedidoCompletado } from '@/lib/automatizaciones';

const VALIDOS: DocEstado[] = ['RECIBIDO', 'EN_PROCESO', 'COMPLETADO'];

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await requireApi('ADMIN', 'OPERATOR');
  if (!auth.ok) return auth.response;
  try {
    const { id } = await context.params;
    const { estado } = await req.json();
    if (!VALIDOS.includes(estado)) {
      return NextResponse.json({ error: 'Estado inválido' }, { status: 400 });
    }
    const data = await actualizarEstado(id, estado, auth.session.nombre);
    // Automatización: al completar el pedido, etiquetar al contacto.
    if (estado === 'COMPLETADO' && data?.cliente_email) {
      await etiquetarPedidoCompletado(data.cliente_email);
    }
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

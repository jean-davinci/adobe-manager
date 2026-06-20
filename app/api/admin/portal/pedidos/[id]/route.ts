import { NextRequest, NextResponse } from 'next/server';
import { requireApi } from '@/lib/api-auth';
import { actualizarPedido, getPedido } from '@/lib/portal';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

// PATCH: actualizar estado del pedido + subir reporte
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApi('ADMIN', 'OPERATOR');
  if (!auth.ok) return auth.response;

  const { id } = await params;

  try {
    const ct = req.headers.get('content-type') ?? '';

    let body: any;
    let reporteUrl: string | null = null;

    if (ct.includes('multipart/form-data')) {
      const fd = await req.formData();
      const reporte = fd.get('reporte') as File | null;
      body = {
        estado: fd.get('estado') as string,
        similitud_pct: fd.get('similitud_pct') ? Number(fd.get('similitud_pct')) : undefined,
        ia_pct: fd.get('ia_pct') ? Number(fd.get('ia_pct')) : undefined,
        palabras: fd.get('palabras') ? Number(fd.get('palabras')) : undefined,
        error_msg: fd.get('error_msg') as string | null,
      };
      if (reporte) {
        const dir = path.join(process.cwd(), 'public', 'portal-reportes');
        await mkdir(dir, { recursive: true });
        const safe = `${id}_${Date.now()}_${reporte.name.replace(/[^\w.\-]/g, '_')}`;
        await writeFile(path.join(dir, safe), Buffer.from(await reporte.arrayBuffer()));
        reporteUrl = `/portal-reportes/${safe}`;
      }
    } else {
      body = await req.json();
    }

    const pedido = await actualizarPedido(id, {
      estado: body.estado,
      similitudPct: body.similitud_pct ?? null,
      iaPct: body.ia_pct ?? null,
      palabras: body.palabras ?? null,
      reporteUrl: reporteUrl ?? body.reporte_url ?? null,
      errorMsg: body.error_msg ?? null,
    });

    if (!pedido) return NextResponse.json({ error: 'Pedido no encontrado.' }, { status: 404 });
    return NextResponse.json({ pedido });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApi('ADMIN', 'OPERATOR');
  if (!auth.ok) return auth.response;
  const { id } = await params;
  const pedido = await getPedido(id);
  if (!pedido) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
  return NextResponse.json(pedido);
}

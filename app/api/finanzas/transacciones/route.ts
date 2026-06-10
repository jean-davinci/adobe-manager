import { NextRequest, NextResponse } from 'next/server';
import { requireApi } from '@/lib/api-auth';
import { listarTransacciones, crearTransaccion, type TipoTx } from '@/lib/finanzas';

export async function GET(req: NextRequest) {
  const auth = await requireApi('ADMIN', 'OPERATOR');
  if (!auth.ok) return auth.response;

  const sp = req.nextUrl.searchParams;
  try {
    const data = await listarTransacciones({
      from: sp.get('from') ?? undefined,
      to: sp.get('to') ?? undefined,
      tipo: (sp.get('tipo') as TipoTx) ?? undefined,
      categoria: sp.get('categoria') ?? undefined,
    });
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireApi('ADMIN', 'OPERATOR');
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json();
    if (!body.tipo || !body.categoria || body.monto == null) {
      return NextResponse.json({ error: 'Faltan campos: tipo, categoria, monto' }, { status: 400 });
    }
    const data = await crearTransaccion({
      tipo: body.tipo,
      categoria: body.categoria,
      monto: parseFloat(body.monto),
      moneda: body.moneda,
      descripcion: body.descripcion,
      cliente_nombre: body.cliente_nombre,
      proveedor_id: body.proveedor_id || null,
      comprobante_url: body.comprobante_url || null,
      fecha: body.fecha || null,
    });
    return NextResponse.json(data, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

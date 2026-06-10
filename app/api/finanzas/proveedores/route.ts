import { NextRequest, NextResponse } from 'next/server';
import { requireApi } from '@/lib/api-auth';
import { listarProveedoresConGasto, crearProveedor, eliminarProveedor } from '@/lib/finanzas';

export async function GET() {
  const auth = await requireApi('ADMIN', 'OPERATOR');
  if (!auth.ok) return auth.response;
  return NextResponse.json(await listarProveedoresConGasto());
}

export async function POST(req: NextRequest) {
  const auth = await requireApi('ADMIN', 'OPERATOR');
  if (!auth.ok) return auth.response;
  try {
    const body = await req.json();
    if (!body.nombre) return NextResponse.json({ error: 'Falta nombre' }, { status: 400 });
    const data = await crearProveedor({
      nombre: body.nombre,
      servicio: body.servicio,
      costo_por_uso: body.costo_por_uso != null && body.costo_por_uso !== '' ? parseFloat(body.costo_por_uso) : null,
      umbral_alerta: body.umbral_alerta != null && body.umbral_alerta !== '' ? parseFloat(body.umbral_alerta) : null,
    });
    return NextResponse.json(data, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await requireApi('ADMIN', 'OPERATOR');
  if (!auth.ok) return auth.response;
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Falta id' }, { status: 400 });
  await eliminarProveedor(id);
  return NextResponse.json({ ok: true });
}

import { NextRequest, NextResponse } from 'next/server';
import { requireApi } from '@/lib/api-auth';
import { crearCompra, PAQUETES } from '@/lib/portal';

export async function POST(req: NextRequest) {
  const auth = await requireApi('CLIENT');
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json();
    const { paquete, referencia, imagenUrl } = body;

    if (!paquete || !PAQUETES[paquete]) {
      return NextResponse.json({ error: 'Paquete inválido.' }, { status: 400 });
    }

    const compra = await crearCompra({
      usuarioId: auth.session.userId,
      paquete,
      referencia: referencia || null,
      imagenUrl: imagenUrl || null,
    });

    return NextResponse.json({ compra }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

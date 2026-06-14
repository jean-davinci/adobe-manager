import { NextRequest, NextResponse } from 'next/server';
import { requireApi } from '@/lib/api-auth';
import { crearPedido, descontarCredito, getSaldo, listarPedidos } from '@/lib/portal';

export async function GET(_req: NextRequest) {
  const auth = await requireApi('CLIENT');
  if (!auth.ok) return auth.response;
  const pedidos = await listarPedidos(auth.session.userId);
  return NextResponse.json(pedidos);
}

export async function POST(req: NextRequest) {
  const auth = await requireApi('CLIENT');
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json();
    const { nombreArchivo, archivoUrl } = body;
    if (!nombreArchivo || !archivoUrl) {
      return NextResponse.json({ error: 'Faltan campos.' }, { status: 400 });
    }

    // Descontar crédito — atómico, falla si saldo < 1
    const ok = await descontarCredito(auth.session.userId);
    if (!ok) {
      return NextResponse.json({ error: 'Sin créditos disponibles.' }, { status: 402 });
    }

    const pedido = await crearPedido({
      usuarioId: auth.session.userId,
      nombreArchivo,
      archivoUrl,
    });
    const saldo = await getSaldo(auth.session.userId);

    return NextResponse.json({ pedido, saldo }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

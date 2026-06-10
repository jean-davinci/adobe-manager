import { NextResponse } from 'next/server';
import { siguienteNumeroPedido } from '@/lib/clientes';

export async function GET() {
  try {
    const numero_pedido = await siguienteNumeroPedido();
    return NextResponse.json({ numero_pedido });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

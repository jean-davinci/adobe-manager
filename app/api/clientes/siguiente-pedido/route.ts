import { NextResponse } from 'next/server';
import { siguienteNumeroPedido } from '@/lib/clientes';
import { requireApi } from '@/lib/api-auth';

export async function GET() {
  const auth = await requireApi('ADMIN', 'OPERATOR');
  if (!auth.ok) return auth.response;

  try {
    const numero_pedido = await siguienteNumeroPedido();
    return NextResponse.json({ numero_pedido });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

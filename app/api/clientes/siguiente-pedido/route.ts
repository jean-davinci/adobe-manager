import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  const { data, error } = await supabase
    .from('clientes_adobe')
    .select('numero_pedido')
    .order('numero_pedido', { ascending: false })
    .limit(1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let siguiente = '#0001';
  if (data && data.length > 0) {
    const ultimo = data[0].numero_pedido;
    const numero = parseInt(ultimo.replace('#', '')) + 1;
    siguiente = '#' + String(numero).padStart(4, '0');
  }

  return NextResponse.json({ numero_pedido: siguiente });
}

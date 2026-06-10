import { NextRequest, NextResponse } from 'next/server';
import { requireApi } from '@/lib/api-auth';
import { historialProveedor } from '@/lib/finanzas';

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await requireApi('ADMIN', 'OPERATOR');
  if (!auth.ok) return auth.response;
  const { id } = await context.params;
  return NextResponse.json(await historialProveedor(id));
}

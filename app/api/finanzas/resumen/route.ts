import { NextResponse } from 'next/server';
import { requireApi } from '@/lib/api-auth';
import { resumenDashboard } from '@/lib/finanzas';

export async function GET() {
  const auth = await requireApi('ADMIN', 'OPERATOR');
  if (!auth.ok) return auth.response;
  try {
    const data = await resumenDashboard();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

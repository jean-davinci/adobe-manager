import { NextResponse } from 'next/server';
import { requireApi } from '@/lib/api-auth';

const WA_SERVICE_URL = process.env.WA_SERVICE_URL;
const WA_SERVICE_SECRET = process.env.WA_SERVICE_SECRET;

export async function POST() {
  const auth = await requireApi('ADMIN');
  if (!auth.ok) return auth.response;

  if (!WA_SERVICE_URL || !WA_SERVICE_SECRET) {
    return NextResponse.json({ error: 'Servicio no configurado' }, { status: 503 });
  }

  const res = await fetch(`${WA_SERVICE_URL}/logout`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${WA_SERVICE_SECRET}` },
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

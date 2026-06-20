import { NextResponse } from 'next/server';
import { requireApi } from '@/lib/api-auth';
import { getServiceStatus, getServiceQr } from '@/lib/whatsapp';

export const dynamic = 'force-dynamic';

export async function GET() {
  const auth = await requireApi('ADMIN');
  if (!auth.ok) return auth.response;

  const status = await getServiceStatus();
  const qr = status?.hasQr ? await getServiceQr() : null;
  return NextResponse.json({ status, qr });
}

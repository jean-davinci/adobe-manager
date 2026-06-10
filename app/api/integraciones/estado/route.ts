import { NextResponse } from 'next/server';
import { requireApi } from '@/lib/api-auth';
import { estadoIntegraciones, modoGlobalMock } from '@/lib/integraciones';

export async function GET() {
  const auth = await requireApi('ADMIN');
  if (!auth.ok) return auth.response;
  return NextResponse.json({
    mockGlobal: modoGlobalMock(),
    integraciones: estadoIntegraciones(),
  });
}

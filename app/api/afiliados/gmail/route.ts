import { NextResponse } from 'next/server';
import { requireApi } from '@/lib/api-auth';
import { leerCodigosAcceso, leerInformesIA, isMockGmail } from '@/lib/gmail';

// Lee la bandeja de Gmail: códigos de acceso de Adobe + informes de IA.
export async function GET() {
  const auth = await requireApi('ADMIN', 'OPERATOR');
  if (!auth.ok) return auth.response;
  try {
    const [codigos, informes] = await Promise.all([leerCodigosAcceso(), leerInformesIA()]);
    return NextResponse.json({ mock: isMockGmail(), codigos, informes });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

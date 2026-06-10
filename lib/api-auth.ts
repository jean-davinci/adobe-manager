import 'server-only';
import { NextResponse } from 'next/server';
import { getSession } from './dal';
import type { Rol } from './db';
import type { SessionPayload } from './session';

type Guard =
  | { ok: true; session: SessionPayload }
  | { ok: false; response: NextResponse };

// Uso en route handlers:
//   const auth = await requireApi('ADMIN','OPERATOR');
//   if (!auth.ok) return auth.response;
export async function requireApi(...roles: Rol[]): Promise<Guard> {
  const session = await getSession();
  if (!session?.userId) {
    return { ok: false, response: NextResponse.json({ error: 'No autenticado' }, { status: 401 }) };
  }
  if (roles.length && !roles.includes(session.rol)) {
    return { ok: false, response: NextResponse.json({ error: 'Sin permisos' }, { status: 403 }) };
  }
  return { ok: true, session };
}

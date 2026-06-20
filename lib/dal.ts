import 'server-only';
import { cache } from 'react';
import { redirect } from 'next/navigation';
import { decrypt, getSessionCookie, type SessionPayload } from './session';
import type { Rol } from './db';
import { getUsuarioById, type UsuarioPublico } from './usuarios';

// Lee y valida la sesión desde la cookie. No redirige.
export const getSession = cache(async (): Promise<SessionPayload | null> => {
  const cookie = await getSessionCookie();
  return decrypt(cookie);
});

// Exige sesión válida; redirige a /login si no hay.
export const verifySession = cache(async (): Promise<SessionPayload> => {
  const session = await getSession();
  if (!session?.userId) {
    redirect('/login');
  }
  return session;
});

// Exige uno de los roles dados; redirige si no cumple.
export async function requireRole(...roles: Rol[]): Promise<SessionPayload> {
  const session = await verifySession();
  if (!roles.includes(session.rol)) {
    // El cliente no entra al área de staff y viceversa.
    redirect(session.rol === 'CLIENT' ? '/portal' : '/dashboard');
  }
  return session;
}

// Trae el usuario completo desde la DB (chequeo seguro contra Postgres).
export const getCurrentUser = cache(async (): Promise<UsuarioPublico | null> => {
  const session = await getSession();
  if (!session?.userId) return null;

  const usuario = await getUsuarioById(session.userId);
  if (!usuario || !usuario.activo) return null;
  return usuario;
});

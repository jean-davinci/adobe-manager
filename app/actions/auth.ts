'use server';

import { z } from 'zod';
import bcrypt from 'bcrypt';
import { redirect } from 'next/navigation';
import { getUsuarioByEmail } from '@/lib/usuarios';
import { createSession, deleteSession } from '@/lib/session';

const LoginSchema = z.object({
  email: z.email({ error: 'Ingresa un email válido.' }).trim().toLowerCase(),
  password: z.string().min(1, { error: 'Ingresa tu contraseña.' }),
});

export type LoginState =
  | { error?: string; fields?: { email?: string; password?: string } }
  | undefined;

export async function login(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const parsed = LoginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!parsed.success) {
    const f = parsed.error.flatten().fieldErrors;
    return { fields: { email: f.email?.[0], password: f.password?.[0] } };
  }

  const { email, password } = parsed.data;

  const usuario = await getUsuarioByEmail(email);

  // Mensaje genérico para no revelar si el email existe.
  if (!usuario || !usuario.activo) {
    return { error: 'Credenciales inválidas.' };
  }

  const ok = await bcrypt.compare(password, usuario.password_hash);
  if (!ok) {
    return { error: 'Credenciales inválidas.' };
  }

  await createSession({
    userId: usuario.id,
    rol: usuario.rol,
    nombre: usuario.nombre,
  });

  redirect(usuario.rol === 'CLIENT' ? '/mi-acceso' : '/dashboard');
}

export async function logout(): Promise<void> {
  await deleteSession();
  redirect('/login');
}

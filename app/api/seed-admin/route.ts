import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { contarUsuarios, crearUsuario } from '@/lib/usuarios';

// Crea el PRIMER usuario admin. Solo funciona si la tabla está vacía,
// por lo que no puede usarse para crear usuarios extra. Borrar este
// archivo una vez exista el admin si se desea.
export async function POST(req: Request) {
  let total: number;
  try {
    total = await contarUsuarios();
  } catch (e) {
    return NextResponse.json(
      { error: 'No se pudo consultar la tabla usuarios. ¿Corriste la migración SQL?', detalle: String(e) },
      { status: 500 }
    );
  }

  if (total > 0) {
    return NextResponse.json(
      { error: 'Ya existen usuarios. El seed solo crea el primer admin.' },
      { status: 403 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const { email, nombre, password } = body as Record<string, string>;
  if (!email || !nombre || !password) {
    return NextResponse.json(
      { error: 'Faltan campos: email, nombre, password.' },
      { status: 400 }
    );
  }

  const password_hash = await bcrypt.hash(password, 10);
  const usuario = await crearUsuario({ email, nombre, password_hash, rol: 'ADMIN' });
  return NextResponse.json({ ok: true, usuario });
}

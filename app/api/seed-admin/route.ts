import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { contarUsuarios, crearUsuario } from '@/lib/usuarios';

// Crea el PRIMER usuario admin. Solo funciona si la tabla está vacía Y, en
// producción, requiere el header `x-seed-secret: $SEED_SECRET`. En desarrollo
// queda abierto para arrancar local sin fricción. Borrar este archivo después
// de crear el primer admin si se quiere reducir superficie.
export async function POST(req: Request) {
  if (process.env.NODE_ENV === 'production') {
    const expected = process.env.SEED_SECRET;
    if (!expected) {
      return NextResponse.json(
        { error: 'SEED_SECRET no configurado. Define la variable o desactiva esta ruta.' },
        { status: 503 }
      );
    }
    if (req.headers.get('x-seed-secret') !== expected) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
  }

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

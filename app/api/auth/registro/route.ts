import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { crearUsuario } from '@/lib/usuarios';
import { createSession } from '@/lib/session';
import { queryOne } from '@/lib/db';

const Schema = z.object({
  nombre: z.string().min(2, 'Nombre muy corto').max(80).trim(),
  email: z.string().email('Email inválido').toLowerCase().trim(),
  telefono: z.string().min(7).max(20).trim().optional(),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = Schema.safeParse(body);
    if (!parsed.success) {
      const errs = parsed.error.flatten().fieldErrors;
      return NextResponse.json({ error: 'Datos inválidos', fields: errs }, { status: 400 });
    }

    const { nombre, email, password } = parsed.data;

    // Verificar si el email ya existe
    const existente = await queryOne(`SELECT id FROM usuarios WHERE email = $1`, [email]);
    if (existente) {
      return NextResponse.json({ error: 'Este email ya está registrado.' }, { status: 409 });
    }

    const password_hash = await bcrypt.hash(password, 12);
    const usuario = await crearUsuario({ email, nombre, password_hash, rol: 'CLIENT' });
    if (!usuario) {
      return NextResponse.json({ error: 'No se pudo crear la cuenta.' }, { status: 500 });
    }

    // Crear sesión automáticamente
    await createSession({ userId: usuario.id, rol: 'CLIENT', nombre: usuario.nombre });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Error interno' }, { status: 500 });
  }
}

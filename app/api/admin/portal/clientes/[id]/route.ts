import { NextRequest, NextResponse } from 'next/server';
import { requireApi } from '@/lib/api-auth';
import { otorgarAcceso, revocarAcceso, asignarCuentaAdobe, agregarCreditos } from '@/lib/portal';
import { query } from '@/lib/db';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApi('ADMIN');
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const body = await req.json();
  const { accion } = body;

  if (accion === 'otorgar_acceso') {
    await otorgarAcceso(id, body.servicio, auth.session.userId);
    return NextResponse.json({ ok: true });
  }

  if (accion === 'revocar_acceso') {
    await revocarAcceso(id, body.servicio);
    return NextResponse.json({ ok: true });
  }

  if (accion === 'asignar_adobe') {
    const cuenta = await asignarCuentaAdobe({
      usuarioId: id,
      emailAdobe: body.email_adobe,
      plan: body.plan,
      fechaInicio: body.fecha_inicio,
      fechaVencimiento: body.fecha_vencimiento,
      notas: body.notas,
    });
    return NextResponse.json({ cuenta });
  }

  if (accion === 'agregar_creditos') {
    const cantidad = Number(body.cantidad);
    if (!cantidad || cantidad < 1) return NextResponse.json({ error: 'Cantidad inválida.' }, { status: 400 });
    await agregarCreditos(id, cantidad);
    return NextResponse.json({ ok: true });
  }

  if (accion === 'toggle_activo') {
    await query(`UPDATE usuarios SET activo = NOT activo WHERE id = $1`, [id]);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Acción inválida.' }, { status: 400 });
}

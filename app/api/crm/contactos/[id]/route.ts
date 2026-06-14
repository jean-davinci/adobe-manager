import { NextRequest, NextResponse } from 'next/server';
import { requireApi } from '@/lib/api-auth';
import { setEtiquetas, setNotas, setEtapa, ETAPAS, type Etapa } from '@/lib/crm';
import { queryOne } from '@/lib/db';

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await requireApi('ADMIN', 'OPERATOR');
  if (!auth.ok) return auth.response;
  try {
    const { id } = await context.params;
    const body = await req.json();
    let data;
    if (Array.isArray(body.etiquetas)) data = await setEtiquetas(id, body.etiquetas);
    if (typeof body.notas === 'string') data = await setNotas(id, body.notas);
    if (typeof body.etapa === 'string') {
      if (!ETAPAS.includes(body.etapa as Etapa)) {
        return NextResponse.json({ error: `Etapa inválida. Usa: ${ETAPAS.join(', ')}` }, { status: 400 });
      }
      data = await setEtapa(id, body.etapa as Etapa);
    }
    // Edición de datos básicos del contacto
    if (typeof body.nombre === 'string' || typeof body.telefono === 'string' || typeof body.email === 'string') {
      data = await queryOne(
        `update contactos set
           nombre   = coalesce($2, nombre),
           telefono = coalesce($3, telefono),
           email    = coalesce($4, email)
         where id = $1 returning *`,
        [id, body.nombre ?? null, body.telefono ?? null, body.email ?? null]
      );
    }
    return NextResponse.json(data ?? {});
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

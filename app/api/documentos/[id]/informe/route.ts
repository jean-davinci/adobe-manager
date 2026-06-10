import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { requireApi } from '@/lib/api-auth';
import { getCurrentUser } from '@/lib/dal';
import { getDocumento, setInforme } from '@/lib/documentos';
import { syncToDrive, shareFilePublic } from '@/lib/drive';

// Subir informe final (operador)
export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await requireApi('ADMIN', 'OPERATOR');
  if (!auth.ok) return auth.response;
  try {
    const { id } = await context.params;
    const doc = await getDocumento(id);
    if (!doc) return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 });

    const formData = await req.formData();
    const file = formData.get('informe') as File | null;
    if (!file) return NextResponse.json({ error: 'Falta el archivo del informe' }, { status: 400 });

    const mes = new Date().toISOString().slice(0, 7);
    const dir = path.join(process.cwd(), 'uploads', 'informes', mes);
    await mkdir(dir, { recursive: true });
    const safeName = `${id}_${file.name.replace(/[^\w.\-]/g, '_')}`;
    const filePath = path.join(dir, safeName);
    await writeFile(filePath, Buffer.from(await file.arrayBuffer()));

    // Drive: /Turnitin-Oficial/<cliente>/<YYYY-MM>/informe.pdf + link público
    const carpeta = `Turnitin-Oficial/${doc.cliente_nombre}/${mes}`;
    const { fileId } = await syncToDrive(filePath, carpeta);
    const urlPublica = await shareFilePublic(fileId);

    const actualizado = await setInforme(id, urlPublica, true);
    return NextResponse.json(actualizado);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Descargar/obtener informe (operador o el cliente dueño)
export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await requireApi();
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  const doc = await getDocumento(id);
  if (!doc) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });

  // Un cliente solo puede ver su propio informe.
  if (auth.session.rol === 'CLIENT') {
    const user = await getCurrentUser();
    if (!user || user.email.toLowerCase() !== (doc.cliente_email ?? '').toLowerCase()) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
    }
  }

  if (!doc.url_informe) {
    return NextResponse.json({ error: 'El informe aún no está disponible' }, { status: 404 });
  }
  // En MOCK el informe vive como link de Drive (preview). Devolvemos la URL.
  return NextResponse.json({ url_informe: doc.url_informe, publico: doc.informe_publico });
}

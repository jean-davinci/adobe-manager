import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { requireApi } from '@/lib/api-auth';
import { crearDocumento, setUrlDrive } from '@/lib/documentos';
import { syncToDrive } from '@/lib/drive';

export async function POST(req: NextRequest) {
  const auth = await requireApi('ADMIN', 'OPERATOR');
  if (!auth.ok) return auth.response;

  try {
    const formData = await req.formData();
    const file = formData.get('archivo') as File | null;
    const cliente_nombre = String(formData.get('cliente_nombre') ?? '').trim();
    const cliente_email = String(formData.get('cliente_email') ?? '').trim() || null;
    const tipo_servicio = String(formData.get('tipo_servicio') ?? 'AMBOS');

    if (!file || !cliente_nombre) {
      return NextResponse.json({ error: 'Falta archivo o nombre del cliente' }, { status: 400 });
    }

    // Validación del archivo: extensión permitida y tamaño máximo (25 MB).
    const EXT_OK = ['.pdf', '.doc', '.docx'];
    const MAX_BYTES = 25 * 1024 * 1024;
    if (!EXT_OK.some((e) => file.name.toLowerCase().endsWith(e))) {
      return NextResponse.json({ error: 'Tipo de archivo no permitido (.pdf, .doc, .docx)' }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'El archivo supera el límite de 25 MB' }, { status: 413 });
    }

    // Carpeta local: uploads/YYYY-MM-DD/
    const hoy = new Date().toISOString().split('T')[0];
    const dir = path.join(process.cwd(), 'uploads', hoy);
    await mkdir(dir, { recursive: true });

    const safeName = `${Date.now()}_${file.name.replace(/[^\w.\-]/g, '_')}`;
    const filePath = path.join(dir, safeName);
    const bytes = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, bytes);

    const url_local = `uploads/${hoy}/${safeName}`;
    const doc = await crearDocumento({
      cliente_nombre,
      cliente_email,
      nombre_archivo: file.name,
      tipo_servicio,
      tamano_bytes: bytes.length,
      url_local,
      operador: auth.session.nombre,
    });

    // Sincronización a Drive en background (no bloquea la respuesta).
    const carpetaDrive = `Davinci Labs/Documentos/${hoy.slice(0, 7)}`;
    syncToDrive(filePath, carpetaDrive)
      .then((r) => doc && setUrlDrive(doc.id, r.url))
      .catch((e) => console.error('syncToDrive falló:', e));

    return NextResponse.json(doc, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

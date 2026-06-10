import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { requireApi } from '@/lib/api-auth';
import { getDocumento, setUrlDrive } from '@/lib/documentos';
import { syncToDrive } from '@/lib/drive';

// Fuerza la sincronización a Drive de un documento ya registrado.
export async function POST(req: NextRequest) {
  const auth = await requireApi('ADMIN', 'OPERATOR');
  if (!auth.ok) return auth.response;
  try {
    const { id } = await req.json();
    const doc = await getDocumento(id);
    if (!doc || !doc.url_local) {
      return NextResponse.json({ error: 'Documento sin archivo local' }, { status: 404 });
    }
    const filePath = path.join(process.cwd(), doc.url_local);
    const mes = (doc.created_at ?? '').slice(0, 7);
    const r = await syncToDrive(filePath, `Davinci Labs/Documentos/${mes}`);
    const actualizado = await setUrlDrive(id, r.url);
    return NextResponse.json({ ok: true, mock: r.mock, documento: actualizado });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { requireApi } from '@/lib/api-auth';

export async function POST(req: NextRequest) {
  const auth = await requireApi('CLIENT', 'ADMIN', 'OPERATOR');
  if (!auth.ok) return auth.response;

  try {
    const fd = await req.formData();
    const file = fd.get('doc') as File | null;
    if (!file) return NextResponse.json({ error: 'Falta archivo' }, { status: 400 });

    const TIPOS = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (!TIPOS.includes(file.type)) {
      return NextResponse.json({ error: 'Solo se aceptan PDF, DOC o DOCX.' }, { status: 400 });
    }
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json({ error: 'El archivo supera 50 MB.' }, { status: 413 });
    }

    const userId = auth.session.userId;
    const dir = path.join(process.cwd(), 'public', 'portal-docs', userId);
    await mkdir(dir, { recursive: true });
    const safe = `${Date.now()}_${file.name.replace(/[^\w.\-]/g, '_')}`;
    await writeFile(path.join(dir, safe), Buffer.from(await file.arrayBuffer()));

    return NextResponse.json({ url: `/portal-docs/${userId}/${safe}`, nombre: file.name });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { requireApi } from '@/lib/api-auth';

// Sube un comprobante (.pdf/.jpg/.png) y devuelve su URL servible.
export async function POST(req: NextRequest) {
  const auth = await requireApi('ADMIN', 'OPERATOR');
  if (!auth.ok) return auth.response;
  try {
    const fd = await req.formData();
    const file = fd.get('comprobante') as File | null;
    if (!file) return NextResponse.json({ error: 'Falta archivo' }, { status: 400 });
    const EXT_OK = ['.pdf', '.jpg', '.jpeg', '.png'];
    if (!EXT_OK.some((e) => file.name.toLowerCase().endsWith(e))) {
      return NextResponse.json({ error: 'Tipo no permitido (.pdf, .jpg, .png)' }, { status: 400 });
    }
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'El archivo supera 10 MB' }, { status: 413 });
    }

    const mes = new Date().toISOString().slice(0, 7);
    const dir = path.join(process.cwd(), 'public', 'comprobantes', mes);
    await mkdir(dir, { recursive: true });
    const safe = `${Date.now()}_${file.name.replace(/[^\w.\-]/g, '_')}`;
    await writeFile(path.join(dir, safe), Buffer.from(await file.arrayBuffer()));

    // Servible públicamente desde /comprobantes/...
    return NextResponse.json({ url: `/comprobantes/${mes}/${safe}` });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

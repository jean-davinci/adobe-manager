import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { requireApi } from '@/lib/api-auth';

// Sube una imagen para adjuntar a un mensaje del CRM y devuelve su URL.
export async function POST(req: NextRequest) {
  const auth = await requireApi('ADMIN', 'OPERATOR');
  if (!auth.ok) return auth.response;
  try {
    const fd = await req.formData();
    const file = fd.get('media') as File | null;
    if (!file) return NextResponse.json({ error: 'Falta archivo' }, { status: 400 });
    const dir = path.join(process.cwd(), 'public', 'crm-media');
    await mkdir(dir, { recursive: true });
    const safe = `${Date.now()}_${file.name.replace(/[^\w.\-]/g, '_')}`;
    await writeFile(path.join(dir, safe), Buffer.from(await file.arrayBuffer()));
    return NextResponse.json({ url: `/crm-media/${safe}` });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

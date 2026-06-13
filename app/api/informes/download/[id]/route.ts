import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { readFile } from 'fs/promises';
import { requireApi } from '@/lib/api-auth';
import { getInforme } from '@/lib/informes';

// GET /api/informes/download/:id — descarga el PDF del informe.
// Staff descarga cualquiera; un CLIENT solo el de su propio email.
export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await requireApi();
  if (!auth.ok) return auth.response;

  try {
    const { id } = await context.params;
    const docu = await getInforme(id);
    if (!docu) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });

    if (auth.session.rol === 'CLIENT') {
      // El email de la sesión vive en la tabla usuarios; comparamos contra el documento.
      const { getCurrentUser } = await import('@/lib/dal');
      const user = await getCurrentUser();
      if (!user?.email || user.email.toLowerCase() !== (docu.cliente_email ?? '').toLowerCase()) {
        return NextResponse.json({ error: 'Sin acceso a este informe' }, { status: 403 });
      }
    }

    if (docu.estado !== 'COMPLETADO') {
      return NextResponse.json({ error: 'Informe aún no disponible' }, { status: 202 });
    }

    const localPath = path.join(process.cwd(), 'uploads', 'informes', `informe-${id}.pdf`);
    try {
      const buffer = await readFile(localPath);
      const safe = docu.cliente_nombre.replace(/[^a-z0-9]/gi, '-').toLowerCase();
      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `inline; filename="informe-davinci-${safe}.pdf"`,
        },
      });
    } catch {
      if (docu.drive_informe_url) return NextResponse.redirect(docu.drive_informe_url);
      return NextResponse.json({ error: 'Archivo no disponible' }, { status: 404 });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Error interno' }, { status: 500 });
  }
}

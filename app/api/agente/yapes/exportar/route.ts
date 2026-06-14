import { NextRequest, NextResponse } from 'next/server';
import { requireApi } from '@/lib/api-auth';
import { listarYapes } from '@/lib/yape';
import { getContacto } from '@/lib/crm';
import * as XLSX from 'xlsx';

// GET /api/agente/yapes/exportar?desde=YYYY-MM-DD&hasta=YYYY-MM-DD
export async function GET(req: NextRequest) {
  const auth = await requireApi('ADMIN', 'OPERATOR');
  if (!auth.ok) return auth.response;

  const sp = req.nextUrl.searchParams;
  const desde = sp.get('desde') ?? undefined;
  const hasta = sp.get('hasta') ?? undefined;
  const pagos = await listarYapes({ desde, hasta });

  // Resolver nombres de contacto en una pasada.
  const contactosMap = new Map<string, string>();
  for (const p of pagos) {
    if (p.contacto_id && !contactosMap.has(p.contacto_id)) {
      const c = await getContacto(p.contacto_id).catch(() => null);
      if (c) contactosMap.set(p.contacto_id, c.nombre);
    }
  }

  const filas = pagos.map((p) => ({
    Fecha: p.fecha_pago,
    Pagador: p.pagador ?? '',
    'Monto (S/.)': Number(p.monto),
    Contacto: p.contacto_id ? (contactosMap.get(p.contacto_id) ?? '') : '',
    'Registrado en finanzas': p.registrado_en_finanzas ? 'sí' : 'no',
  }));

  const ws = XLSX.utils.json_to_sheet(filas);
  // Ancho de columnas
  ws['!cols'] = [{ wch: 12 }, { wch: 28 }, { wch: 14 }, { wch: 28 }, { wch: 22 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Yapes');

  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  const nombre = `yapes-${desde ?? 'todo'}_${hasta ?? 'todo'}.xlsx`;

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${nombre}"`,
    },
  });
}

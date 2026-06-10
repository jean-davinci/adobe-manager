import { NextRequest, NextResponse } from 'next/server';
import { jsPDF } from 'jspdf';
import { requireApi } from '@/lib/api-auth';
import { registroDiario } from '@/lib/documentos';

function csvEscape(v: unknown): string {
  const s = v == null ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET(req: NextRequest) {
  const auth = await requireApi('ADMIN', 'OPERATOR');
  if (!auth.ok) return auth.response;

  const sp = req.nextUrl.searchParams;
  const date = sp.get('date') || new Date().toISOString().split('T')[0];
  const docs = await registroDiario(date);

  if (sp.get('format') === 'csv') {
    const headers = ['Hora', 'Cliente', 'Email', 'Archivo', 'Servicio', 'Estado', 'Operador'];
    const filas = docs.map((d) =>
      [
        new Date(d.created_at).toLocaleTimeString('es-PE'),
        d.cliente_nombre, d.cliente_email ?? '', d.nombre_archivo,
        d.tipo_servicio, d.estado, d.operador ?? '',
      ].map(csvEscape).join(',')
    );
    const csv = '﻿' + [headers.join(','), ...filas].join('\n');
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="registro-${date}.csv"`,
      },
    });
  }

  if (sp.get('format') === 'pdf') {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    doc.setFontSize(18); doc.text('Davinci Labs — Registro diario de documentos', 40, 50);
    doc.setFontSize(10); doc.setTextColor(120);
    doc.text(`Fecha: ${date}  ·  Total: ${docs.length}`, 40, 70);

    let y = 100;
    doc.setFontSize(9); doc.setTextColor(120);
    doc.text('Hora', 40, y); doc.text('Cliente', 100, y); doc.text('Archivo', 250, y);
    doc.text('Servicio', 400, y); doc.text('Estado', 480, y);
    doc.setTextColor(0); y += 6; doc.setDrawColor(220); doc.line(40, y, 555, y); y += 14;

    for (const d of docs) {
      if (y > 790) { doc.addPage(); y = 50; }
      doc.text(new Date(d.created_at).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }), 40, y);
      doc.text((d.cliente_nombre ?? '').slice(0, 24), 100, y);
      doc.text((d.nombre_archivo ?? '').slice(0, 24), 250, y);
      doc.text((d.tipo_servicio ?? '').slice(0, 12), 400, y);
      doc.text(d.estado, 480, y);
      y += 16;
    }

    const buf = Buffer.from(doc.output('arraybuffer'));
    return new NextResponse(buf, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="registro-${date}.pdf"`,
      },
    });
  }

  return NextResponse.json({ date, total: docs.length, documentos: docs });
}

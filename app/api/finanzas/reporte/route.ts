import { NextRequest, NextResponse } from 'next/server';
import { jsPDF } from 'jspdf';
import { requireApi } from '@/lib/api-auth';
import { listarTransacciones, type TipoTx } from '@/lib/finanzas';

function csvEscape(v: unknown): string {
  const s = v == null ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET(req: NextRequest) {
  const auth = await requireApi('ADMIN', 'OPERATOR');
  if (!auth.ok) return auth.response;

  const sp = req.nextUrl.searchParams;
  const filtro = {
    from: sp.get('from') ?? undefined,
    to: sp.get('to') ?? undefined,
    tipo: (sp.get('tipo') as TipoTx) ?? undefined,
    categoria: sp.get('categoria') ?? undefined,
  };
  const txs = await listarTransacciones(filtro);
  const hoy = new Date().toISOString().split('T')[0];

  // ---- PDF ----
  if (sp.get('format') === 'pdf') {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const ingresos = txs.filter((t) => t.tipo === 'INGRESO').reduce((a, t) => a + Number(t.monto), 0);
    const egresos = txs.filter((t) => t.tipo === 'EGRESO').reduce((a, t) => a + Number(t.monto), 0);

    doc.setFontSize(18); doc.text('Davinci Labs — Reporte financiero', 40, 50);
    doc.setFontSize(10); doc.setTextColor(120);
    doc.text(`Generado: ${hoy}`, 40, 68);
    const rango = [filtro.from && `desde ${filtro.from}`, filtro.to && `hasta ${filtro.to}`].filter(Boolean).join(' ');
    if (rango) doc.text(rango, 40, 82);

    doc.setTextColor(0); doc.setFontSize(11);
    doc.text(`Ingresos: S/. ${ingresos.toFixed(2)}`, 40, 110);
    doc.text(`Egresos:  S/. ${egresos.toFixed(2)}`, 220, 110);
    doc.text(`Neto:     S/. ${(ingresos - egresos).toFixed(2)}`, 400, 110);

    // Cabecera de tabla
    let y = 140;
    doc.setFontSize(9); doc.setTextColor(120);
    doc.text('Fecha', 40, y); doc.text('Tipo', 110, y); doc.text('Categoría', 170, y);
    doc.text('Detalle', 320, y); doc.text('Monto', 500, y);
    doc.setTextColor(0); y += 6;
    doc.setDrawColor(220); doc.line(40, y, 555, y); y += 14;

    for (const t of txs) {
      if (y > 790) { doc.addPage(); y = 50; }
      doc.text(String(t.fecha), 40, y);
      doc.text(t.tipo === 'INGRESO' ? 'ING' : 'EGR', 110, y);
      doc.text((t.categoria ?? '').slice(0, 22), 170, y);
      doc.text((t.cliente_nombre ?? t.descripcion ?? '—').slice(0, 28), 320, y);
      doc.text(`${t.tipo === 'INGRESO' ? '+' : '-'} ${Number(t.monto).toFixed(2)}`, 500, y);
      y += 16;
    }

    const buf = Buffer.from(doc.output('arraybuffer'));
    return new NextResponse(buf, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="reporte-finanzas-${hoy}.pdf"`,
      },
    });
  }

  // ---- CSV (por defecto) ----
  const headers = ['Fecha', 'Tipo', 'Categoría', 'Monto', 'Moneda', 'Cliente/Proveedor', 'Descripción'];
  const filas = txs.map((t) =>
    [t.fecha, t.tipo, t.categoria, t.monto, t.moneda, t.cliente_nombre ?? '', t.descripcion ?? '']
      .map(csvEscape)
      .join(',')
  );
  const csv = '﻿' + [headers.join(','), ...filas].join('\n');
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="reporte-finanzas-${hoy}.csv"`,
    },
  });
}

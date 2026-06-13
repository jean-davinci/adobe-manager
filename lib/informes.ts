import 'server-only';
import { jsPDF } from 'jspdf';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import { query, queryOne } from './db';
import { getDocumento, type Documento } from './documentos';
import { syncToDrive, shareFilePublic, isMockDrive } from './drive';
import { enviarEmail } from './email';
import { enviarMensaje } from './whatsapp';
import { getContactoPorEmail } from './crm';

// ─── Paleta Davinci Labs v2 (RGB para jsPDF) ───────────────────────────────
const C = {
  navy: [30, 58, 95] as const,        // #1E3A5F — navy del logo
  midBlue: [42, 79, 127] as const,    // #2A4F7F
  blue: [33, 134, 245] as const,      // #2186F5
  accent: [78, 161, 255] as const,    // #4EA1FF — celeste del logo
  sky: [219, 234, 254] as const,
  pale: [168, 210, 255] as const,
  gray50: [248, 250, 252] as const,
  gray400: [148, 163, 184] as const,
  gray600: [71, 85, 105] as const,
  success: [16, 185, 129] as const,
  warning: [245, 158, 11] as const,
  danger: [239, 68, 68] as const,
};

export type ResultadoInforme = {
  ok: boolean;
  urlInforme: string;
  driveUrl: string | null;
  emailEnviado: boolean;
  whatsappEnviado: boolean;
  mock: { drive: boolean; email: boolean; whatsapp: boolean };
};

// Conclusión automática según los porcentajes obtenidos.
function getConclusion(ia: number, sim: number): { texto: string; level: 'ok' | 'warn' | 'danger'; badge: string } {
  if (ia <= 15 && sim <= 15) {
    return {
      level: 'ok',
      badge: 'APROBADO',
      texto:
        `El documento ha superado satisfactoriamente el proceso de verificación. ` +
        `El índice de contenido generado por IA es del ${ia}% y el índice de similitud es del ${sim}%, ` +
        `ambos dentro de los parámetros aceptables establecidos por la mayoría de instituciones académicas. ` +
        `El documento refleja producción original y puede ser presentado con confianza.`,
    };
  }
  if (ia <= 30 && sim <= 30) {
    return {
      level: 'warn',
      badge: 'OBSERVADO',
      texto:
        `El documento presenta indicadores moderados que requieren revisión. ` +
        `Se detectó un ${ia}% de contenido potencialmente generado por IA y un ${sim}% de similitud. ` +
        `Se recomienda revisar las secciones señaladas y realizar ajustes de redacción ` +
        `para mejorar la originalidad antes de la presentación final.`,
    };
  }
  return {
    level: 'danger',
    badge: 'REQUIERE REVISIÓN',
    texto:
      `El documento presenta índices elevados que requieren atención inmediata. ` +
      `Se detectó un ${ia}% de contenido generado por IA y un ${sim}% de similitud. ` +
      `Es necesario realizar una revisión profunda y reescritura de las secciones afectadas ` +
      `antes de cualquier presentación. Nuestro equipo puede asistirte en este proceso.`,
  };
}

const servicioLabel: Record<string, string> = {
  IA: 'Detección de IA',
  SIMILITUD: 'Similitud Turnitin',
  AMBOS: 'IA + Similitud',
  TURNITIN_OFICIAL: 'Turnitin Oficial',
};

// ─── Generador del PDF con marca Davinci ───────────────────────────────────
export function generarPDFInforme(docu: Documento, opts: { ia: number; sim: number; notas?: string }): Buffer {
  const { ia, sim } = opts;
  const orig = Math.max(0, 100 - ia - sim);
  const idProceso = randomUUID().slice(0, 8).toUpperCase();
  const ahora = new Date();
  const fechaStr = ahora.toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' });
  const horaStr = ahora.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
  const conclusion = getConclusion(ia, sim);

  const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
  const W = 595.28;

  // Header navy
  pdf.setFillColor(...C.navy);
  pdf.rect(0, 0, W, 100, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(21);
  pdf.setFont('helvetica', 'bold');
  pdf.text('DAVINCI LABS', 40, 46);
  pdf.setFontSize(7.5);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(...C.pale);
  pdf.text('V E R I F I C A C I Ó N   D E   D O C U M E N T O S   A C A D É M I C O S', 40, 62);
  pdf.setTextColor(...C.gray400);
  pdf.setFontSize(7);
  pdf.text('ID DE INFORME', W - 40, 36, { align: 'right' });
  pdf.setTextColor(96, 165, 250);
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.text(idProceso, W - 40, 50, { align: 'right' });
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(...C.sky);
  pdf.setFontSize(8);
  pdf.text(`${fechaStr} · ${horaStr}`, W - 40, 64, { align: 'right' });

  // Accent bar
  pdf.setFillColor(...C.accent);
  pdf.rect(0, 100, W, 3, 'F');

  // Meta grid
  let y = 128;
  pdf.setFillColor(...C.gray50);
  pdf.roundedRect(40, y, W - 80, 54, 6, 6, 'F');
  const metaCols = [
    { label: 'CLIENTE', value: docu.cliente_nombre },
    { label: 'EMAIL', value: docu.cliente_email ?? '—' },
    { label: 'DOCUMENTO', value: docu.nombre_archivo },
    { label: 'SERVICIO', value: servicioLabel[docu.tipo_servicio] ?? docu.tipo_servicio },
  ];
  const colW = (W - 80 - 36) / 4;
  metaCols.forEach((m, i) => {
    const x = 58 + i * colW;
    pdf.setTextColor(...C.gray400);
    pdf.setFontSize(6.5);
    pdf.text(m.label, x, y + 20);
    pdf.setTextColor(...C.navy);
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.text(String(m.value).slice(0, 26), x, y + 36);
    pdf.setFont('helvetica', 'normal');
  });

  // Título de resultados
  y += 82;
  pdf.setTextColor(...C.navy);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text('RESULTADOS DEL ANÁLISIS', 40, y);
  pdf.setDrawColor(226, 232, 240);
  pdf.line(40, y + 6, W - 40, y + 6);

  // Tarjetas de resultados
  y += 22;
  const mostrarIA = docu.tipo_servicio === 'IA' || docu.tipo_servicio === 'AMBOS';
  const mostrarSim = docu.tipo_servicio !== 'IA';
  const cards: { pct: number; label: string; fuente: string; fill: readonly [number, number, number] }[] = [];
  if (mostrarIA) cards.push({ pct: ia, label: 'CONTENIDO IA', fuente: 'iVerificate', fill: C.midBlue });
  if (mostrarSim) cards.push({ pct: sim, label: 'SIMILITUD', fuente: 'Turnitin', fill: C.blue });
  cards.push({ pct: orig, label: 'TEXTO ORIGINAL', fuente: 'Verificado', fill: C.accent });

  const cardW = (W - 80 - (cards.length - 1) * 12) / cards.length;
  cards.forEach((card, i) => {
    const x = 40 + i * (cardW + 12);
    pdf.setFillColor(...card.fill);
    pdf.roundedRect(x, y, cardW, 92, 8, 8, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(30);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`${card.pct}%`, x + cardW / 2, y + 42, { align: 'center' });
    pdf.setFontSize(7.5);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...C.sky);
    pdf.text(card.label, x + cardW / 2, y + 58, { align: 'center' });
    pdf.setTextColor(200, 215, 240);
    pdf.setFontSize(7);
    pdf.text(card.fuente, x + cardW / 2, y + 74, { align: 'center' });
  });

  // Barra de estado
  y += 112;
  const statusFill: Record<string, readonly [number, number, number]> = {
    ok: [236, 253, 245], warn: [255, 251, 235], danger: [254, 242, 242],
  };
  const statusDot: Record<string, readonly [number, number, number]> = {
    ok: C.success, warn: C.warning, danger: C.danger,
  };
  const statusText: Record<string, readonly [number, number, number]> = {
    ok: [6, 95, 70], warn: [146, 64, 14], danger: [153, 27, 27],
  };
  pdf.setFillColor(...statusFill[conclusion.level]);
  pdf.roundedRect(40, y, W - 80, 32, 6, 6, 'F');
  pdf.setFillColor(...statusDot[conclusion.level]);
  pdf.circle(56, y + 16, 4, 'F');
  pdf.setTextColor(...statusText[conclusion.level]);
  pdf.setFontSize(9.5);
  pdf.setFont('helvetica', 'bold');
  pdf.text(`${conclusion.badge} — Proceso completado por Davinci Labs`, 68, y + 20);
  pdf.setFont('helvetica', 'normal');

  // Conclusión
  y += 56;
  pdf.setTextColor(...C.navy);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text('CONCLUSIÓN Y RECOMENDACIONES', 40, y);
  pdf.setDrawColor(226, 232, 240);
  pdf.line(40, y + 6, W - 40, y + 6);
  y += 20;
  const lineas = pdf.splitTextToSize(conclusion.texto, W - 80 - 44);
  const boxH = 30 + lineas.length * 13;
  pdf.setFillColor(...C.sky);
  pdf.roundedRect(40, y, W - 80, boxH, 6, 6, 'F');
  pdf.setFillColor(...C.accent);
  pdf.rect(40, y, 3, boxH, 'F');
  pdf.setTextColor(...C.navy);
  pdf.setFontSize(8.5);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Análisis automático del documento', 58, y + 18);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(...C.gray600);
  pdf.setFontSize(9);
  pdf.text(lineas, 58, y + 34, { lineHeightFactor: 1.45 });
  y += boxH;

  // Notas del operador
  if (opts.notas?.trim()) {
    y += 24;
    pdf.setTextColor(...C.navy);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.text('NOTAS DEL OPERADOR', 40, y);
    pdf.setDrawColor(226, 232, 240);
    pdf.line(40, y + 6, W - 40, y + 6);
    y += 18;
    const notasLineas = pdf.splitTextToSize(opts.notas.trim(), W - 80 - 28);
    pdf.setDrawColor(226, 232, 240);
    pdf.roundedRect(40, y, W - 80, 22 + notasLineas.length * 13, 6, 6, 'S');
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...C.gray600);
    pdf.setFontSize(9);
    pdf.text(notasLineas, 54, y + 18, { lineHeightFactor: 1.45 });
  }

  // Footer navy
  pdf.setFillColor(...C.navy);
  pdf.rect(0, 842 - 38, W, 38, 'F');
  pdf.setTextColor(...C.gray400);
  pdf.setFontSize(8);
  pdf.text(`Davinci Labs © ${ahora.getFullYear()} · Informe generado automáticamente`, 40, 842 - 16);
  pdf.setTextColor(96, 165, 250);
  pdf.text('davincilabs.peru@gmail.com', W - 40, 842 - 16, { align: 'right' });

  return Buffer.from(pdf.output('arraybuffer'));
}

// ─── Flujo completo: PDF → Drive → email → WhatsApp → DB ───────────────────
export async function procesarInforme(input: {
  documentoId: string;
  porcentajeIA: number;
  porcentajeSimilitud: number;
  notas?: string;
  operador?: string;
}): Promise<ResultadoInforme> {
  const docu = await getDocumento(input.documentoId);
  if (!docu) throw new Error('Documento no encontrado');

  const ia = Math.min(100, Math.max(0, Math.round(input.porcentajeIA)));
  const sim = Math.min(100, Math.max(0, Math.round(input.porcentajeSimilitud)));
  const orig = Math.max(0, 100 - ia - sim);

  // 1. Generar PDF y guardarlo localmente
  const buffer = generarPDFInforme(docu, { ia, sim, notas: input.notas });
  const dir = path.join(process.cwd(), 'uploads', 'informes');
  const localPath = path.join(dir, `informe-${docu.id}.pdf`);
  await mkdir(dir, { recursive: true });
  await writeFile(localPath, buffer);

  // 2. Subir a Drive (carpeta Informes/YYYY-MM) y compartir en solo lectura
  const mes = new Date().toISOString().slice(0, 7);
  let driveUrl: string | null = null;
  const driveMock = isMockDrive();
  try {
    const drive = await syncToDrive(localPath, `Informes/${mes}`);
    driveUrl = drive.mock ? drive.url : await shareFilePublic(drive.fileId);
  } catch (e) {
    console.error('[informes] Drive falló (se continúa):', e);
  }

  // 3. Actualizar el documento en DB
  const urlInforme = `/api/informes/download/${docu.id}`;
  await query(
    `update documentos set
       estado = 'COMPLETADO',
       porcentaje_ia = $2, porcentaje_similitud = $3, porcentaje_original = $4,
       notas_informe = $5, url_informe = $6, drive_informe_url = $7,
       informe_publico = true, procesado_en = now(),
       operador = coalesce($8, operador)
     where id = $1`,
    [docu.id, ia, sim, orig, input.notas ?? null, urlInforme, driveUrl, input.operador ?? null]
  );

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const linkDescarga = `${appUrl}${urlInforme}`;

  // 4. Email al cliente
  let emailEnviado = false;
  let emailMock = false;
  if (docu.cliente_email) {
    const html = `
      <div style="font-family:Poppins,Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;background:#FFFFFF;border:1px solid #E2E8F0;border-radius:14px;overflow:hidden">
        <div style="padding:28px 32px;background:#1E3A5F;border-bottom:3px solid #4EA1FF">
          <span style="color:#fff;font-size:20px;font-weight:700;letter-spacing:1px">DAVINCI LABS</span><br/>
          <span style="color:#A8D2FF;font-size:10px;letter-spacing:2px">VERIFICACIÓN DE DOCUMENTOS ACADÉMICOS</span>
        </div>
        <div style="padding:28px 32px;color:#16293F">
          <p style="font-size:15px">Hola <strong>${docu.cliente_nombre}</strong>,</p>
          <p style="font-size:13px;color:#5A6B7F">Tu informe de verificación para <strong style="color:#16293F">${docu.nombre_archivo}</strong> está listo.</p>
          <table style="width:100%;margin:18px 0"><tr>
            <td style="background:#1E3A5F;border-radius:10px;padding:14px;text-align:center">
              <div style="color:#fff;font-size:24px;font-weight:700">${ia}%</div>
              <div style="color:#A8D2FF;font-size:10px;letter-spacing:1px">CONTENIDO IA</div>
            </td><td style="width:10px"></td>
            <td style="background:#2186F5;border-radius:10px;padding:14px;text-align:center">
              <div style="color:#fff;font-size:24px;font-weight:700">${sim}%</div>
              <div style="color:#D6E9FF;font-size:10px;letter-spacing:1px">SIMILITUD</div>
            </td><td style="width:10px"></td>
            <td style="background:#0E9F6E;border-radius:10px;padding:14px;text-align:center">
              <div style="color:#fff;font-size:24px;font-weight:700">${orig}%</div>
              <div style="color:#D9F4EA;font-size:10px;letter-spacing:1px">ORIGINAL</div>
            </td>
          </tr></table>
          <a href="${driveUrl ?? linkDescarga}" style="display:inline-block;background:#1E3A5F;color:#fff;text-decoration:none;padding:12px 28px;border-radius:24px;font-size:13px;font-weight:600">Ver mi informe →</a>
          <p style="font-size:11px;color:#8A98A8;margin-top:18px">También puedes verlo desde tu portal en ${appUrl}/mi-acceso</p>
        </div>
        <div style="padding:16px 32px;border-top:1px solid #E2E8F0;color:#8A98A8;font-size:11px">
          Davinci Labs © ${new Date().getFullYear()} · davincilabs.peru@gmail.com
        </div>
      </div>`;
    const r = await enviarEmail(docu.cliente_email, `📄 Tu informe está listo — ${docu.nombre_archivo}`, html);
    emailEnviado = r.ok;
    emailMock = r.mock;
  }

  // 5. WhatsApp al cliente (teléfono del documento o del contacto CRM)
  let whatsappEnviado = false;
  let whatsappMock = false;
  let telefono = (docu as any).cliente_telefono as string | null;
  if (!telefono && docu.cliente_email) {
    const contacto = await getContactoPorEmail(docu.cliente_email).catch(() => null);
    telefono = contacto?.telefono ?? null;
  }
  if (telefono) {
    try {
      const r = await enviarMensaje({
        telefono,
        texto:
          `Hola ${docu.cliente_nombre} 👋\n\n` +
          `Tu informe de Davinci Labs está listo. 📄\n` +
          `• Contenido IA: ${ia}%\n• Similitud: ${sim}%\n• Texto original: ${orig}%\n\n` +
          `Descárgalo aquí: ${driveUrl ?? linkDescarga}`,
      });
      whatsappEnviado = r.ok;
      whatsappMock = r.mock;
    } catch (e) {
      console.error('[informes] WhatsApp falló (se continúa):', e);
    }
  }

  return {
    ok: true,
    urlInforme,
    driveUrl,
    emailEnviado,
    whatsappEnviado,
    mock: { drive: driveMock, email: emailMock, whatsapp: whatsappMock },
  };
}

// Documentos con datos de informe (para el panel).
export type DocumentoInforme = Documento & {
  cliente_telefono: string | null;
  porcentaje_ia: number | null;
  porcentaje_similitud: number | null;
  porcentaje_original: number | null;
  notas_informe: string | null;
  drive_informe_url: string | null;
  procesado_en: string | null;
};

export function listarParaInformes(): Promise<DocumentoInforme[]> {
  return query<DocumentoInforme>(
    `select * from documentos order by
       case estado when 'RECIBIDO' then 0 when 'EN_PROCESO' then 1 else 2 end,
       created_at desc
     limit 200`
  );
}

export function getInforme(id: string): Promise<DocumentoInforme | null> {
  return queryOne<DocumentoInforme>(`select * from documentos where id = $1`, [id]);
}

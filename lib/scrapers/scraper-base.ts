import { chromium, Browser, Page } from 'playwright';
import { jsPDF } from 'jspdf';
import { writeFile, mkdir } from 'fs/promises';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { syncToDrive } from '../drive';
import { esMock } from '../mock';

// MOCK activo salvo que haya credenciales de las plataformas y se desactive el mock.
export function isMockScrapers(): boolean {
  return esMock('MOCK_SCRAPERS', !!process.env.IVERIFICATE_PASSWORD && !!process.env.CANVAS_PASSWORD);
}

// Guarda un PDF en disco (public/reportes/<carpeta>) y lo sincroniza a Drive (mock).
// Devuelve la URL pública servible.
export async function guardarPDF(
  buffer: Buffer,
  nombreArchivo: string,
  carpeta: 'iverificate' | 'canvas'
): Promise<string> {
  const dir = path.join(process.cwd(), 'public', 'reportes', carpeta);
  await mkdir(dir, { recursive: true });
  const safe = `${Date.now()}_${nombreArchivo.replace(/[^\w.\-]/g, '_')}`;
  const filePath = path.join(dir, safe);
  await writeFile(filePath, buffer);

  // Sincronización a Drive en background (no bloquea).
  syncToDrive(filePath, `Davinci Labs/Reportes/${carpeta}`).catch((e) =>
    console.error('syncToDrive (reporte):', e)
  );

  return `/reportes/${carpeta}/${safe}`;
}

// Genera un PDF de informe simulado para desarrollo local.
export function generarPDFMock(opts: {
  plataforma: string;
  cliente: string;
  metrica: string;
  valor: string;
}): Buffer {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  doc.setFontSize(20); doc.text('Davinci Labs', 40, 60);
  doc.setFontSize(14); doc.setTextColor(90);
  doc.text(`Informe — ${opts.plataforma}`, 40, 86);
  doc.setDrawColor(220); doc.line(40, 100, 555, 100);

  doc.setTextColor(0); doc.setFontSize(12);
  doc.text(`Cliente: ${opts.cliente}`, 40, 140);
  doc.text(`Fecha: ${new Date().toLocaleDateString('es-PE')}`, 40, 162);

  doc.setFontSize(40); doc.setTextColor(37, 99, 235);
  doc.text(opts.valor, 40, 240);
  doc.setFontSize(13); doc.setTextColor(90);
  doc.text(opts.metrica, 40, 266);

  doc.setFontSize(10); doc.setTextColor(150);
  doc.text('Documento generado en modo MOCK para desarrollo local.', 40, 760);
  return Buffer.from(doc.output('arraybuffer'));
}

// ---- Helpers de Playwright (modo real) ----
export async function crearBrowser(headless = true): Promise<Browser> {
  return chromium.launch({ headless, slowMo: headless ? 0 : 200 });
}

export async function esperarElemento(page: Page, selector: string, timeout = 15000) {
  await page.waitForSelector(selector, { timeout });
}

export async function descargarPDF(page: Page, urlOBoton: string): Promise<Buffer> {
  const tmpPath = path.join(os.tmpdir(), `reporte_${Date.now()}.pdf`);
  if (urlOBoton.startsWith('http') && urlOBoton.includes('.pdf')) {
    const response = await page.evaluate(async (url) => {
      const res = await fetch(url, { credentials: 'include' });
      const buf = await res.arrayBuffer();
      return Array.from(new Uint8Array(buf));
    }, urlOBoton);
    return Buffer.from(response);
  }
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.click(urlOBoton),
  ]);
  await download.saveAs(tmpPath);
  const buffer = fs.readFileSync(tmpPath);
  fs.unlinkSync(tmpPath);
  return buffer;
}

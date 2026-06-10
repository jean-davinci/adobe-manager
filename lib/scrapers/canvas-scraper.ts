import { crearBrowser, descargarPDF, guardarPDF, generarPDFMock, isMockScrapers } from './scraper-base';

const URL_LOGIN = 'https://canvasacademic.com/login';
const URL_DASHBOARD = 'https://canvasacademic.com/dashboard';

export interface ReporteCanvas {
  id: string;
  nombre: string;
  fecha: string;
  porcentajeSimilitud?: string;
  estado: string;
}

// Lista los reportes de similitud (Turnitin vía Canvas Academic).
export async function listarReportesCanvas(): Promise<ReporteCanvas[]> {
  if (isMockScrapers()) {
    const min = (m: number) => new Date(Date.now() - m * 60000).toLocaleString('es-PE');
    return [
      { id: 'cv-2001', nombre: 'tesis_capitulo1.docx', fecha: min(30), estado: 'Completado', porcentajeSimilitud: '8%' },
      { id: 'cv-2002', nombre: 'marco_teorico.docx', fecha: min(120), estado: 'Completado', porcentajeSimilitud: '21%' },
    ];
  }

  const browser = await crearBrowser(true);
  const page = await browser.newPage();
  const reportes: ReporteCanvas[] = [];
  try {
    await page.goto(URL_LOGIN, { waitUntil: 'networkidle' });
    await page.fill('input[type="email"], input[name="email"], input[placeholder*="correo"]', process.env.CANVAS_EMAIL!);
    await page.fill('input[type="password"]', process.env.CANVAS_PASSWORD!);
    await page.click('button[type="submit"], button:has-text("Iniciar"), button:has-text("Login")');
    await page.waitForTimeout(3000);
    await page.goto(URL_DASHBOARD, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    const filas = await page.$$eval(
      '.report-card, .submission-item, tr.report-row, [class*="reporte"], [class*="historial"] li',
      (els) => els.map((el) => ({
        id: el.getAttribute('data-id') || el.getAttribute('data-report-id') || el.getAttribute('id') || '',
        nombre: el.querySelector('[class*="title"], [class*="nombre"], td:nth-child(1)')?.textContent?.trim() || '',
        fecha: el.querySelector('[class*="date"], [class*="fecha"], time')?.textContent?.trim() || '',
        porcentajeSimilitud: el.querySelector('[class*="percent"], [class*="similitud"]')?.textContent?.trim() || '',
        estado: el.querySelector('[class*="status"], [class*="estado"]')?.textContent?.trim() || 'Completado',
      }))
    );
    reportes.push(...filas);
  } finally {
    await browser.close();
  }
  return reportes;
}

// Descarga el PDF del reporte y lo guarda (local + Drive). Devuelve la URL.
export async function descargarReporteCanvas(reporteId: string, nombreCliente: string): Promise<string> {
  const nombreArchivo = `reporte-turnitin-${nombreCliente.replace(/\s+/g, '-')}.pdf`;

  if (isMockScrapers()) {
    const valor = reporteId === 'cv-2002' ? '21%' : '8%';
    const pdf = generarPDFMock({ plataforma: 'Turnitin / Canvas (Similitud)', cliente: nombreCliente, metrica: 'Índice de similitud', valor });
    return guardarPDF(pdf, nombreArchivo, 'canvas');
  }

  const browser = await crearBrowser(true);
  const page = await browser.newPage();
  try {
    await page.goto(URL_LOGIN, { waitUntil: 'networkidle' });
    await page.fill('input[type="email"], input[name="email"], input[placeholder*="correo"]', process.env.CANVAS_EMAIL!);
    await page.fill('input[type="password"]', process.env.CANVAS_PASSWORD!);
    await page.click('button[type="submit"], button:has-text("Iniciar"), button:has-text("Login")');
    await page.waitForTimeout(3000);
    await page.goto(URL_DASHBOARD, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await page.click(`[data-id="${reporteId}"], [data-report-id="${reporteId}"]`).catch(() => page.click(`text="${reporteId}"`));
    await page.waitForTimeout(2000);
    const selectorDescarga = 'a[href*=".pdf"], a[href*="/download"], button:has-text("Descargar"), button:has-text("PDF")';
    const pdfUrl = await page.$eval(selectorDescarga, (el) => (el as HTMLAnchorElement).href || '').catch(() => '');
    const buffer = await descargarPDF(page, pdfUrl || selectorDescarga);
    return guardarPDF(buffer, nombreArchivo, 'canvas');
  } finally {
    await browser.close();
  }
}

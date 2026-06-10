import { crearBrowser, descargarPDF, guardarPDF, generarPDFMock, isMockScrapers } from './scraper-base';

const URL_LOGIN = 'https://iverificate.com/login';
const URL_INBOX = 'https://iverificate.com/originality/inbox';

export interface ReporteIVerificate {
  id: string;
  nombre: string;
  fecha: string;
  estado: string;
  porcentajeIA?: string;
  urlDescarga?: string;
}

// Lista los reportes disponibles en el inbox de iVerificate (detección de IA).
export async function listarReportesIVerificate(): Promise<ReporteIVerificate[]> {
  if (isMockScrapers()) {
    const min = (m: number) => new Date(Date.now() - m * 60000).toLocaleString('es-PE');
    return [
      { id: 'iv-1001', nombre: 'tesis_capitulo1.docx', fecha: min(15), estado: 'Listo', porcentajeIA: '12%' },
      { id: 'iv-1002', nombre: 'marco_teorico.docx', fecha: min(95), estado: 'Listo', porcentajeIA: '38%' },
      { id: 'iv-1003', nombre: 'articulo_revista.pdf', fecha: min(220), estado: 'Procesando', porcentajeIA: '—' },
    ];
  }

  const browser = await crearBrowser(true);
  const page = await browser.newPage();
  const reportes: ReporteIVerificate[] = [];
  try {
    await page.goto(URL_LOGIN, { waitUntil: 'networkidle' });
    await page.fill('input[type="email"], input[name="email"]', process.env.IVERIFICATE_EMAIL!);
    await page.fill('input[type="password"], input[name="password"]', process.env.IVERIFICATE_PASSWORD!);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    await page.goto(URL_INBOX, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    const filas = await page.$$eval(
      'tr[data-id], .report-item, .inbox-row, [class*="submission"], [class*="report-row"]',
      (els) => els.map((el) => ({
        id: el.getAttribute('data-id') || el.getAttribute('id') || '',
        nombre: el.querySelector('[class*="name"], td:nth-child(2)')?.textContent?.trim() || '',
        fecha: el.querySelector('[class*="date"], td:nth-child(3)')?.textContent?.trim() || '',
        estado: el.querySelector('[class*="status"], td:last-child')?.textContent?.trim() || '',
        porcentajeIA: el.querySelector('[class*="percent"], [class*="ai"]')?.textContent?.trim() || '',
      }))
    );
    reportes.push(...filas);
  } finally {
    await browser.close();
  }
  return reportes;
}

// Descarga un reporte y lo guarda (local + Drive). Devuelve la URL pública.
export async function descargarReporteIVerificate(reporteId: string, nombreCliente: string): Promise<string> {
  const nombreArchivo = `reporte-ia-${nombreCliente.replace(/\s+/g, '-')}.pdf`;

  if (isMockScrapers()) {
    const valor = reporteId === 'iv-1002' ? '38%' : '12%';
    const pdf = generarPDFMock({ plataforma: 'iVerificate (Detección IA)', cliente: nombreCliente, metrica: 'Porcentaje de contenido generado por IA', valor });
    return guardarPDF(pdf, nombreArchivo, 'iverificate');
  }

  const browser = await crearBrowser(true);
  const page = await browser.newPage();
  try {
    await page.goto(URL_LOGIN, { waitUntil: 'networkidle' });
    await page.fill('input[type="email"], input[name="email"]', process.env.IVERIFICATE_EMAIL!);
    await page.fill('input[type="password"], input[name="password"]', process.env.IVERIFICATE_PASSWORD!);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    await page.goto(URL_INBOX, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await page.click(`[data-id="${reporteId}"], #${reporteId}`).catch(() => page.click(`text="${reporteId}"`));
    await page.waitForTimeout(1500);
    const selectorDescarga = 'a[href*=".pdf"], button:has-text("Download"), button:has-text("Descargar"), a:has-text("PDF")';
    const pdfUrl = await page.$eval(selectorDescarga, (el) => (el as HTMLAnchorElement).href || '').catch(() => '');
    const buffer = await descargarPDF(page, pdfUrl || selectorDescarga);
    return guardarPDF(buffer, nombreArchivo, 'iverificate');
  } finally {
    await browser.close();
  }
}

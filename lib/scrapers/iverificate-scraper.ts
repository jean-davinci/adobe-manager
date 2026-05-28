import { crearBrowser, esperarElemento, descargarPDF, subirPDFaSupabase } from './scraper-base';

const URL_LOGIN    = 'https://iverificate.com/login';
const URL_INBOX    = 'https://iverificate.com/originality/inbox';

export interface ReporteIVerificate {
  id: string;
  nombre: string;
  fecha: string;
  estado: string;
  porcentajeIA?: string;
  urlDescarga?: string;
}

// Lista todos los reportes disponibles en el inbox
export async function listarReportesIVerificate(): Promise<ReporteIVerificate[]> {
  const browser = await crearBrowser(false); // false = modo visual para debug
  const page = await browser.newPage();
  const reportes: ReporteIVerificate[] = [];

  try {
    // 1. LOGIN
    await page.goto(URL_LOGIN, { waitUntil: 'networkidle' });

    // 🔧 AJUSTAR si los selectores son distintos — usa el inspector del browser
    await page.fill('input[type="email"], input[name="email"]', process.env.IVERIFICATE_EMAIL!);
    await page.fill('input[type="password"], input[name="password"]', process.env.IVERIFICATE_PASSWORD!);
    await page.click('button[type="submit"]');

    // 2. ESPERAR QUE CARGUE EL DASHBOARD
    await page.waitForURL('**/dashboard**', { timeout: 15000 }).catch(() => {
      // Algunos sitios no redirigen con /dashboard, esperamos que desaparezca el form de login
    });
    await page.waitForTimeout(2000);

    // 3. IR AL INBOX
    await page.goto(URL_INBOX, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // 4. EXTRAER LISTA DE REPORTES
    // 🔧 AJUSTAR: Inspecciona la página (F12) y busca qué elemento contiene cada fila de reporte
    // Busca una tabla, lista de cards, o divs con los reportes
    const filas = await page.$$eval(
      // Selector de cada fila/card de reporte — ajusta según lo que veas en F12
      'tr[data-id], .report-item, .inbox-row, [class*="submission"], [class*="report-row"]',
      (elementos) =>
        elementos.map((el) => ({
          id: el.getAttribute('data-id') || el.getAttribute('id') || '',
          nombre:
            el.querySelector('[class*="name"], [class*="filename"], td:nth-child(2)')?.textContent?.trim() || '',
          fecha:
            el.querySelector('[class*="date"], [class*="time"], td:nth-child(3)')?.textContent?.trim() || '',
          estado:
            el.querySelector('[class*="status"], [class*="state"], td:last-child')?.textContent?.trim() || '',
          porcentajeIA:
            el.querySelector('[class*="percent"], [class*="score"], [class*="ai"]')?.textContent?.trim() || '',
        }))
    );

    reportes.push(...filas);

    // Si no encontró nada, toma un screenshot para debug
    if (reportes.length === 0) {
      await page.screenshot({ path: '/tmp/iverificate-debug.png', fullPage: true });
      console.log('⚠️ No se encontraron reportes. Screenshot guardado en /tmp/iverificate-debug.png');
      console.log('📌 Abre el archivo y ajusta los selectores en listarReportesIVerificate()');
    }

  } finally {
    await browser.close();
  }

  return reportes;
}

// Descarga un reporte específico y lo sube a Supabase
export async function descargarReporteIVerificate(
  reporteId: string,
  nombreCliente: string
): Promise<string> {
  const browser = await crearBrowser(false);
  const page = await browser.newPage();

  try {
    // Login
    await page.goto(URL_LOGIN, { waitUntil: 'networkidle' });
    await page.fill('input[type="email"], input[name="email"]', process.env.IVERIFICATE_EMAIL!);
    await page.fill('input[type="password"], input[name="password"]', process.env.IVERIFICATE_PASSWORD!);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);

    // Ir al inbox
    await page.goto(URL_INBOX, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // 🔧 AJUSTAR: Click en el reporte específico o su botón de descarga
    // Opciones comunes:
    // - Click en la fila y luego buscar botón "Descargar PDF"
    // - Click directo en botón de descarga de esa fila
    const selectorFila = `[data-id="${reporteId}"], #${reporteId}`;
    await page.click(selectorFila).catch(async () => {
      // Si no funciona por data-id, intenta hacer click en el link del reporte
      await page.click(`text="${reporteId}"`);
    });

    await page.waitForTimeout(1500);

    // 🔧 AJUSTAR: Selector del botón "Descargar PDF" o "Download Report"
    const selectorDescarga = 
      'a[href*=".pdf"], button:has-text("Download"), button:has-text("Descargar"), a:has-text("PDF")';

    const pdfUrl = await page.$eval(selectorDescarga, (el) =>
      (el as HTMLAnchorElement).href || ''
    ).catch(() => '');

    const buffer = await descargarPDF(page, pdfUrl || selectorDescarga);
    const nombreArchivo = `reporte-ia-${nombreCliente.replace(/\s+/g, '-')}.pdf`;
    const urlPublica = await subirPDFaSupabase(buffer, nombreArchivo, 'iverificate');

    return urlPublica;

  } finally {
    await browser.close();
  }
}
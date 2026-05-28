import { crearBrowser, descargarPDF, subirPDFaSupabase } from './scraper-base';

const URL_LOGIN     = 'https://canvasacademic.com/login';
const URL_DASHBOARD = 'https://canvasacademic.com/dashboard';

export interface ReporteCanvas {
  id: string;
  nombre: string;
  fecha: string;
  porcentajeSimilitud?: string;
  estado: string;
}

// Lista los reportes de Turnitin disponibles en Canvas Academic
export async function listarReportesCanvas(): Promise<ReporteCanvas[]> {
  const browser = await crearBrowser(false);
  const page = await browser.newPage();
  const reportes: ReporteCanvas[] = [];

  try {
    // 1. LOGIN
    await page.goto(URL_LOGIN, { waitUntil: 'networkidle' });

    // 🔧 AJUSTAR selectores de login si son distintos
    await page.fill('input[type="email"], input[name="email"], input[placeholder*="correo"], input[placeholder*="email"]',
      process.env.CANVAS_EMAIL!
    );
    await page.fill('input[type="password"], input[name="password"]',
      process.env.CANVAS_PASSWORD!
    );
    await page.click('button[type="submit"], button:has-text("Iniciar"), button:has-text("Login"), button:has-text("Entrar")');
    await page.waitForTimeout(3000);

    // 2. IR AL DASHBOARD / REPORTES
    await page.goto(URL_DASHBOARD, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // 🔧 AJUSTAR: Si los reportes están en otra ruta, cámbiala arriba
    // Busca en el sidebar de Canvas cuál es la sección de reportes/historial

    // 3. EXTRAER LISTA DE REPORTES
    // 🔧 AJUSTAR selector según lo que veas con F12 en canvasacademic.com/dashboard
    const filas = await page.$$eval(
      // Prueba estos selectores en orden hasta que uno funcione:
      '.report-card, .submission-item, tr.report-row, [class*="reporte"], [class*="historial"] li',
      (elementos) =>
        elementos.map((el) => ({
          id: el.getAttribute('data-id') || el.getAttribute('data-report-id') || el.getAttribute('id') || '',
          nombre: el.querySelector('[class*="title"], [class*="nombre"], [class*="name"], td:nth-child(1)')?.textContent?.trim() || '',
          fecha: el.querySelector('[class*="date"], [class*="fecha"], time')?.textContent?.trim() || '',
          porcentajeSimilitud: el.querySelector('[class*="percent"], [class*="similitud"], [class*="score"]')?.textContent?.trim() || '',
          estado: el.querySelector('[class*="status"], [class*="estado"]')?.textContent?.trim() || 'Completado',
        }))
    );

    reportes.push(...filas);

    if (reportes.length === 0) {
      await page.screenshot({ path: '/tmp/canvas-debug.png', fullPage: true });
      console.log('⚠️ No se encontraron reportes. Screenshot guardado en /tmp/canvas-debug.png');
      console.log('📌 Abre el archivo y ajusta los selectores en listarReportesCanvas()');
    }

  } finally {
    await browser.close();
  }

  return reportes;
}

// Descarga el PDF de un reporte específico
export async function descargarReporteCanvas(
  reporteId: string,
  nombreCliente: string
): Promise<string> {
  const browser = await crearBrowser(false);
  const page = await browser.newPage();

  try {
    // Login
    await page.goto(URL_LOGIN, { waitUntil: 'networkidle' });
    await page.fill('input[type="email"], input[name="email"], input[placeholder*="correo"]',
      process.env.CANVAS_EMAIL!
    );
    await page.fill('input[type="password"]', process.env.CANVAS_PASSWORD!);
    await page.click('button[type="submit"], button:has-text("Iniciar"), button:has-text("Login")');
    await page.waitForTimeout(3000);

    await page.goto(URL_DASHBOARD, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // 🔧 AJUSTAR: Navegar al reporte específico
    // Opción A: Click en el elemento por su ID
    await page.click(`[data-id="${reporteId}"], [data-report-id="${reporteId}"]`).catch(async () => {
      // Opción B: Click en el texto del nombre
      await page.click(`text="${reporteId}"`);
    });

    await page.waitForTimeout(2000);

    // 🔧 AJUSTAR: Selector del botón de descarga del PDF
    const selectorDescarga =
      'a[href*=".pdf"], a[href*="/download"], button:has-text("Descargar"), button:has-text("PDF"), a:has-text("Descargar reporte")';

    const pdfUrl = await page.$eval(selectorDescarga, (el) =>
      (el as HTMLAnchorElement).href || ''
    ).catch(() => '');

    const buffer = await descargarPDF(page, pdfUrl || selectorDescarga);
    const nombreArchivo = `reporte-turnitin-${nombreCliente.replace(/\s+/g, '-')}.pdf`;
    const urlPublica = await subirPDFaSupabase(buffer, nombreArchivo, 'canvas');

    return urlPublica;

  } finally {
    await browser.close();
  }
}
import { chromium, Browser, Page } from 'playwright';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // necesitas esta key (no la pública)
);

// Sube un buffer PDF a Supabase Storage y devuelve la URL pública
export async function subirPDFaSupabase(
  buffer: Buffer,
  nombreArchivo: string,
  carpeta: 'iverificate' | 'canvas'
): Promise<string> {
  const filePath = `reportes/${carpeta}/${Date.now()}_${nombreArchivo}`;

  const { error } = await supabase.storage
    .from('reportes') // nombre del bucket en Supabase
    .upload(filePath, buffer, {
      contentType: 'application/pdf',
      upsert: true,
    });

  if (error) throw new Error(`Error subiendo PDF: ${error.message}`);

  const { data } = supabase.storage.from('reportes').getPublicUrl(filePath);
  return data.publicUrl;
}

// Crea el browser de Playwright
// headless: false → ves el browser (útil para debug)
// headless: true  → corre invisible (para producción)
export async function crearBrowser(headless = false): Promise<Browser> {
  return await chromium.launch({
    headless,
    slowMo: headless ? 0 : 200, // más lento en modo visual para poder seguirlo
  });
}

// Espera a que un selector exista con timeout personalizado
export async function esperarElemento(page: Page, selector: string, timeout = 15000) {
  await page.waitForSelector(selector, { timeout });
}

// Descarga un PDF desde una URL directa o interceptando la descarga
export async function descargarPDF(page: Page, urlOBoton: string): Promise<Buffer> {
  const tmpPath = path.join(os.tmpdir(), `reporte_${Date.now()}.pdf`);

  // Método 1: URL directa
  if (urlOBoton.startsWith('http') && urlOBoton.includes('.pdf')) {
    const response = await page.evaluate(async (url) => {
      const res = await fetch(url, { credentials: 'include' });
      const buf = await res.arrayBuffer();
      return Array.from(new Uint8Array(buf));
    }, urlOBoton);
    return Buffer.from(response);
  }

  // Método 2: Interceptar descarga al hacer click en botón
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.click(urlOBoton), // selector del botón de descarga
  ]);

  await download.saveAs(tmpPath);
  const buffer = fs.readFileSync(tmpPath);
  fs.unlinkSync(tmpPath); // limpiar archivo temporal
  return buffer;
}
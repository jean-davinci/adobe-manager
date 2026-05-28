import { chromium } from 'playwright';
import { readFileSync, existsSync, writeFileSync } from 'fs';
import { resolve, basename } from 'path';

const envFile = readFileSync('.env.local', 'utf-8');
const env = {};
for (const line of envFile.split('\n')) {
  const [key, ...rest] = line.split('=');
  if (key && rest.length) env[key.trim()] = rest.join('=').trim();
}

const ARCHIVO_PATH  = resolve(process.argv[2] || '');
const NOMBRE_TITULO = process.argv[3] || basename(ARCHIVO_PATH);

if (!ARCHIVO_PATH || !existsSync(ARCHIVO_PATH)) {
  console.error('❌ Debes pasar la ruta del archivo'); process.exit(1);
}

console.log('\n🚀 iVerificate Scraper v7');
console.log('📄 Archivo:', ARCHIVO_PATH);
console.log('📝 Título: ', NOMBRE_TITULO, '\n');

const browser = await chromium.launch({ headless: false, slowMo: 500 });
const context = await browser.newContext({ acceptDownloads: true });
const page    = await context.newPage();
page.setDefaultTimeout(60000);

try {
  // 1. LOGIN
  console.log('1️⃣  Login...');
  await page.goto('https://iverificate.com/login', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#email');
  await page.fill('#email',    env.IVERIFICATE_EMAIL);
  await page.fill('#password', env.IVERIFICATE_PASSWORD);
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 20000 }),
    page.click('button[type="submit"]')
  ]);
  await page.waitForTimeout(3000); // ⏳ espera post-login
  console.log('   ✅ Login OK');

  // 2. INBOX
  if (!page.url().includes('/originality/inbox')) {
    await page.goto('https://iverificate.com/originality/inbox', { waitUntil: 'domcontentloaded' });
  }
  await page.waitForSelector('button:has-text("Cargar Documento")', { timeout: 15000 });
  await page.waitForTimeout(2000); // ⏳ dejar cargar la tabla
  console.log('\n2️⃣  ✅ Inbox listo');

  // 3-6. SUBIR DOCUMENTO
  console.log('\n3️⃣  Subiendo documento...');
  await page.click('button:has-text("Cargar Documento")');
  await page.waitForSelector('text=Título del documento', { timeout: 10000 });
  await page.waitForTimeout(1500);

  await page.fill('input[placeholder*="Ensayo"], input[placeholder*="Ej."], input[placeholder*="grupo"]', NOMBRE_TITULO);
  await page.waitForTimeout(500);

  await (await page.$('input[type="file"]')).setInputFiles(ARCHIVO_PATH);
  await page.waitForTimeout(3000); // ⏳ esperar que el archivo aparezca en el modal
  console.log('   ✅ Archivo adjuntado');

  await page.click('button:has-text("Subir documento")');
  await page.waitForTimeout(5000); // ⏳ esperar confirmación de subida
  console.log('   ✅ Subida iniciada');

  // 7. ESPERAR AI SCORE Y OBTENER URL
  console.log('\n7️⃣  Esperando AI Score (puede tardar 1-3 min)...\n');
  let viewerUrl = '';

  for (let i = 1; i <= 36; i++) {
    await page.waitForTimeout(10000);

    const urlEncontrada = await page.evaluate((titulo) => {
      // Buscar anchor con href al viewer en la fila correcta
      const anchors = document.querySelectorAll('a[href*="/viewer/submissions"]');
      for (const a of anchors) {
        const fila = a.closest('tr');
        if (fila && (fila.textContent || '').includes(titulo)) return a.href;
      }
      // Buscar oid: en el HTML de la fila
      const filas = document.querySelectorAll('table tbody tr');
      for (const fila of filas) {
        const texto = fila.textContent || '';
        if (!texto.includes(titulo) || !texto.match(/\d+%\s*IA/)) continue;
        const oidMatch = fila.innerHTML.match(/oid:[A-Za-z0-9_-]+/);
        if (oidMatch) return `https://iverificate.com/viewer/submissions/${oidMatch[0]}`;
      }
      return '';
    }, NOMBRE_TITULO);

    if (urlEncontrada) {
      viewerUrl = urlEncontrada.startsWith('http')
        ? urlEncontrada
        : `https://iverificate.com${urlEncontrada}`;
      console.log(`\n   ✅ URL del viewer en ~${i * 10}s`);
      console.log('   🔗', viewerUrl);
      break;
    }
    process.stdout.write(`   ⏳ ${i * 10}s...\r`);
  }

  if (!viewerUrl) throw new Error('No se encontró el viewer en 6 minutos.');

  // 8. NAVEGAR AL VIEWER — con bastante tiempo para que cargue
  console.log('\n8️⃣  Navegando al viewer...');
  await page.goto(viewerUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(5000); // ⏳ dejar que el PDF viewer cargue completamente

  // Esperar que el botón esté visible Y habilitado
  await page.waitForSelector(
    'button:has-text("Descargar reporte"), a:has-text("Descargar reporte")',
    { timeout: 30000 }
  );
  await page.waitForTimeout(3000); // ⏳ esperar que el botón esté listo para clickear
  console.log('   ✅ Viewer cargado, botón listo');

  // 9. DESCARGAR — con timeout generoso de 60 segundos
  console.log('\n9️⃣  Descargando reporte PDF...');
  const nombrePDF    = `reporte-ia-${NOMBRE_TITULO.replace(/[^a-zA-Z0-9]/g, '-')}.pdf`;
  const rutaGuardado = `/tmp/${nombrePDF}`;

  // Interceptar requests para capturar PDF aunque no dispare "download"
  let pdfUrlInterceptada = '';
  page.on('response', async (response) => {
    const url = response.url();
    const ct  = response.headers()['content-type'] || '';
    if (ct.includes('pdf') || url.includes('.pdf') || url.includes('/report')) {
      pdfUrlInterceptada = url;
      console.log('   🎯 PDF interceptado:', url.slice(0, 80));
    }
  });

  const boton = await page.$('button:has-text("Descargar reporte"), a:has-text("Descargar reporte")');

  // Esperar cualquiera de los 3 eventos posibles
  const resultado = await Promise.race([
    page.waitForEvent('download', { timeout: 60000 }).then(d => ({ tipo: 'download', data: d })),
    context.waitForEvent('page',  { timeout: 60000 }).then(p => ({ tipo: 'pagina',  data: p })),
    new Promise(resolve => setTimeout(() => resolve({ tipo: 'timeout' }), 60000))
  ]);

  // Click DESPUÉS de registrar los listeners
  await boton.click();
  await page.waitForTimeout(8000); // ⏳ dar tiempo para que procese

  if (resultado.tipo === 'download') {
    await resultado.data.saveAs(rutaGuardado);
    console.log('   ✅ Descarga directa completada');

  } else if (resultado.tipo === 'pagina') {
    const nuevaPagina = resultado.data;
    await nuevaPagina.waitForLoadState('domcontentloaded');
    await nuevaPagina.waitForTimeout(3000);
    const pdfUrl = nuevaPagina.url();
    console.log('   📄 Nueva pestaña:', pdfUrl.slice(0, 80));
    const pdfBuffer = await nuevaPagina.evaluate(async (url) => {
      const res = await fetch(url, { credentials: 'include' });
      const buf = await res.arrayBuffer();
      return Array.from(new Uint8Array(buf));
    }, pdfUrl);
    writeFileSync(rutaGuardado, Buffer.from(pdfBuffer));
    await nuevaPagina.close();
    console.log('   ✅ Descargado desde nueva pestaña');

  } else if (pdfUrlInterceptada) {
    // El PDF se cargó como response — descargarlo con las cookies de sesión
    console.log('   📡 Descargando PDF interceptado...');
    const pdfBuffer = await page.evaluate(async (url) => {
      const res = await fetch(url, { credentials: 'include' });
      const buf = await res.arrayBuffer();
      return Array.from(new Uint8Array(buf));
    }, pdfUrlInterceptada);
    writeFileSync(rutaGuardado, Buffer.from(pdfBuffer));
    console.log('   ✅ PDF interceptado y guardado');

  } else {
    // Último recurso: screenshot para ver qué pasó
    await page.screenshot({ path: '/tmp/paso9-debug.png', fullPage: true });
    throw new Error('Ningún método de descarga funcionó. Ver /tmp/paso9-debug.png');
  }

  console.log('\n✅ ¡REPORTE DESCARGADO EXITOSAMENTE!');
  console.log('📁 Ruta:', rutaGuardado);
  console.log('   Abrir: open', rutaGuardado, '\n');
  await page.waitForTimeout(2000);

} catch (err) {
  console.error('\n❌ Error:', err.message);
  await page.screenshot({ path: '/tmp/error.png', fullPage: true });
  console.log('📸 /tmp/error.png\n');
} finally {
  await browser.close();
}

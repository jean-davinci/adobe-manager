import { chromium } from 'playwright';
import { readFileSync } from 'fs';

const envFile = readFileSync('.env.local', 'utf-8');
const env = {};
for (const line of envFile.split('\n')) {
  const [key, ...rest] = line.split('=');
  if (key && rest.length) env[key.trim()] = rest.join('=').trim();
}

const browser = await chromium.launch({ headless: false, slowMo: 300 });
const page = await browser.newPage();

await page.goto('https://iverificate.com/login', { waitUntil: 'domcontentloaded' });
await page.fill('#email', env.IVERIFICATE_EMAIL);
await page.fill('#password', env.IVERIFICATE_PASSWORD);
await Promise.all([
  page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 20000 }),
  page.click('button[type="submit"]')
]);
await page.waitForTimeout(2000);

// Analizar la primera fila de la tabla
console.log('\n🔍 Analizando estructura de la tabla...\n');

const info = await page.evaluate(() => {
  const filas = document.querySelectorAll('table tbody tr');
  return Array.from(filas).slice(0, 3).map((fila, i) => {
    const celdas = fila.querySelectorAll('td');
    const links  = fila.querySelectorAll('a');
    return {
      fila: i + 1,
      html_preview: fila.innerHTML.slice(0, 300),
      links: Array.from(links).map(a => ({ text: a.textContent?.trim(), href: a.href })),
      celdas: Array.from(celdas).map(td => td.textContent?.trim().slice(0, 50)),
      onclick: fila.getAttribute('onclick'),
      data_attrs: Array.from(fila.attributes).map(a => `${a.name}="${a.value}"`).join(', ')
    };
  });
});

info.forEach(row => {
  console.log(`\n--- FILA ${row.fila} ---`);
  console.log('Celdas:', row.celdas);
  console.log('Links:', row.links);
  console.log('onclick:', row.onclick);
  console.log('data attrs:', row.data_attrs);
  console.log('HTML preview:', row.html_preview);
});

await page.screenshot({ path: '/tmp/inbox-debug.png', fullPage: true });
console.log('\n📸 Screenshot: /tmp/inbox-debug.png');
await page.waitForTimeout(3000);
await browser.close();

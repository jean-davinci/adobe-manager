import { chromium } from 'playwright';
import { readFileSync } from 'fs';

const envFile = readFileSync('.env.local', 'utf-8');
const env = {};
for (const line of envFile.split('\n')) {
  const [key, ...rest] = line.split('=');
  if (key && rest.length) env[key.trim()] = rest.join('=').trim();
}

const plataforma = process.argv[2] || 'iverificate';
const cfg = {
  iverificate: { loginUrl: 'https://iverificate.com/login', inboxUrl: 'https://iverificate.com/originality/inbox', email: env.IVERIFICATE_EMAIL, password: env.IVERIFICATE_PASSWORD },
  canvas: { loginUrl: 'https://canvasacademic.com/login', inboxUrl: 'https://canvasacademic.com/dashboard', email: env.CANVAS_EMAIL, password: env.CANVAS_PASSWORD },
}[plataforma];

console.log('🚀 Iniciando exploración de', plataforma);
const browser = await chromium.launch({ headless: false, slowMo: 300 });
const page = await browser.newPage();

await page.goto(cfg.loginUrl, { waitUntil: 'networkidle' });
await page.screenshot({ path: '/tmp/paso1-login.png', fullPage: true });
console.log('📸 Screenshot login guardado en /tmp/paso1-login.png');

const inputs = await page.$$eval('input', els => els.map(el => ({ type: el.type, name: el.name, id: el.id, placeholder: el.placeholder })));
console.log('📋 Inputs en login:'); console.table(inputs);

const emailEl = await page.$('input[type="email"]') || await page.$('input[name="email"]') || await page.$('input[placeholder*="mail" i]');
const passEl = await page.$('input[type="password"]');
if (emailEl) await emailEl.fill(cfg.email);
if (passEl) await passEl.fill(cfg.password);

const btn = await page.$('button[type="submit"]') || await page.$('button:has-text("Iniciar")') || await page.$('button:has-text("Login")');
if (btn) await btn.click();

await page.waitForTimeout(4000);
console.log('✅ Post-login URL:', page.url());

await page.goto(cfg.inboxUrl, { waitUntil: 'networkidle' });
await page.waitForTimeout(2000);
await page.screenshot({ path: '/tmp/paso2-inbox.png', fullPage: true });
console.log('📸 Screenshot inbox guardado en /tmp/paso2-inbox.png');

const links = await page.$$eval('a', as => as.filter(a => a.href.includes('pdf') || a.href.includes('download') || a.textContent?.toLowerCase().includes('descargar')).map(a => ({ text: a.textContent?.trim().slice(0,50), href: a.href.slice(0,100) })));
if (links.length) { console.log('📄 Links de descarga:'); console.table(links); }

const elementos = await page.$$eval('[class*="report"],[class*="submission"],[class*="card"],[class*="inbox"],[class*="row"]', els => els.slice(0,8).map(el => ({ tag: el.tagName, class: el.className.slice(0,60), texto: el.textContent?.trim().slice(0,60) })));
if (elementos.length) { console.log('🏗️ Elementos relevantes:'); console.table(elementos); }

console.log('\n✅ Listo! Comparte los screenshots /tmp/paso1-login.png y /tmp/paso2-inbox.png');
await page.waitForTimeout(3000);
await browser.close();

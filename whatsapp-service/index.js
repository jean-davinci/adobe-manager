const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const express = require('express');
const qrcode = require('qrcode');
const crypto = require('crypto');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3001;
const SECRET = process.env.WA_SERVICE_SECRET;
const CRM_WEBHOOK_URL = process.env.CRM_WEBHOOK_URL; // ej: https://tu-app.vercel.app/api/webhooks/whatsapp

if (!SECRET) {
  console.error('ERROR: WA_SERVICE_SECRET no definido. El servicio no arrancará.');
  process.exit(1);
}

// ─── Estado del cliente ──────────────────────────────────────────────────────
let qrDataUrl = null;
let isReady = false;
let clientInfo = null;
let lastError = null;

// ─── Cliente WhatsApp ────────────────────────────────────────────────────────
const client = new Client({
  authStrategy: new LocalAuth({ dataPath: './wa-session' }),
  puppeteer: {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu',
    ],
  },
});

client.on('loading_screen', (percent) => {
  console.log(`[WA] Cargando: ${percent}%`);
});

client.on('qr', async (qr) => {
  qrDataUrl = await qrcode.toDataURL(qr);
  isReady = false;
  lastError = null;
  console.log('[WA] QR generado — escanea desde el dashboard');
});

client.on('authenticated', () => {
  qrDataUrl = null;
  console.log('[WA] Autenticado correctamente');
});

client.on('ready', async () => {
  isReady = true;
  qrDataUrl = null;
  lastError = null;
  clientInfo = await client.getContactById(client.info.wid._serialized).catch(() => null);
  const name = client.info.pushname || 'Desconocido';
  const phone = client.info.wid.user;
  console.log(`[WA] Listo — ${name} (+${phone})`);
});

client.on('disconnected', (reason) => {
  isReady = false;
  lastError = reason;
  console.log(`[WA] Desconectado: ${reason}`);
});

client.on('auth_failure', (msg) => {
  lastError = msg;
  console.error(`[WA] Error de autenticación: ${msg}`);
});

// ─── Mensajes entrantes → CRM ────────────────────────────────────────────────
client.on('message', async (msg) => {
  if (!CRM_WEBHOOK_URL) return;

  // Ignorar grupos (solo mensajes 1-a-1)
  if (msg.from.includes('@g.us')) return;
  // Ignorar mensajes propios
  if (msg.fromMe) return;

  const telefono = msg.from.replace('@c.us', '');
  const contacto = await msg.getContact();
  const nombre = contacto.pushname || contacto.name || telefono;
  const texto = msg.hasMedia
    ? `[${msg.type}]${msg.body ? ' ' + msg.body : ''}`
    : msg.body;

  const payload = { telefono, nombre, texto };
  const sig = crypto
    .createHmac('sha256', SECRET)
    .update(JSON.stringify(payload))
    .digest('hex');

  try {
    const res = await fetch(CRM_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-wa-service-sig': `sha256=${sig}`,
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) console.error(`[WA] Webhook CRM respondió ${res.status}`);
  } catch (e) {
    console.error(`[WA] Error enviando webhook al CRM: ${e.message}`);
  }
});

client.initialize().catch((e) => {
  lastError = e.message;
  console.error('[WA] Error al inicializar:', e.message);
});

// ─── Middleware de auth ──────────────────────────────────────────────────────
function auth(req, res, next) {
  const token = req.headers['authorization']?.replace('Bearer ', '');
  if (token !== SECRET) {
    return res.status(401).json({ error: 'No autorizado' });
  }
  next();
}

// ─── API REST ────────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ ok: true });
});

app.get('/status', auth, (req, res) => {
  res.json({
    ready: isReady,
    hasQr: !!qrDataUrl,
    error: lastError,
    phone: isReady ? client.info?.wid?.user : null,
    name: isReady ? client.info?.pushname : null,
  });
});

app.get('/qr', auth, (req, res) => {
  if (isReady) return res.json({ ready: true });
  if (!qrDataUrl) return res.json({ waiting: true, error: lastError });
  res.json({ qr: qrDataUrl });
});

// POST /send — envía un mensaje de texto
// Body: { to: "51987654321", body: "Hola!" }
app.post('/send', auth, async (req, res) => {
  if (!isReady) return res.status(503).json({ error: 'WhatsApp no listo' });
  const { to, body } = req.body;
  if (!to || !body) return res.status(400).json({ error: 'Faltan to y/o body' });

  try {
    const chatId = to.includes('@') ? to : `${to}@c.us`;
    const msg = await client.sendMessage(chatId, body);
    res.json({ ok: true, id: msg.id._serialized });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /send-media — envía imagen/archivo desde URL
// Body: { to, url, caption?, filename? }
app.post('/send-media', auth, async (req, res) => {
  if (!isReady) return res.status(503).json({ error: 'WhatsApp no listo' });
  const { to, url, caption, filename } = req.body;
  if (!to || !url) return res.status(400).json({ error: 'Faltan to y/o url' });

  try {
    const chatId = to.includes('@') ? to : `${to}@c.us`;
    const media = await MessageMedia.fromUrl(url, { filename: filename ?? 'archivo' });
    await client.sendMessage(chatId, media, { caption: caption ?? '' });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /logout — cierra sesión y regenera QR
app.post('/logout', auth, async (req, res) => {
  try {
    await client.logout();
    isReady = false;
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(PORT, () => {
  console.log(`[WA Service] Corriendo en puerto ${PORT}`);
});

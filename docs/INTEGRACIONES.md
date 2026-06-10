# Integraciones — Davinci Labs

Cada integración funciona en **modo MOCK** por defecto y pasa a **real** automáticamente
cuando sus credenciales están presentes en `.env.local` **y** `MOCK_MODE` no es `true`.

> Para activar las reales: pon `MOCK_MODE=false` (o quita la línea) en `.env.local`,
> agrega las variables de abajo y **reinicia el servidor** (`npm run dev`).
> El estado en vivo se ve en `/dashboard/integraciones`.

---

## 1. Google (Gmail + Drive) — OAuth2

Ambas usan la misma cuenta `davincilabs.peru@gmail.com` y el mismo cliente OAuth.

1. **Google Cloud Console** → crea un proyecto.
2. **APIs y servicios → Biblioteca**: habilita **Gmail API** y **Google Drive API**.
3. **Credenciales → Crear → ID de cliente OAuth** (tipo *Aplicación web*).
   - Authorized redirect URI: `https://developers.google.com/oauthplayground`
   - Copia **Client ID** y **Client Secret**.
4. **Refresh token** (en [OAuth Playground](https://developers.google.com/oauthplayground)):
   - ⚙️ → *Use your own OAuth credentials* → pega Client ID/Secret.
   - Selecciona scopes: `https://www.googleapis.com/auth/gmail.readonly` y
     `https://www.googleapis.com/auth/drive.file`.
   - *Authorize APIs* → inicia sesión con la cuenta de Davinci → *Exchange authorization code for tokens*.
   - Copia el **Refresh token**.
5. **Carpeta de Drive**: crea una carpeta raíz en Drive y copia el ID de la URL
   (`https://drive.google.com/drive/folders/<ESTE_ID>`).

```env
GOOGLE_CLIENT_ID="...apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="..."
GMAIL_REFRESH_TOKEN="1//..."
GOOGLE_DRIVE_FOLDER_ID="..."         # solo para Drive
GMAIL_EMAIL="davincilabs.peru@gmail.com"
```

---

## 2. WhatsApp Business Cloud API (Meta)

1. [Meta for Developers](https://developers.facebook.com/) → crea una app tipo *Business*.
2. Agrega el producto **WhatsApp** → *API Setup*.
3. Copia el **Temporary access token** (o genera uno **permanente** con un System User)
   y el **Phone number ID**.
4. **Webhook** (para recibir mensajes): configura la URL
   `https://TU_DOMINIO/api/webhooks/whatsapp` y un *Verify token* a tu elección
   (el mismo que pongas en `WHATSAPP_VERIFY_TOKEN`). Suscríbete al campo `messages`.

```env
WHATSAPP_TOKEN="EAAG..."
WHATSAPP_PHONE_NUMBER_ID="123456789012345"
WHATSAPP_VERIFY_TOKEN="un-secreto-a-tu-eleccion"
WHATSAPP_GRAPH_VERSION="v21.0"        # opcional
```

> En local el webhook entrante no es alcanzable por Meta; la app ya hace **polling cada 10s**.
> Para probar el webhook real usa un túnel (ngrok) apuntando a `localhost:3000`.

---

## 3. Email (Resend)

1. [resend.com](https://resend.com) → **API Keys** → crea una key.
2. Verifica tu dominio remitente (o usa `onboarding@resend.dev` para pruebas).

```env
RESEND_API_KEY="re_..."
```

---

## 4. Scrapers (iVerificate / Canvas)

Requieren las credenciales de cada plataforma y los navegadores de Playwright.

```bash
npx playwright install chromium
```

```env
IVERIFICATE_EMAIL="..."
IVERIFICATE_PASSWORD="..."
CANVAS_EMAIL="..."
CANVAS_PASSWORD="..."
```

> Los selectores del scraping (`lib/scrapers/*-scraper.ts`) están marcados con 🔧 y
> probablemente haya que ajustarlos al HTML real de cada sitio.

---

## Verificación

1. `MOCK_MODE=false` + variables cargadas → reinicia `npm run dev`.
2. Abre **`/dashboard/integraciones`**: cada tarjeta debe decir **● Conectado**.
3. Prueba: enviar un WhatsApp desde el CRM, subir un documento (mira Drive),
   abrir la bandeja Gmail en `/dashboard/afiliados`, notificar vencimientos (email).

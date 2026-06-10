# Deploy — Davinci Labs

La app es un **monolito Next.js** (App Router) que además usa **Playwright** (scrapers)
y **escritura en disco** (uploads/informes). Por eso el deploy recomendado es un
**servicio Node** con disco persistente, no Vercel serverless.

| Opción | Apto | Notas |
|---|---|---|
| **Railway / Render (Node + disco)** ✅ recomendado | Todo | `next start`, Playwright y fs funcionan; Postgres gestionado al lado |
| Vercel | Parcial | fs efímero (usar Drive para persistencia) y **Playwright no corre** (scrapers en mock) |

---

## A. Base de datos (Postgres gestionado)

1. Crea un Postgres en Railway / Render / Supabase.
2. Copia su **connection string** → variable `DATABASE_URL` (incluye `?sslmode=require`
   o deja que el código active SSL en producción automáticamente).
3. Aplica el esquema y (opcional) datos de ejemplo:
   ```bash
   DATABASE_URL="postgres://..." npm run db:migrate
   DATABASE_URL="postgres://..." npm run db:seed   # opcional, datos demo
   ```

---

## B. App en Railway / Render

1. Conecta el repo de GitHub.
2. **Build command:** `npm ci && npm run build`
   - Para scrapers reales añade: `npx playwright install --with-deps chromium`
3. **Start command:** `npm start` (respeta `PORT`).
4. Monta un **disco persistente** en la raíz del proyecto si quieres conservar
   `uploads/` y `public/reportes/` entre reinicios. (En producción lo ideal es que
   Drive sea el almacén canónico — ya está implementado.)
5. Carga las **variables de entorno** (ver más abajo).
6. Tras el primer deploy, crea el admin:
   ```bash
   curl -X POST https://TU_DOMINIO/api/seed-admin \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@davincilabs.pe","nombre":"Admin","password":"UNA_CLAVE_FUERTE"}'
   ```
   (Solo funciona si la tabla `usuarios` está vacía.)

---

## C. Variables de entorno

**Obligatorias**
```env
DATABASE_URL="postgres://...?sslmode=require"
SESSION_SECRET="<openssl rand -base64 32>"
NODE_ENV="production"
```

**Integraciones** (cada una pasa a real al tener sus credenciales; ver `docs/INTEGRACIONES.md`)
```env
MOCK_MODE="false"          # global; o usa overrides MOCK_EMAIL / MOCK_GMAIL / etc.
RESEND_API_KEY=""
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
GMAIL_REFRESH_TOKEN=""
GOOGLE_DRIVE_FOLDER_ID=""
WHATSAPP_TOKEN=""
WHATSAPP_PHONE_NUMBER_ID=""
WHATSAPP_VERIFY_TOKEN=""
IVERIFICATE_EMAIL=""
IVERIFICATE_PASSWORD=""
CANVAS_EMAIL=""
CANVAS_PASSWORD=""
```

> Activación gradual: dejá `MOCK_MODE=true` y andá poniendo `MOCK_<SERVICIO>=false`
> a medida que cargues credenciales (ej. `MOCK_EMAIL=false`). El estado en vivo está
> en `/dashboard/integraciones`.

---

## D. WhatsApp webhook (producción)

Configura en Meta el webhook a `https://TU_DOMINIO/api/webhooks/whatsapp` con el mismo
`WHATSAPP_VERIFY_TOKEN`. Suscríbete al campo `messages`. (En local el CRM usa polling 10s.)

---

## E. Checklist post-deploy

- [ ] `db:migrate` aplicado
- [ ] Admin creado con `/api/seed-admin`
- [ ] Login OK → `/dashboard`
- [ ] `/dashboard/integraciones` muestra el estado esperado
- [ ] (Si se usan scrapers) `playwright install` en el build
- [ ] Borrar/blindar `/api/seed-admin` una vez creado el admin

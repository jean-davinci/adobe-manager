# Auditoría de ciberseguridad — Davinci Labs

Fecha: 2026-06-12 · Estado: hallazgos corregidos en la rama `rediseno-davinci`.

## Resumen

Se revisó la superficie de ataque de la plataforma (auth, APIs, uploads,
cabeceras, webhooks). El hallazgo crítico fue un conjunto de endpoints que
exponían datos de clientes sin autenticación. Todo lo detectado fue corregido.

---

## Hallazgos y correcciones

### 🔴 Crítico — APIs sensibles sin autenticación
`GET /api/clientes` (y `servicios`, `proyectos`, `etapas`, `gmail`, `email`,
`clientes/[id]`, `servicios/[id]`, `proyectos/[id]`, `clientes/siguiente-pedido`)
respondían **sin sesión**. `/api/clientes` devolvía credenciales Adobe de los
clientes a cualquiera con la URL — el `proxy.ts` solo protege páginas, no `/api`.

**Corrección:** se añadió `requireApi('ADMIN','OPERATOR')` al inicio de cada
handler. Verificado: ahora devuelven `401` sin sesión.

### 🟠 Medio — Sin cabeceras de seguridad
No había CSP, HSTS, X-Frame-Options, etc.

**Corrección:** `next.config.ts` aplica a todas las respuestas:
`Content-Security-Policy`, `Strict-Transport-Security`, `X-Frame-Options:
SAMEORIGIN`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`,
`Permissions-Policy`. La CSP permite los iframes legítimos (Gmail, Drive,
Turnitin, iVerificate, Canvas).

### 🟠 Medio — Login sin límite de intentos
`login()` permitía fuerza bruta ilimitada.

**Corrección:** `lib/rate-limit.ts` (ventana en memoria) limita a **8 intentos
por IP cada 5 min**. El mensaje de error sigue siendo genérico (no revela si el
email existe).

### 🟡 Bajo — Reserva pública de asesorías sin throttle ni límites
`POST /api/asesorias` es público (lo usa la landing) y aceptaba payloads sin cap.

**Corrección:** rate-limit de **5 reservas por IP cada 10 min**, recorte de
longitud de todos los campos y validación de email.

### 🟡 Bajo — Uploads sin validación de tipo/tamaño
`documentos/upload`, `crm/media`, `finanzas/comprobante` guardaban cualquier
archivo de cualquier tamaño.

**Corrección:** extensión permitida + tamaño máximo (25 MB documentos, 10 MB
imágenes/comprobantes). El nombre ya se sanitizaba.

---

## Controles que ya estaban bien

- **Sesión:** JWT firmado (jose HS256), cookie `httpOnly` + `secure` en prod +
  `sameSite=lax`. Contraseñas con `bcrypt`.
- **Seed de admin:** `POST /api/seed-admin` solo funciona con la tabla vacía.
- **Webhook WhatsApp:** valida `hub.verify_token` en el handshake.
- **Cron:** exige `CRON_SECRET` o cabecera `x-vercel-cron` en producción.
- **Descarga de informes:** un `CLIENT` solo puede bajar el informe de su propio
  email; el resto es staff.
- **SQL:** todas las queries usan parámetros (`$1`), sin interpolación.

## Pendiente / recomendado a futuro

- Mover el rate-limit a Redis/Upstash si se escala a varias instancias.
- Verificar firma `X-Hub-Signature-256` en el webhook de WhatsApp (además del
  verify token) cuando se active la API real de Meta.
- Rotar `SESSION_SECRET` y credenciales antes del deploy productivo.
- Servir `uploads/` y comprobantes detrás de auth si contienen datos sensibles
  (hoy los comprobantes son públicos por diseño para el preview embebido).

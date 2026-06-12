import 'server-only';

// Rate limiter en memoria (ventana deslizante simple). Suficiente para una
// sola instancia; en multi-instancia migrar a Redis/Upstash.
type Registro = { conteo: number; reinicia: number };
const buckets = new Map<string, Registro>();

// Limpieza perezosa para no crecer sin límite.
function limpiar(ahora: number) {
  if (buckets.size < 5000) return;
  for (const [k, v] of buckets) if (v.reinicia < ahora) buckets.delete(k);
}

/**
 * Devuelve { ok, restantes, retryAfter } para una clave dada.
 * @param clave  identificador (ej. `login:<ip>`)
 * @param max    intentos permitidos por ventana
 * @param ventanaMs  duración de la ventana en ms
 */
export function rateLimit(
  clave: string,
  max: number,
  ventanaMs: number
): { ok: boolean; restantes: number; retryAfter: number } {
  const ahora = Date.now();
  limpiar(ahora);
  const reg = buckets.get(clave);

  if (!reg || reg.reinicia < ahora) {
    buckets.set(clave, { conteo: 1, reinicia: ahora + ventanaMs });
    return { ok: true, restantes: max - 1, retryAfter: 0 };
  }

  if (reg.conteo >= max) {
    return { ok: false, restantes: 0, retryAfter: Math.ceil((reg.reinicia - ahora) / 1000) };
  }

  reg.conteo += 1;
  return { ok: true, restantes: max - reg.conteo, retryAfter: 0 };
}

// IP del cliente a partir de las cabeceras de proxy (Render/Vercel) o fallback.
export function clienteIP(headers: Headers): string {
  const fwd = headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return headers.get('x-real-ip') ?? 'desconocida';
}

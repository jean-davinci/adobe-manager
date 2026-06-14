import 'server-only';
import { esMock } from './mock';

// ─── Configuración ─────────────────────────────────────────────────────────
const API_KEY = process.env.ANTHROPIC_API_KEY;
const MODEL = process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-6';
const API_URL = 'https://api.anthropic.com/v1/messages';
const MAX_TOKENS = 1024;

function isMock(): boolean {
  return esMock('MOCK_AGENTE', !!API_KEY);
}

export function configurado(): boolean {
  return !!API_KEY;
}

export function modelo(): string {
  return MODEL;
}

export const SYSTEM_PROMPT = `\
Eres Davinci, el asistente operativo interno de Davinci Labs,
una empresa peruana de servicios académicos y tecnológicos
(Adobe Creative Cloud, Turnitin, asesorías de tesis).

Tu rol es ayudar al equipo operativo a:
- Gestionar conversaciones con clientes de forma eficiente.
- Analizar pagos (Yape) y comprobantes.
- Generar reportes diarios de rendimiento.
- Detectar oportunidades de mejora operativa.

Reglas:
- Siempre basas tus respuestas en los datos reales que el operador te comparte.
- Eres conciso, profesional y orientado a la acción. Sin frases vacías.
- Cuando detectas un problema, propones una solución inmediata.
- Si te piden un borrador para el cliente, escribe en español peruano,
  cálido pero profesional, con emojis sutiles (uno por mensaje).
- Si no tienes la información, dilo claramente en una línea: "Necesito X
  para responder con precisión".
- Nunca inventas montos, fechas ni nombres.`;

// ─── Tipos ─────────────────────────────────────────────────────────────────
export type Mensaje = {
  role: 'user' | 'assistant';
  content: string;
};

export type RespuestaAgente = {
  texto: string;
  mock: boolean;
};

// ─── Llamada base a la API de Claude ───────────────────────────────────────
async function llamarClaude(
  mensajes: Mensaje[],
  imagen?: { mimeType: string; base64: string },
  system: string = SYSTEM_PROMPT
): Promise<string> {
  // Si hay imagen, la adjuntamos al último mensaje del usuario.
  const ultimo = mensajes[mensajes.length - 1];
  const messages = imagen && ultimo?.role === 'user'
    ? [
        ...mensajes.slice(0, -1),
        {
          role: 'user' as const,
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: imagen.mimeType, data: imagen.base64 },
            },
            { type: 'text', text: ultimo.content },
          ],
        },
      ]
    : mensajes;

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'x-api-key': API_KEY!,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({ model: MODEL, max_tokens: MAX_TOKENS, system, messages }),
  });

  if (!res.ok) {
    const detalle = await res.text().catch(() => '');
    throw new Error(`Claude API ${res.status}: ${detalle.slice(0, 200)}`);
  }

  const data = await res.json();
  // Respuesta puede ser array de bloques content; tomamos los de tipo text.
  const bloques = Array.isArray(data?.content) ? data.content : [];
  return bloques
    .filter((b: any) => b?.type === 'text')
    .map((b: any) => b.text)
    .join('\n')
    .trim();
}

// ─── Fachada pública ───────────────────────────────────────────────────────
export async function consultarDavinci(
  mensajes: Mensaje[],
  imagen?: { mimeType: string; base64: string },
  systemExtra?: string
): Promise<RespuestaAgente> {
  if (isMock()) {
    return { texto: mockRespuesta(mensajes, imagen), mock: true };
  }
  const system = systemExtra ? `${SYSTEM_PROMPT}\n\n${systemExtra}` : SYSTEM_PROMPT;
  const texto = await llamarClaude(mensajes, imagen, system);
  return { texto, mock: false };
}

// Respuesta simulada para desarrollo sin API key.
function mockRespuesta(mensajes: Mensaje[], imagen?: unknown): string {
  const ultimo = mensajes[mensajes.length - 1]?.content?.toLowerCase() ?? '';

  if (imagen) {
    return [
      '[modo MOCK — sin ANTHROPIC_API_KEY]',
      '',
      'Detecté lo que parece un comprobante. Mi mejor lectura simulada:',
      '- Monto: S/. 150.00',
      '- Pagador: Cliente Demo',
      '- Fecha: ' + new Date().toLocaleDateString('es-PE'),
      '',
      'Configura ANTHROPIC_API_KEY para que esto venga del modelo real.',
    ].join('\n');
  }

  if (/yape|comprobante|pago/.test(ultimo)) {
    return 'En modo mock: te sugiero pedirle al cliente la captura del Yape para registrar el pago manualmente. Define ANTHROPIC_API_KEY para usar visión real.';
  }
  if (/reporte|hoy|día/.test(ultimo)) {
    return [
      '📊 Resumen rápido (modo mock):',
      '- 0 conversaciones activas',
      '- 0 mensajes sin responder',
      '- 0 pagos detectados',
      'Define ANTHROPIC_API_KEY para tener un reporte real con análisis.',
    ].join('\n');
  }
  if (/sugiere|borrador|responder|mensaje/.test(ultimo)) {
    return [
      'Borrador sugerido (modo mock):',
      '',
      '"¡Hola! 👋 Gracias por escribirnos a Davinci Labs. En un momento te confirmamos los detalles de tu servicio."',
    ].join('\n');
  }
  return [
    'Hola, soy Davinci en modo simulado.',
    '',
    'Cuando configures ANTHROPIC_API_KEY en .env.local podré:',
    '- Analizar conversaciones reales con el cliente',
    '- Sugerir respuestas adaptadas al contexto',
    '- Generar el reporte diario',
    '- Leer comprobantes Yape por imagen',
  ].join('\n');
}

// ─── Compresión simple de imagen (downscale base64 lo dejamos al cliente) ──
// Aquí solo validamos tamaño máximo para no inflar la llamada a Claude.
export const MAX_IMAGEN_BYTES = 1 * 1024 * 1024; // 1 MB efectivos en base64

export function validarImagenBase64(base64: string, mimeType: string): { ok: true } | { ok: false; error: string } {
  if (!/^image\/(png|jpe?g|webp|gif)$/.test(mimeType)) {
    return { ok: false, error: 'Tipo de imagen no soportado (usa PNG, JPG o WebP)' };
  }
  // base64 ocupa ~4/3 del binario original.
  const bytesAprox = (base64.length * 3) / 4;
  if (bytesAprox > MAX_IMAGEN_BYTES) {
    return { ok: false, error: `Imagen muy grande (máx ${MAX_IMAGEN_BYTES / 1024} KB efectivos)` };
  }
  return { ok: true };
}

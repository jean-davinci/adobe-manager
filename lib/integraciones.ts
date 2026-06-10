import 'server-only';
import { esMock } from './mock';

const has = (...keys: string[]) => keys.some((k) => Boolean(process.env[k]));
const forzadoMock = process.env.MOCK_MODE === 'true';

export type EstadoIntegracion = {
  clave: string;
  nombre: string;
  activo: boolean;          // true = usando API real
  faltan: string[];         // variables de entorno que faltan para activar
  descripcion: string;
};

// Calcula el estado de cada integración a partir de las credenciales presentes.
export function estadoIntegraciones(): EstadoIntegracion[] {
  const google = has('GOOGLE_CLIENT_ID', 'GMAIL_CLIENT_ID') &&
    has('GOOGLE_CLIENT_SECRET', 'GMAIL_CLIENT_SECRET') &&
    has('GMAIL_REFRESH_TOKEN', 'GOOGLE_REFRESH_TOKEN');

  const faltanGoogle: string[] = [];
  if (!has('GOOGLE_CLIENT_ID', 'GMAIL_CLIENT_ID')) faltanGoogle.push('GOOGLE_CLIENT_ID');
  if (!has('GOOGLE_CLIENT_SECRET', 'GMAIL_CLIENT_SECRET')) faltanGoogle.push('GOOGLE_CLIENT_SECRET');
  if (!has('GMAIL_REFRESH_TOKEN', 'GOOGLE_REFRESH_TOKEN')) faltanGoogle.push('GMAIL_REFRESH_TOKEN');

  const driveCreds = google && has('GOOGLE_DRIVE_FOLDER_ID');
  const waCreds = has('WHATSAPP_TOKEN') && has('WHATSAPP_PHONE_NUMBER_ID');
  const scrapCreds = has('IVERIFICATE_PASSWORD') && has('CANVAS_PASSWORD');

  return [
    {
      clave: 'gmail', nombre: 'Gmail API',
      activo: !esMock('MOCK_GMAIL', google),
      faltan: faltanGoogle,
      descripcion: 'Leer códigos de acceso de Adobe e informes de IA.',
    },
    {
      clave: 'drive', nombre: 'Google Drive',
      activo: !esMock('MOCK_DRIVE', driveCreds),
      faltan: [...faltanGoogle, ...(has('GOOGLE_DRIVE_FOLDER_ID') ? [] : ['GOOGLE_DRIVE_FOLDER_ID'])],
      descripcion: 'Sincronizar documentos e informes; links públicos de preview.',
    },
    {
      clave: 'whatsapp', nombre: 'WhatsApp Business (Meta)',
      activo: !esMock('MOCK_WHATSAPP', waCreds),
      faltan: [
        ...(has('WHATSAPP_TOKEN') ? [] : ['WHATSAPP_TOKEN']),
        ...(has('WHATSAPP_PHONE_NUMBER_ID') ? [] : ['WHATSAPP_PHONE_NUMBER_ID']),
        ...(has('WHATSAPP_VERIFY_TOKEN') ? [] : ['WHATSAPP_VERIFY_TOKEN']),
      ],
      descripcion: 'Enviar y recibir mensajes del CRM en tiempo real.',
    },
    {
      clave: 'email', nombre: 'Email (Resend)',
      activo: !esMock('MOCK_EMAIL', has('RESEND_API_KEY')),
      faltan: has('RESEND_API_KEY') ? [] : ['RESEND_API_KEY'],
      descripcion: 'Notificaciones de renovación y vencimiento por correo.',
    },
    {
      clave: 'scrapers', nombre: 'Scrapers (iVerificate / Canvas)',
      activo: !esMock('MOCK_SCRAPERS', scrapCreds),
      faltan: [
        ...(has('IVERIFICATE_PASSWORD') ? [] : ['IVERIFICATE_EMAIL/PASSWORD']),
        ...(has('CANVAS_PASSWORD') ? [] : ['CANVAS_EMAIL/PASSWORD']),
      ],
      descripcion: 'Traer informes de IA y similitud automáticamente (Playwright).',
    },
  ];
}

export function modoGlobalMock(): boolean {
  return forzadoMock;
}

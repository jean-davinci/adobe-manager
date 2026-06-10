import 'server-only';
import {
  getContactoPorEmail, getContactoPorTelefono, agregarEtiqueta, guardarMensaje,
} from './crm';
import { enviarMensaje } from './whatsapp';

// Horario de atención configurable (zona America/Lima por defecto).
const HORA_INICIO = Number(process.env.HORARIO_INICIO ?? 9);
const HORA_FIN = Number(process.env.HORARIO_FIN ?? 18);
const MSG_FUERA_HORARIO =
  process.env.MSG_FUERA_HORARIO ??
  '¡Gracias por escribir a Davinci Labs! 🌙 Estamos fuera de horario (L-V ' +
    `${HORA_INICIO}:00–${HORA_FIN}:00). Te responderemos apenas abramos. 🙌`;

export function estaFueraDeHorario(d = new Date()): boolean {
  // Hora local de Lima (UTC-5, sin DST)
  const horaLima = (d.getUTCHours() - 5 + 24) % 24;
  const dia = d.getUTCDay(); // 0 dom, 6 sáb
  const finDeSemana = dia === 0 || dia === 6;
  return finDeSemana || horaLima < HORA_INICIO || horaLima >= HORA_FIN;
}

// 3c — Auto-respuesta fuera de horario. Registra y "envía" (mock) un mensaje AUTO.
export async function autoRespuestaFueraHorario(contactoId: string, telefono: string): Promise<boolean> {
  if (!estaFueraDeHorario()) return false;
  await enviarMensaje({ telefono, texto: MSG_FUERA_HORARIO, tipo: 'TEMPLATE' });
  await guardarMensaje({ contacto_id: contactoId, origen: 'AUTO', tipo: 'TEMPLATE', contenido: MSG_FUERA_HORARIO, leido: true });
  return true;
}

// 3c — Cambio automático de etiqueta al completar un pedido (documento COMPLETADO).
export async function etiquetarPedidoCompletado(email?: string | null): Promise<void> {
  if (!email) return;
  const c = await getContactoPorEmail(email);
  if (c) await agregarEtiqueta(c.id, 'Completado');
}

// 3c — Envío automático del código de acceso cuando se activa un afiliado.
export async function enviarCodigoAcceso(cliente: {
  telefono?: string | null;
  email_cliente?: string | null;
  nombre_cliente: string;
  email_adobe?: string | null;
  ['contraseña_adobe_encriptada']?: string | null;
}): Promise<boolean> {
  let contacto = null;
  if (cliente.telefono) contacto = await getContactoPorTelefono(cliente.telefono);
  if (!contacto && cliente.email_cliente) contacto = await getContactoPorEmail(cliente.email_cliente);
  if (!contacto || !cliente.email_adobe) return false;

  const texto =
    `¡Hola ${cliente.nombre_cliente}! 🎨 Tu acceso Adobe Creative Cloud ya está activo.\n` +
    `Correo: ${cliente.email_adobe}\n` +
    `Contraseña: ${cliente['contraseña_adobe_encriptada'] ?? '(consúltala en tu portal)'}\n` +
    `Ingresa en account.adobe.com o revisa tu portal en /mi-acceso. 🙌`;

  await enviarMensaje({ telefono: contacto.telefono, texto, tipo: 'TEMPLATE' });
  await agregarEtiqueta(contacto.id, 'Afiliado');
  await guardarMensaje({ contacto_id: contacto.id, origen: 'AUTO', tipo: 'TEMPLATE', contenido: texto, leido: true });
  return true;
}

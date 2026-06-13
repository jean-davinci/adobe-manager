import 'server-only';
import { query, queryOne } from './db';
import { googleConfigurado, getCalendarClient } from './google';
import { esMock } from './mock';
import { enviarMensaje } from './whatsapp';

// ─── Configuración (desde .env, con defaults del brief) ────────────────────
const DIAS = (process.env.ASESORIA_DIAS ?? '1,2,3,4,5').split(',').map(Number); // 1=Lun … 7=Dom
const HORA_INICIO = process.env.ASESORIA_HORA_INICIO ?? '09:00';
const HORA_FIN = process.env.ASESORIA_HORA_FIN ?? '20:00';
const DURACION = Number(process.env.ASESORIA_DURACION_MIN ?? 60);
const PRECIO = Number(process.env.ASESORIA_PRECIO_PEN ?? 50);
const TZ = 'America/Lima';

function calendarEsMock(): boolean {
  return esMock('MOCK_CALENDAR', googleConfigurado() && !!process.env.GOOGLE_CALENDAR_ID);
}

export type Asesoria = {
  id: string;
  nombre: string;
  email: string | null;
  telefono: string | null;
  fecha: string;
  hora_inicio: string;
  duracion_min: number;
  estado: 'RESERVADA' | 'CANCELADA' | 'COMPLETADA';
  notas: string | null;
  precio: number | null;
  calendar_event_id: string | null;
  recordatorio_enviado: boolean;
  created_at: string;
};

export const configAsesorias = () => ({
  dias: DIAS, horaInicio: HORA_INICIO, horaFin: HORA_FIN, duracionMin: DURACION, precioPen: PRECIO,
});

const aMin = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};
const aHHMM = (min: number) =>
  `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;

// Día ISO (1=Lun…7=Dom) de una fecha YYYY-MM-DD.
function diaISO(fecha: string): number {
  const d = new Date(fecha + 'T12:00:00');
  return d.getDay() === 0 ? 7 : d.getDay();
}

// ─── Disponibilidad ─────────────────────────────────────────────────────────
export async function slotsDisponibles(fecha: string): Promise<{ hora: string; disponible: boolean }[]> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) throw new Error('Fecha inválida');
  if (!DIAS.includes(diaISO(fecha))) return [];

  const ocupadas = await query<{ hora_inicio: string }>(
    `select hora_inicio::text from asesorias where fecha = $1 and estado = 'RESERVADA'`,
    [fecha]
  );
  const ocupadasSet = new Set(ocupadas.map((o) => o.hora_inicio.slice(0, 5)));

  // Hora actual en Lima para no ofrecer slots pasados de hoy.
  const hoy = new Date().toLocaleDateString('en-CA', { timeZone: TZ });
  const [hAhora, mAhora] = new Date()
    .toLocaleTimeString('en-GB', { timeZone: TZ, hour12: false, hour: '2-digit', minute: '2-digit' })
    .split(':')
    .map(Number);
  const minAhora = hAhora * 60 + mAhora;

  const slots: { hora: string; disponible: boolean }[] = [];
  for (let m = aMin(HORA_INICIO); m + DURACION <= aMin(HORA_FIN); m += DURACION) {
    const hora = aHHMM(m);
    const pasado = fecha === hoy && m <= minAhora;
    slots.push({ hora, disponible: !pasado && !ocupadasSet.has(hora) });
  }
  return slots;
}

// ─── Reserva ────────────────────────────────────────────────────────────────
export async function reservarAsesoria(input: {
  nombre: string;
  email?: string;
  telefono?: string;
  fecha: string;
  hora: string;
  notas?: string;
}): Promise<Asesoria> {
  const { nombre, fecha, hora } = input;
  if (!nombre?.trim()) throw new Error('El nombre es requerido');

  const slots = await slotsDisponibles(fecha);
  const slot = slots.find((s) => s.hora === hora);
  if (!slot) throw new Error('Ese día no hay atención o el horario no existe');
  if (!slot.disponible) throw new Error('Ese horario ya fue reservado');

  // Evento en Google Calendar (mock-able)
  let eventId: string | null = null;
  if (calendarEsMock()) {
    eventId = 'mock_evt_' + Date.now();
    console.log(`[MOCK Calendar] Asesoría ${fecha} ${hora} — ${nombre}`);
  } else {
    try {
      const cal = getCalendarClient();
      const inicio = `${fecha}T${hora}:00`;
      const finMin = aMin(hora) + DURACION;
      const fin = `${fecha}T${aHHMM(finMin)}:00`;
      const evento = await cal.events.insert({
        calendarId: process.env.GOOGLE_CALENDAR_ID!,
        sendUpdates: input.email ? 'all' : 'none',
        requestBody: {
          summary: `Asesoría académica — ${nombre}`,
          description: `Reservada desde davincilabs. ${input.notas ?? ''}\nTel: ${input.telefono ?? '—'}`,
          start: { dateTime: inicio, timeZone: TZ },
          end: { dateTime: fin, timeZone: TZ },
          attendees: input.email ? [{ email: input.email }] : undefined,
        },
      });
      eventId = evento.data.id ?? null;
    } catch (e) {
      console.error('[asesorias] Calendar falló (se continúa):', e);
    }
  }

  const asesoria = await queryOne<Asesoria>(
    `insert into asesorias (nombre, email, telefono, fecha, hora_inicio, duracion_min, precio, notas, calendar_event_id)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     returning *`,
    [nombre.trim(), input.email ?? null, input.telefono ?? null, fecha, hora, DURACION, PRECIO, input.notas ?? null, eventId]
  );
  if (!asesoria) throw new Error('No se pudo registrar la reserva');

  // Confirmación por WhatsApp (best-effort)
  if (input.telefono) {
    enviarMensaje({
      telefono: input.telefono,
      texto:
        `¡Hola ${nombre}! 👋 Tu asesoría con Davinci Labs quedó reservada para el ` +
        `${new Date(fecha + 'T12:00:00').toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' })} ` +
        `a las ${hora}. Te enviaremos un recordatorio 1 hora antes. 📚`,
    }).catch((e) => console.error('[asesorias] WhatsApp confirmación falló:', e));
  }

  return asesoria;
}

// ─── Cancelación ────────────────────────────────────────────────────────────
export async function cancelarAsesoria(id: string): Promise<Asesoria | null> {
  const asesoria = await queryOne<Asesoria>(
    `update asesorias set estado = 'CANCELADA' where id = $1 returning *`,
    [id]
  );
  if (asesoria?.calendar_event_id && !calendarEsMock()) {
    try {
      await getCalendarClient().events.delete({
        calendarId: process.env.GOOGLE_CALENDAR_ID!,
        eventId: asesoria.calendar_event_id,
        sendUpdates: 'all',
      });
    } catch (e) {
      console.error('[asesorias] No se pudo borrar el evento de Calendar:', e);
    }
  }
  return asesoria;
}

export function listarAsesorias(opts: { desde?: string } = {}): Promise<Asesoria[]> {
  if (opts.desde) {
    return query<Asesoria>(
      `select * from asesorias where fecha >= $1 order by fecha, hora_inicio`,
      [opts.desde]
    );
  }
  return query<Asesoria>(`select * from asesorias order by fecha desc, hora_inicio limit 200`);
}

export async function marcarCompletada(id: string): Promise<void> {
  await query(`update asesorias set estado = 'COMPLETADA' where id = $1`, [id]);
}

// ─── Recordatorios (los dispara el cron) ────────────────────────────────────
// WhatsApp a las reservas que empiezan dentro de la próxima hora.
export async function enviarRecordatoriosPendientes(): Promise<number> {
  const hoy = new Date().toLocaleDateString('en-CA', { timeZone: TZ });
  const [hAhora, mAhora] = new Date()
    .toLocaleTimeString('en-GB', { timeZone: TZ, hour12: false, hour: '2-digit', minute: '2-digit' })
    .split(':')
    .map(Number);
  const minAhora = hAhora * 60 + mAhora;

  const proximas = await query<Asesoria>(
    `select * from asesorias
     where fecha = $1 and estado = 'RESERVADA'
       and recordatorio_enviado = false and telefono is not null`,
    [hoy]
  );

  let enviados = 0;
  for (const a of proximas) {
    const minInicio = aMin(a.hora_inicio.slice(0, 5));
    if (minInicio - minAhora <= 60 && minInicio - minAhora > 0) {
      try {
        await enviarMensaje({
          telefono: a.telefono!,
          texto: `⏰ Recuerda tu asesoría con Davinci Labs hoy a las ${a.hora_inicio.slice(0, 5)}. ¡Te esperamos!`,
        });
        await query(`update asesorias set recordatorio_enviado = true where id = $1`, [a.id]);
        enviados++;
      } catch (e) {
        console.error('[asesorias] Recordatorio falló:', e);
      }
    }
  }
  return enviados;
}

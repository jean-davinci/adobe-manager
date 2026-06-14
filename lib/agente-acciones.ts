import 'server-only';
import { query, queryOne } from './db';
import { consultarDavinci, type Mensaje } from './agente-davinci';
import { listarMensajes, listarContactos, type ContactoInbox, type Mensaje as MensajeChat } from './crm';
import { crearPagoYape } from './yape';
import { listarTransacciones } from './finanzas';

// Pequeña utilidad para parsear bloques JSON dentro del texto de la respuesta.
function extraerJSON<T = any>(texto: string): T | null {
  const m = texto.match(/```json\s*([\s\S]+?)\s*```/) ?? texto.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try { return JSON.parse(m[1] ?? m[0]); } catch { return null; }
}

// ─── 1. Analizar una conversación ────────────────────────────────────────
export type AnalisisConversacion = {
  resumen: string;
  sentimiento: 'positivo' | 'neutro' | 'urgente';
  siguienteAccion: string;
  borrador: string;
  mock: boolean;
};

export async function analizarConversacion(contactoId: string): Promise<AnalisisConversacion> {
  const mensajes = await listarMensajes(contactoId);
  const transcripcion = mensajes
    .slice(-30)
    .map((m: MensajeChat) => `[${m.origen}] ${m.contenido}`)
    .join('\n');

  const prompt = `\
Analiza esta conversación con un cliente de Davinci Labs y responde EXCLUSIVAMENTE
con un bloque JSON con las siguientes claves:

{
  "resumen": "Una frase corta del estado de la conversación",
  "sentimiento": "positivo" | "neutro" | "urgente",
  "siguienteAccion": "La acción concreta que el operador debe tomar ahora",
  "borrador": "Un mensaje listo para enviar al cliente, en español peruano, cálido y profesional, máximo 4 líneas"
}

Conversación (orden cronológico):
${transcripcion || '[sin mensajes registrados]'}`;

  const { texto, mock } = await consultarDavinci([{ role: 'user', content: prompt }]);
  const parsed = extraerJSON<Omit<AnalisisConversacion, 'mock'>>(texto);
  if (parsed) return { ...parsed, mock };

  // Fallback si el modelo no devolvió JSON parseable.
  return {
    resumen: texto.split('\n')[0] ?? 'Sin análisis',
    sentimiento: 'neutro',
    siguienteAccion: 'Revisar la conversación manualmente',
    borrador: texto,
    mock,
  };
}

// ─── 2. Sugerir el siguiente mensaje ──────────────────────────────────────
export async function sugerirRespuesta(contactoId: string, instruccion?: string): Promise<{ borrador: string; mock: boolean }> {
  const mensajes = await listarMensajes(contactoId);
  const transcripcion = mensajes
    .slice(-20)
    .map((m: MensajeChat) => `[${m.origen}] ${m.contenido}`)
    .join('\n');

  const prompt = `\
Redacta el siguiente mensaje que el operador de Davinci Labs debería enviar
a este cliente. Toma en cuenta el contexto y el tono de la conversación.
${instruccion ? `\nInstrucción adicional del operador: ${instruccion}` : ''}

Reglas:
- Español peruano, cálido pero profesional.
- Máximo 4 líneas.
- Un emoji sutil máximo.
- Si falta información, escribe "[Necesito: ...]" entre corchetes al final.
- Responde solo con el texto del mensaje, sin explicaciones.

Conversación reciente:
${transcripcion || '[sin mensajes registrados, escribe un saludo de apertura]'}`;

  const { texto, mock } = await consultarDavinci([{ role: 'user', content: prompt }]);
  return { borrador: texto.trim(), mock };
}

// ─── 3. Detectar un comprobante Yape por imagen ───────────────────────────
export type YapeDetectado = {
  monto: number | null;
  pagador: string | null;
  fecha: string | null;
  confianza: 'alta' | 'media' | 'baja';
  mock: boolean;
};

export async function detectarYape(imagen: { mimeType: string; base64: string }): Promise<YapeDetectado> {
  const prompt = `\
Esta imagen es (o debería ser) un comprobante de pago de Yape o Plin de Perú.
Extrae los datos y responde EXCLUSIVAMENTE con un bloque JSON:

{
  "monto": número decimal (sin moneda), p. ej. 150.00, o null si no se ve,
  "pagador": "nombre completo de quien envió" o null,
  "fecha": "YYYY-MM-DD" o null,
  "confianza": "alta" | "media" | "baja"
}

Si la imagen no parece un comprobante, responde con confianza "baja" y monto null.`;

  const { texto, mock } = await consultarDavinci([{ role: 'user', content: prompt }], imagen);
  const parsed = extraerJSON<Omit<YapeDetectado, 'mock'>>(texto);
  if (parsed && typeof parsed.monto !== 'undefined') {
    return { ...parsed, monto: parsed.monto != null ? Number(parsed.monto) : null, mock };
  }
  return { monto: null, pagador: null, fecha: null, confianza: 'baja', mock };
}

// Registra un Yape detectado en `pagos_yape` y opcionalmente en finanzas.
export async function registrarYapeDetectado(input: {
  contactoId?: string | null;
  monto: number;
  pagador?: string | null;
  fecha?: string;
  imagenUrl?: string | null;
}) {
  return crearPagoYape({
    contacto_id: input.contactoId ?? null,
    monto: input.monto,
    pagador: input.pagador,
    fecha_pago: input.fecha,
    imagen_url: input.imagenUrl,
    registrarEnFinanzas: true,
  });
}

// ─── 4. Reporte diario ────────────────────────────────────────────────────
export type ReporteDiario = {
  fecha: string;
  contenido: string;
  metricas: {
    contactos_total: number;
    sin_respuesta: number;
    pagos_yape_dia: number;
    ingresos_dia: number;
  };
  mock: boolean;
};

export async function generarReporteDiario(fechaISO?: string): Promise<ReporteDiario> {
  const hoy = fechaISO ?? new Date().toLocaleDateString('en-CA', { timeZone: 'America/Lima' });
  const contactos = await listarContactos();
  const sinRespuesta = contactosSinRespuesta(contactos, 2 * 60); // 2 horas en minutos
  const txs = await listarTransacciones({ from: hoy, to: hoy });
  const ingresosDia = txs.filter((t) => t.tipo === 'INGRESO').reduce((a, t) => a + Number(t.monto), 0);
  const yapesHoy = await queryOne<{ total: string | null; cantidad: string }>(
    `select coalesce(sum(monto), 0)::text as total, count(*)::text as cantidad
     from pagos_yape where fecha_pago = $1`,
    [hoy]
  );

  const metricas = {
    contactos_total: contactos.length,
    sin_respuesta: sinRespuesta.length,
    pagos_yape_dia: Number(yapesHoy?.cantidad ?? 0),
    ingresos_dia: ingresosDia,
  };

  const datosPrompt = JSON.stringify(
    {
      fecha: hoy,
      contactos_total: metricas.contactos_total,
      sin_respuesta_count: metricas.sin_respuesta,
      sin_respuesta_clientes: sinRespuesta.slice(0, 5).map((c) => c.nombre),
      pagos_yape_dia: metricas.pagos_yape_dia,
      pagos_yape_monto: Number(yapesHoy?.total ?? 0),
      ingresos_dia: metricas.ingresos_dia,
      ingresos_dia_count: txs.filter((t) => t.tipo === 'INGRESO').length,
    },
    null,
    2
  );

  const prompt = `\
Genera el reporte operativo diario para Davinci Labs.
Sé conciso, usa bullets y resalta lo accionable. Empieza con un saludo corto.
Estructura: 1) Estado general, 2) Lo que requiere atención HOY, 3) Próxima acción sugerida.
Datos reales:
\`\`\`json
${datosPrompt}
\`\`\``;

  const { texto, mock } = await consultarDavinci([{ role: 'user', content: prompt }]);

  // Persistir (upsert por fecha)
  await query(
    `insert into reportes_agente (fecha, contenido, metricas)
     values ($1, $2, $3)
     on conflict (fecha) do update set contenido = excluded.contenido, metricas = excluded.metricas, generado_en = now()`,
    [hoy, texto, JSON.stringify(metricas)]
  );

  return { fecha: hoy, contenido: texto, metricas, mock };
}

export function reporteGuardado(fechaISO: string): Promise<{ fecha: string; contenido: string; metricas: any } | null> {
  return queryOne(`select fecha, contenido, metricas from reportes_agente where fecha = $1`, [fechaISO]);
}

// ─── 5. Detección proactiva (alertas) ─────────────────────────────────────
function contactosSinRespuesta(contactos: ContactoInbox[], minutos: number): ContactoInbox[] {
  const ahora = Date.now();
  return contactos.filter((c) => {
    if (!c.ultimo_at) return false;
    const dt = new Date(c.ultimo_at).getTime();
    return (ahora - dt) / 60000 >= minutos && (c.no_leidos ?? 0) > 0;
  });
}

export async function generarAvisosProactivos(): Promise<number> {
  const contactos = await listarContactos();
  const sinResp = contactosSinRespuesta(contactos, 2 * 60);
  let creados = 0;
  for (const c of sinResp) {
    // Solo creamos un aviso por contacto si no hay uno activo.
    const ya = await queryOne(
      `select id from agente_avisos where contacto_id = $1 and tipo = 'sin_respuesta' and visto = false`,
      [c.id]
    );
    if (ya) continue;
    await query(
      `insert into agente_avisos (tipo, severidad, titulo, detalle, contacto_id)
       values ('sin_respuesta', 'warn', $1, $2, $3)`,
      [
        `Sin respuesta: ${c.nombre}`,
        `Lleva más de 2 horas esperando una respuesta. Último mensaje: "${(c.ultimo_mensaje ?? '').slice(0, 80)}"`,
        c.id,
      ]
    );
    creados++;
  }

  // Cliente con pago detectado pero sin marca de "confirmación enviada":
  // por ahora simple — Yapes registrados hoy sin contacto asociado.
  const huerfanos = await query<{ id: string; monto: string; pagador: string | null }>(
    `select id, monto::text, pagador from pagos_yape
     where contacto_id is null and fecha_pago = current_date and created_at > now() - interval '2 hours'`
  );
  for (const h of huerfanos) {
    const ya = await queryOne(`select id from agente_avisos where metadata->>'pago_id' = $1 and visto = false`, [h.id]);
    if (ya) continue;
    await query(
      `insert into agente_avisos (tipo, severidad, titulo, detalle, metadata)
       values ('pago_pendiente', 'info', $1, $2, $3)`,
      [
        `Pago Yape sin vincular: S/. ${Number(h.monto).toFixed(2)}`,
        `Registrado de ${h.pagador ?? 'pagador desconocido'}. Vinculalo al contacto correspondiente.`,
        JSON.stringify({ pago_id: h.id }),
      ]
    );
    creados++;
  }

  // Clientes inactivos 30+ días sin nueva actividad.
  const inactivos = contactos.filter((c) => {
    if (!c.ultimo_at) return false;
    const diasSinActividad = (Date.now() - new Date(c.ultimo_at).getTime()) / (1000 * 60 * 60 * 24);
    return diasSinActividad >= 30;
  });
  if (inactivos.length > 0) {
    const yaInactivos = await queryOne(
      `select id from agente_avisos where tipo = 'inactivos' and visto = false and created_at > now() - interval '24 hours'`
    );
    if (!yaInactivos) {
      await query(
        `insert into agente_avisos (tipo, severidad, titulo, detalle, metadata)
         values ('inactivos', 'info', $1, $2, $3)`,
        [
          `${inactivos.length} cliente${inactivos.length > 1 ? 's' : ''} inactivo${inactivos.length > 1 ? 's' : ''} hace 30+ días`,
          `Sin actividad: ${inactivos.slice(0, 4).map((c) => c.nombre).join(', ')}${inactivos.length > 4 ? ` y ${inactivos.length - 4} más` : ''}. Considera reactivarlos.`,
          JSON.stringify({ ids: inactivos.slice(0, 10).map((c) => c.id) }),
        ]
      );
      creados++;
    }
  }

  // Pico de mensajes: si en la última hora hay 3× más mensajes que el promedio horario de los últimos 7 días.
  const picoData = await queryOne<{ ultima_hora: string; promedio_7d: string }>(
    `select
       (select count(*) from mensajes where timestamp > now() - interval '1 hour')::text as ultima_hora,
       (select round(count(*) / 168.0, 2) from mensajes where timestamp > now() - interval '7 days')::text as promedio_7d`
  );
  if (picoData) {
    const ultima = Number(picoData.ultima_hora);
    const promedio = Number(picoData.promedio_7d);
    if (ultima >= 5 && promedio > 0 && ultima >= promedio * 3) {
      const yaPico = await queryOne(
        `select id from agente_avisos where tipo = 'pico_mensajes' and visto = false and created_at > now() - interval '3 hours'`
      );
      if (!yaPico) {
        await query(
          `insert into agente_avisos (tipo, severidad, titulo, detalle, metadata)
           values ('pico_mensajes', 'warn', $1, $2, $3)`,
          [
            `Pico de mensajes detectado`,
            `Última hora: ${ultima} mensajes (${Math.round(ultima / Math.max(promedio, 0.1))}× sobre el promedio de ${promedio.toFixed(1)}/h). Refuerza atención al equipo.`,
            JSON.stringify({ ultima_hora: ultima, promedio_7d: promedio }),
          ]
        );
        creados++;
      }
    }
  }

  return creados;
}

export function listarAvisos(soloPendientes = true): Promise<Array<{
  id: string; tipo: string; severidad: string; titulo: string; detalle: string | null;
  contacto_id: string | null; metadata: any; visto: boolean; created_at: string;
}>> {
  const cond = soloPendientes ? 'where visto = false' : '';
  return query(`select * from agente_avisos ${cond} order by created_at desc limit 50`);
}

export async function marcarAvisoVisto(id: string): Promise<void> {
  await query(`update agente_avisos set visto = true where id = $1`, [id]);
}

// ─── 6. Chat libre con Davinci ────────────────────────────────────────────
export type ChatHistorial = Array<{ rol: 'user' | 'assistant'; contenido: string }>;

export async function chatDavinci(
  usuarioId: string,
  prompt: string,
  imagen?: { mimeType: string; base64: string }
): Promise<{ texto: string; mock: boolean }> {
  // Cargar últimos 20 turnos del usuario para dar memoria.
  const historial = await query<{ rol: 'user' | 'assistant'; contenido: string }>(
    `select rol, contenido from agente_mensajes where usuario_id = $1 order by created_at desc limit 20`,
    [usuarioId]
  );
  const mensajes: Mensaje[] = historial
    .reverse()
    .map((h) => ({ role: h.rol, content: h.contenido }));
  mensajes.push({ role: 'user', content: prompt });

  const { texto, mock } = await consultarDavinci(mensajes, imagen);

  // Persistir ambos turnos
  await query(`insert into agente_mensajes (usuario_id, rol, contenido) values ($1, 'user', $2)`, [usuarioId, prompt]);
  await query(`insert into agente_mensajes (usuario_id, rol, contenido) values ($1, 'assistant', $2)`, [usuarioId, texto]);

  return { texto, mock };
}

export function historialChatDavinci(usuarioId: string, limit = 50): Promise<ChatHistorial> {
  return query<{ rol: 'user' | 'assistant'; contenido: string }>(
    `select rol, contenido from agente_mensajes where usuario_id = $1 order by created_at asc limit $2`,
    [usuarioId, limit]
  );
}

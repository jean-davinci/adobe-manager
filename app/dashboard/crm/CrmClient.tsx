'use client';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import PipelineKanban from './PipelineKanban';
import AgentePanel from './AgentePanel';

type ResumenCliente = { ingresos: number; egresos: number; total: number; ultimas: { id: string; tipo: string; monto: number; fecha: string; categoria: string }[] };
const soles = (n: number) => 'S/. ' + Number(n).toLocaleString('es-PE', { minimumFractionDigits: 2 });

type Contacto = {
  id: string; nombre: string; telefono: string; email: string | null;
  etiquetas: string[]; notas: string | null; etapa: string;
  ultimo_mensaje: string | null; ultimo_at: string | null; no_leidos: number;
};

// True si el contacto tiene mensajes no leídos Y lleva más de 2h sin respuesta.
function sinRespuesta2h(c: Contacto): boolean {
  if (!c.ultimo_at || c.no_leidos === 0) return false;
  return (Date.now() - new Date(c.ultimo_at).getTime()) > 2 * 60 * 60 * 1000;
}
type Mensaje = {
  id: string; origen: 'CLIENTE' | 'OPERADOR' | 'AUTO'; tipo: string;
  contenido: string; media_url: string | null; timestamp: string;
};
type Respuesta = { id: string; trigger: string; texto: string; media_url: string | null };

const ETIQUETAS_DISP = ['Nuevo', 'En proceso', 'Pagado', 'Turnitin', 'Afiliado', 'VIP'];
const colorTag = (t: string) => {
  const m: Record<string, string> = {
    Nuevo: 'dv-badge-brand', 'En proceso': 'dv-badge-warning',
    Pagado: 'dv-badge-success', Turnitin: 'dv-badge-accent',
    Afiliado: 'dv-badge-brand', VIP: 'dv-badge-accent',
  };
  return m[t] ?? 'dv-badge-muted';
};
const hora = (s: string) => new Date(s).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });

const iniciales = (nombre: string) =>
  nombre.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();

// Etiqueta de fecha para separadores en el chat.
function etiquetaFecha(iso: string): string {
  const d = new Date(iso);
  const hoy = new Date();
  const ayer = new Date(hoy); ayer.setDate(hoy.getDate() - 1);
  if (d.toDateString() === hoy.toDateString()) return 'Hoy';
  if (d.toDateString() === ayer.toDateString()) return 'Ayer';
  return d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' });
}

// Etapas del pipeline en orden con colores asociados.
const ETAPAS_CRM = [
  { id: 'Nuevo',      color: 'var(--accent)',    badge: 'dv-badge-accent'   },
  { id: 'Contactado', color: 'var(--brand)',     badge: 'dv-badge-brand'    },
  { id: 'En proceso', color: 'var(--warning)',   badge: 'dv-badge-warning'  },
  { id: 'Pagado',     color: 'var(--success)',   badge: 'dv-badge-success'  },
  { id: 'Completado', color: 'var(--text-muted)', badge: 'dv-badge-muted'  },
] as const;

// Color del borde izquierdo según etapa del pipeline.
const BORDE_ETAPA: Record<string, string> = Object.fromEntries(
  ETAPAS_CRM.map((e) => [e.id, e.color])
);

// URL directa de WhatsApp a partir de un teléfono.
const waLink = (tel: string) => `https://wa.me/${tel.replace(/\D/g, '')}`;

export default function CrmClient() {
  const [contactos, setContactos] = useState<Contacto[]>([]);
  const [activo, setActivo] = useState<Contacto | null>(null);
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [respuestas, setRespuestas] = useState<Respuesta[]>([]);
  const [texto, setTexto] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [vista, setVista] = useState<'inbox' | 'pipeline' | 'atajos'>('inbox');
  const [enviando, setEnviando] = useState(false);
  const [mostrarRapidas, setMostrarRapidas] = useState(false);
  const [finanzas, setFinanzas] = useState<ResumenCliente | null>(null);
  const [pendingMedia, setPendingMedia] = useState<{ url: string } | null>(null);
  const [filtroAtajos, setFiltroAtajos] = useState('');
  const [filtroEtapa, setFiltroEtapa] = useState<string | null>(null);
  const [filtroSolo, setFiltroSolo] = useState<'todos' | 'noLeidos' | 'alertas'>('todos');
  const [formRapida, setFormRapida] = useState({ trigger: '', texto: '', media_url: '' });
  const [editandoRapidaId, setEditandoRapidaId] = useState<string | null>(null);
  const [guardandoRapida, setGuardandoRapida] = useState(false);
  const [subiendoMediaRapida, setSubiendoMediaRapida] = useState(false);
  const [mostrarFormRapida, setMostrarFormRapida] = useState(false);
  const [modalNuevoContacto, setModalNuevoContacto] = useState(false);
  const [nuevoContacto, setNuevoContacto] = useState({ nombre: '', telefono: '', email: '' });
  const [creandoContacto, setCreandoContacto] = useState(false);
  const [editandoDato, setEditandoDato] = useState<'nombre' | 'telefono' | 'email' | null>(null);
  const [valorEdicion, setValorEdicion] = useState('');
  const finRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLInputElement>(null);
  const mediaRapidaRef = useRef<HTMLInputElement>(null);

  const cargarContactos = useCallback(async () => {
    const c = await fetch('/api/crm/contactos').then((x) => x.json());
    setContactos(Array.isArray(c) ? c : []);
  }, []);

  const cargarRespuestas = useCallback(async () => {
    const r = await fetch('/api/crm/respuestas-rapidas').then((x) => x.json());
    setRespuestas(Array.isArray(r) ? r : []);
  }, []);

  const subirMediaRapida = async (file: File) => {
    setSubiendoMediaRapida(true);
    try {
      const fd = new FormData(); fd.append('media', file);
      const r = await fetch('/api/crm/media', { method: 'POST', body: fd }).then((x) => x.json());
      if (r.url) setFormRapida((v) => ({ ...v, media_url: r.url }));
    } finally { setSubiendoMediaRapida(false); }
  };

  const guardarFormRapida = async () => {
    if (!formRapida.trigger.trim() || !formRapida.texto.trim()) return;
    setGuardandoRapida(true);
    try {
      if (editandoRapidaId) {
        await fetch(`/api/crm/respuestas-rapidas?id=${editandoRapidaId}`, { method: 'DELETE' });
      }
      await fetch('/api/crm/respuestas-rapidas', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trigger: formRapida.trigger.trim(),
          texto: formRapida.texto.trim(),
          media_url: formRapida.media_url || null,
        }),
      });
      setFormRapida({ trigger: '', texto: '', media_url: '' });
      setEditandoRapidaId(null);
      setMostrarFormRapida(false);
      await cargarRespuestas();
    } finally { setGuardandoRapida(false); }
  };

  const iniciarEdicion = (r: Respuesta) => {
    setEditandoRapidaId(r.id);
    setFormRapida({ trigger: r.trigger, texto: r.texto, media_url: r.media_url ?? '' });
    setMostrarFormRapida(true);
  };

  const cancelarForm = () => {
    setFormRapida({ trigger: '', texto: '', media_url: '' });
    setEditandoRapidaId(null);
    setMostrarFormRapida(false);
  };

  const eliminarRespuestaRapida = async (id: string) => {
    await fetch(`/api/crm/respuestas-rapidas?id=${id}`, { method: 'DELETE' });
    setRespuestas((r) => r.filter((x) => x.id !== id));
  };

  const crearContacto = async () => {
    if (!nuevoContacto.nombre.trim() || !nuevoContacto.telefono.trim()) return;
    setCreandoContacto(true);
    try {
      const r = await fetch('/api/crm/contactos', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevoContacto),
      }).then((x) => x.json());
      setNuevoContacto({ nombre: '', telefono: '', email: '' });
      setModalNuevoContacto(false);
      await cargarContactos();
      if (r.id) { const c = await fetch(`/api/crm/conversaciones/${r.id}`).then((x) => x.json()); setActivo(c.contacto); setMensajes(c.mensajes ?? []); }
    } finally {
      setCreandoContacto(false);
    }
  };

  const guardarDatoContacto = async (campo: 'nombre' | 'telefono' | 'email', valor: string) => {
    if (!activo || !valor.trim()) return;
    const updated = { ...activo, [campo]: valor.trim() };
    setActivo(updated);
    setEditandoDato(null);
    await fetch(`/api/crm/contactos/${activo.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [campo]: valor.trim() }),
    });
    cargarContactos();
  };

  const avanzarEtapaAContactado = async (c: Contacto) => {
    if (c.etapa !== 'Nuevo') return;
    await fetch(`/api/crm/contactos/${c.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ etapa: 'Contactado' }),
    });
  };

  const abrir = useCallback(async (c: Contacto) => {
    setActivo(c);
    setFinanzas(null);
    const r = await fetch(`/api/crm/conversaciones/${c.id}`).then((x) => x.json());
    setMensajes(r.mensajes ?? []);
    fetch(`/api/crm/contactos/${c.id}/finanzas`).then((x) => x.json()).then(setFinanzas).catch(() => {});
    cargarContactos();
  }, [cargarContactos]);

  const enviarArchivo = async (file: File) => {
    if (!activo) return;
    const fd = new FormData(); fd.append('media', file);
    const up = await fetch('/api/crm/media', { method: 'POST', body: fd });
    if (!up.ok) return;
    const { url, tipo: tipoMedia, nombre } = await up.json();
    const esPdf = tipoMedia === 'DOCUMENTO';
    const r = await fetch('/api/crm/mensajes/enviar', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contacto_id: activo.id,
        texto: esPdf ? `📄 ${nombre ?? file.name}` : '📷 Imagen',
        media_url: url,
        tipo: esPdf ? 'DOCUMENTO' : 'IMAGEN',
      }),
    }).then((x) => x.json());
    if (r.mensaje) setMensajes((m) => [...m, r.mensaje]);
  };

  useEffect(() => { cargarContactos(); }, [cargarContactos]);
  useEffect(() => { cargarRespuestas(); }, [cargarRespuestas]);

  // Polling cada 10s (como pide el brief mientras no haya webhook en vivo)
  useEffect(() => {
    const t = setInterval(() => {
      cargarContactos();
      if (activo) fetch(`/api/crm/conversaciones/${activo.id}?marcar=no`).then((x) => x.json()).then((r) => setMensajes(r.mensajes ?? []));
    }, 10000);
    return () => clearInterval(t);
  }, [activo, cargarContactos]);

  useEffect(() => { finRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [mensajes]);

  const enviar = async () => {
    if (!texto.trim() || !activo) return;
    setEnviando(true);
    const contenido = texto;
    const media = pendingMedia;
    setTexto('');
    setPendingMedia(null);
    try {
      const r = await fetch('/api/crm/mensajes/enviar', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contacto_id: activo.id,
          texto: contenido,
          ...(media ? { media_url: media.url, tipo: 'IMAGEN' } : {}),
        }),
      }).then((x) => x.json());
      if (r.mensaje) {
        setMensajes((m) => [...m, r.mensaje]);
        avanzarEtapaAContactado(activo);
      }
    } finally {
      setEnviando(false);
    }
  };

  const aplicarRapida = (r: Respuesta) => {
    // Sustituir variables de plantilla con datos del contacto activo.
    let t = r.texto;
    if (activo) {
      t = t
        .replace(/\{\{nombre\}\}/gi, activo.nombre)
        .replace(/\{\{telefono\}\}/gi, activo.telefono)
        .replace(/\{\{email\}\}/gi, activo.email ?? '');
    }
    setTexto(t);
    setPendingMedia(r.media_url ? { url: r.media_url } : null);
    setMostrarRapidas(false);
  };

  const onTextoChange = (v: string) => {
    setTexto(v);
    setMostrarRapidas(v.startsWith('/'));
  };

  const toggleEtiqueta = async (tag: string) => {
    if (!activo) return;
    const nuevas = activo.etiquetas.includes(tag)
      ? activo.etiquetas.filter((t) => t !== tag)
      : [...activo.etiquetas, tag];
    setActivo({ ...activo, etiquetas: nuevas });
    await fetch(`/api/crm/contactos/${activo.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ etiquetas: nuevas }),
    });
    cargarContactos();
  };

  const cambiarEtapa = async (etapa: string) => {
    if (!activo) return;
    setActivo({ ...activo, etapa });
    setContactos((cs) => cs.map((c) => c.id === activo.id ? { ...c, etapa } : c));
    await fetch(`/api/crm/contactos/${activo.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ etapa }),
    });
  };

  const guardarNotas = async (notas: string) => {
    if (!activo) return;
    setActivo({ ...activo, notas });
    await fetch(`/api/crm/contactos/${activo.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notas }),
    });
  };

  const rapidasFiltradas = respuestas.filter((r) => r.trigger.startsWith(texto.split(' ')[0]));
  const contactosFiltrados = useMemo(() => {
    let cs = contactos;
    const q = busqueda.trim().toLowerCase();
    if (q) cs = cs.filter((c) =>
      c.nombre.toLowerCase().includes(q) || c.telefono.includes(q) || (c.email ?? '').toLowerCase().includes(q)
    );
    if (filtroEtapa) cs = cs.filter((c) => c.etapa === filtroEtapa);
    if (filtroSolo === 'noLeidos') cs = cs.filter((c) => c.no_leidos > 0);
    if (filtroSolo === 'alertas') cs = cs.filter((c) => sinRespuesta2h(c));
    return cs;
  }, [contactos, busqueda, filtroEtapa, filtroSolo]);

  const totalNoLeidos = useMemo(() => contactos.reduce((a, c) => a + (c.no_leidos ?? 0), 0), [contactos]);

  const abrirPorId = useCallback((id: string) => {
    const c = contactos.find((x) => x.id === id);
    if (c) { setVista('inbox'); abrir(c); }
  }, [contactos, abrir]);

  return (
    <div className="h-full flex flex-col">
      {/* Tabs Inbox / Pipeline */}
      <div className="px-4 py-2 border-b flex items-center justify-between gap-3 shrink-0"
        style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
        <div className="flex gap-1 rounded-lg p-0.5" style={{ background: 'var(--surface-muted)' }}>
          {([
            ['inbox', '💬 Inbox'],
            ['pipeline', '📋 Pipeline'],
            ['atajos', '⚡ Atajos'],
          ] as const).map(([id, label]) => (
            <button key={id} onClick={() => setVista(id)}
              className="px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5"
              style={vista === id
                ? { background: 'var(--surface)', color: 'var(--brand)', boxShadow: '0 1px 2px rgba(30,58,95,0.08)' }
                : { color: 'var(--text-secondary)' }}>
              {label}
              {id === 'inbox' && totalNoLeidos > 0 && (
                <span className="text-[9px] font-bold rounded-full px-1.5 py-0.5 text-white leading-none"
                  style={{ background: 'var(--danger)' }}>{totalNoLeidos}</span>
              )}
            </button>
          ))}
        </div>
        {vista === 'inbox' && activo && (
          <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
            Etapa: <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{(activo as any).etapa ?? 'Nuevo'}</span>
          </span>
        )}
      </div>

      {vista === 'pipeline' ? (
        <div className="flex-1 overflow-auto">
          <PipelineKanban onSeleccionar={abrirPorId} />
        </div>
      ) : vista === 'atajos' ? (
        /* ── Vista Atajos ─────────────────────────────────────── */
        <div className="flex-1 overflow-y-auto p-6">
          {/* Encabezado */}
          <div className="flex items-start justify-between gap-4 mb-5">
            <div>
              <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Atajos de respuesta</h2>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                Mensajes predefinidos que puedes usar escribiendo <code className="px-1 rounded" style={{ background: 'var(--surface-muted)' }}>/</code> en el chat. Pueden llevar imagen adjunta.
              </p>
            </div>
            <button
              onClick={() => { cancelarForm(); setMostrarFormRapida(true); }}
              className="dv-btn-primary shrink-0 !py-1.5 !text-xs">
              + Nuevo atajo
            </button>
          </div>

          {/* Formulario crear / editar */}
          {mostrarFormRapida && (
            <div className="dv-card p-4 mb-5 dv-animate-scale space-y-3">
              <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                {editandoRapidaId ? 'Editar atajo' : 'Nuevo atajo'}
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="dv-label">Trigger (empieza con /)</label>
                  <input value={formRapida.trigger}
                    onChange={(e) => setFormRapida((v) => ({ ...v, trigger: e.target.value }))}
                    placeholder="/bienvenida"
                    className="dv-input !text-sm" />
                </div>
                <div>
                  <label className="dv-label">Imagen adjunta (opcional)</label>
                  <div className="flex items-center gap-2">
                    {formRapida.media_url ? (
                      <>
                        {formRapida.media_url.includes('/documentos/') ? (
                          <div className="w-10 h-10 rounded-lg border flex items-center justify-center text-lg shrink-0"
                            style={{ borderColor: 'var(--border)', background: 'var(--surface-muted)' }}>📄</div>
                        ) : (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={formRapida.media_url} alt="preview" className="w-10 h-10 rounded-lg object-cover border shrink-0" style={{ borderColor: 'var(--border)' }} />
                        )}
                        <button onClick={() => setFormRapida((v) => ({ ...v, media_url: '' }))}
                          className="text-xs hover:opacity-70" style={{ color: 'var(--danger)' }}>✕ Quitar</button>
                      </>
                    ) : (
                      <button onClick={() => mediaRapidaRef.current?.click()} disabled={subiendoMediaRapida}
                        className="dv-btn-ghost !py-1.5 !text-xs disabled:opacity-50 w-full">
                        {subiendoMediaRapida ? 'Subiendo…' : '📎 Subir imagen o PDF'}
                      </button>
                    )}
                    <input ref={mediaRapidaRef} type="file" accept="image/*,application/pdf" className="hidden"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) subirMediaRapida(f); e.target.value = ''; }} />
                  </div>
                </div>
              </div>
              <div>
                <label className="dv-label">Texto del mensaje</label>
                <textarea value={formRapida.texto}
                  onChange={(e) => setFormRapida((v) => ({ ...v, texto: e.target.value }))}
                  placeholder="Hola {{nombre}}, gracias por contactarnos…"
                  rows={3} className="dv-input resize-none !text-sm" />
                <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>
                  Variables disponibles: <code className="rounded px-0.5" style={{ background: 'var(--surface-muted)' }}>{'{{nombre}}'}</code>{' '}
                  <code className="rounded px-0.5" style={{ background: 'var(--surface-muted)' }}>{'{{telefono}}'}</code>{' '}
                  <code className="rounded px-0.5" style={{ background: 'var(--surface-muted)' }}>{'{{email}}'}</code>
                </p>
              </div>
              <div className="flex gap-2 justify-end">
                <button onClick={cancelarForm} className="dv-btn-ghost !py-1.5 !text-xs">Cancelar</button>
                <button onClick={guardarFormRapida}
                  disabled={guardandoRapida || !formRapida.trigger.trim() || !formRapida.texto.trim()}
                  className="dv-btn-primary !py-1.5 !text-xs disabled:opacity-40">
                  {guardandoRapida ? 'Guardando…' : editandoRapidaId ? 'Guardar cambios' : 'Crear atajo'}
                </button>
              </div>
            </div>
          )}

          {/* Buscador */}
          <input value={filtroAtajos} onChange={(e) => setFiltroAtajos(e.target.value)}
            placeholder="Buscar por trigger o texto…"
            className="dv-input mb-4 !text-sm" />

          {/* Lista de atajos */}
          {respuestas.filter((r) => {
            const q = filtroAtajos.toLowerCase();
            return !q || r.trigger.includes(q) || r.texto.toLowerCase().includes(q);
          }).length === 0 ? (
            <div className="text-center py-16" style={{ color: 'var(--text-muted)' }}>
              <p className="text-3xl mb-3">⚡</p>
              <p className="text-sm font-medium">Sin atajos todavía</p>
              <p className="text-xs mt-1">Crea uno arriba y úsalo escribiendo / en el chat</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {respuestas
                .filter((r) => {
                  const q = filtroAtajos.toLowerCase();
                  return !q || r.trigger.includes(q) || r.texto.toLowerCase().includes(q);
                })
                .map((r) => (
                  <div key={r.id} className="dv-card dv-hover-lift p-4 flex gap-3 dv-animate-in">
                    {r.media_url && (
                      r.media_url.includes('/documentos/') ? (
                        <div className="w-14 h-14 rounded-xl border flex items-center justify-center text-2xl shrink-0"
                          style={{ borderColor: 'var(--border)', background: 'var(--surface-muted)' }}>📄</div>
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={r.media_url} alt="adjunto"
                          className="w-14 h-14 rounded-xl object-cover shrink-0 border"
                          style={{ borderColor: 'var(--border)' }} />
                      )
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="dv-badge dv-badge-accent !text-[11px] font-mono">{r.trigger}</span>
                        <div className="flex gap-1">
                          <button onClick={() => iniciarEdicion(r)} title="Editar"
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-sm transition-colors hover:bg-[var(--surface-muted)]"
                            style={{ color: 'var(--text-muted)' }}>✏️</button>
                          <button onClick={() => eliminarRespuestaRapida(r.id)} title="Eliminar"
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-sm transition-colors hover:bg-[var(--danger-soft)]"
                            style={{ color: 'var(--danger)' }}>🗑️</button>
                        </div>
                      </div>
                      <p className="text-xs leading-relaxed line-clamp-3" style={{ color: 'var(--text-secondary)' }}>{r.texto}</p>
                      {r.media_url && (
                        <p className="text-[10px] mt-1.5 flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                          <span>📷</span> Incluye imagen adjunta
                        </p>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      ) : (
      <div className="flex-1 flex min-h-0">
      {/* Lista de contactos */}
      <aside className="w-72 border-r flex flex-col shrink-0" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
        <div className="p-3 border-b flex gap-2" style={{ borderColor: 'var(--border)' }}>
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar contacto…"
            className="dv-input !rounded-lg !py-1.5 flex-1"
          />
          <button onClick={() => setModalNuevoContacto(true)} title="Nuevo contacto"
            className="w-9 h-9 rounded-lg border flex items-center justify-center text-lg transition-colors hover:bg-[var(--accent-soft)] shrink-0"
            style={{ borderColor: 'var(--border)', color: 'var(--brand)' }}>
            +
          </button>
        </div>

        {/* Filtros rápidos */}
        <div className="px-2 py-1.5 border-b flex flex-wrap gap-1" style={{ borderColor: 'var(--border)', background: 'var(--surface-muted)' }}>
          {/* Filtro de estado de lectura */}
          {(['todos', 'noLeidos', 'alertas'] as const).map((f) => {
            const labels = { todos: 'Todos', noLeidos: '● No leídos', alertas: '⏰ Sin resp.' };
            const active = filtroSolo === f;
            return (
              <button key={f} onClick={() => setFiltroSolo(f)}
                className="text-[10px] px-2 py-0.5 rounded-full border transition-all"
                style={active
                  ? { background: 'var(--brand)', color: 'white', borderColor: 'var(--brand)' }
                  : { borderColor: 'var(--border)', color: 'var(--text-muted)', background: 'var(--surface)' }}>
                {labels[f]}
              </button>
            );
          })}
          {/* Filtro por etapa */}
          {ETAPAS_CRM.map((e) => {
            const active = filtroEtapa === e.id;
            return (
              <button key={e.id} onClick={() => setFiltroEtapa(active ? null : e.id)}
                className="text-[10px] px-2 py-0.5 rounded-full border transition-all"
                style={active
                  ? { background: e.color, color: 'white', borderColor: e.color }
                  : { borderColor: 'var(--border)', color: 'var(--text-muted)', background: 'var(--surface)' }}>
                {e.id}
              </button>
            );
          })}
        </div>

        <div className="flex-1 overflow-y-auto">
          {contactosFiltrados.map((c, i) => (
            <button key={c.id} onClick={() => abrir(c)}
              className={`w-full text-left px-3 py-3 border-b transition-colors dv-animate-in`}
              style={{
                borderColor: 'var(--border)',
                background: activo?.id === c.id ? 'var(--brand-soft)' : undefined,
                animationDelay: `${Math.min(i * 25, 250)}ms`,
                borderLeft: `3px solid ${BORDE_ETAPA[c.etapa] ?? 'transparent'}`,
              }}>
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
                  style={{ background: 'var(--brand)', color: 'var(--accent)' }}>
                  {iniciales(c.nombre)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-medium text-sm truncate" style={{ color: 'var(--text-primary)' }}>{c.nombre}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      {sinRespuesta2h(c) && (
                        <span title="Sin respuesta hace más de 2h" className="text-[10px]" style={{ color: 'var(--danger)' }}>⏰</span>
                      )}
                      {c.no_leidos > 0 && (
                        <span className="text-[10px] font-bold rounded-full px-1.5 py-0.5 text-white" style={{ background: 'var(--success)' }}>
                          {c.no_leidos}
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-xs truncate mt-0.5" style={{ color: 'var(--text-muted)' }}>{c.ultimo_mensaje ?? c.telefono}</p>
                </div>
              </div>
              {c.etiquetas.length > 0 && (
                <div className="flex gap-1 mt-1.5 flex-wrap pl-[46px]">
                  {c.etiquetas.slice(0, 3).map((t) => (
                    <span key={t} className={`dv-badge ${colorTag(t)} !text-[10px] !px-1.5`}>{t}</span>
                  ))}
                </div>
              )}
            </button>
          ))}
          {contactosFiltrados.length === 0 && (
            <p className="p-4 text-sm text-center" style={{ color: 'var(--text-muted)' }}>
              {busqueda ? 'Sin resultados' : 'Sin contactos'}
            </p>
          )}
        </div>
      </aside>

      {/* Conversación */}
      <section className="flex-1 flex flex-col min-w-0" style={{ background: 'var(--background)' }}>
        {!activo ? (
          <div className="flex-1 flex flex-col items-center justify-start p-6 gap-6 overflow-y-auto dv-animate-in">
            <div className="flex flex-col items-center gap-3 pt-8">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'var(--brand-soft)', color: 'var(--brand)' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8z" />
                </svg>
              </div>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Selecciona una conversación para empezar</p>
            </div>

            {/* Teaser de atajos */}
            <button onClick={() => setVista('atajos')}
              className="w-full max-w-lg dv-card p-4 text-left dv-hover-lift flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-lg"
                style={{ background: 'var(--accent-soft)', color: 'var(--accent-hover)' }}>⚡</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Atajos de respuesta
                  <span className="ml-2 dv-badge dv-badge-accent !text-[10px]">{respuestas.length}</span>
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  {respuestas.length === 0
                    ? 'Crea mensajes predefinidos con / — pueden incluir imágenes'
                    : `${respuestas.filter((r) => r.media_url).length} con foto · haz clic para gestionar`}
                </p>
              </div>
              <span className="text-sm" style={{ color: 'var(--text-muted)' }}>→</span>
            </button>
          </div>
        ) : (
          <>
            <div className="border-b px-5 py-3 flex items-center justify-between shrink-0" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
                  style={{ background: 'var(--brand)', color: 'var(--accent)' }}>
                  {iniciales(activo.nombre)}
                </div>
                <div>
                  <h2 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{activo.nombre}</h2>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{activo.telefono}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Avance rápido de etapa */}
                {(() => {
                  const idx = ETAPAS_CRM.findIndex((e) => e.id === activo.etapa);
                  const next = ETAPAS_CRM[idx + 1];
                  if (!next) return null;
                  return (
                    <button onClick={() => cambiarEtapa(next.id)}
                      className="text-[11px] px-2.5 py-1.5 rounded-lg border font-medium transition-all hover:opacity-80"
                      style={{ borderColor: next.color, color: next.color, background: `${next.color}14` }}>
                      → {next.id}
                    </button>
                  );
                })()}
                <a href={waLink(activo.telefono)} target="_blank" rel="noopener noreferrer"
                  title="Abrir en WhatsApp"
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors hover:opacity-80"
                  style={{ borderColor: '#25D366', color: '#25D366', background: 'rgba(37,211,102,0.08)' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  WhatsApp
                </a>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-2">
              {mensajes.map((m, i) => {
                const fechaActual = etiquetaFecha(m.timestamp);
                const fechaAnterior = i > 0 ? etiquetaFecha(mensajes[i - 1].timestamp) : null;
                const mostrarSeparador = fechaActual !== fechaAnterior;
                return (
                <div key={m.id}>
                  {mostrarSeparador && (
                    <div className="flex items-center gap-3 my-3">
                      <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                        style={{ background: 'var(--surface-muted)', color: 'var(--text-muted)' }}>
                        {fechaActual}
                      </span>
                      <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
                    </div>
                  )}
                  <div className={`flex dv-animate-in ${m.origen === 'CLIENTE' ? 'justify-start' : 'justify-end'}`}>
                  <div className="max-w-[70%] rounded-2xl px-3.5 py-2 text-sm"
                    style={
                      m.origen === 'CLIENTE'
                        ? { background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }
                        : m.origen === 'AUTO'
                          ? { background: 'var(--accent-soft)', border: '1px solid var(--accent)', color: 'var(--text-secondary)' }
                          : { background: 'var(--brand)', color: 'white' }
                    }>
                    {m.media_url && (
                      m.tipo === 'DOCUMENTO'
                        ? (
                          <a href={m.media_url} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-2 rounded-lg px-2.5 py-2 mb-1 text-xs border transition-colors hover:opacity-80"
                            style={{ borderColor: 'rgba(255,255,255,0.25)', background: 'rgba(0,0,0,0.1)' }}>
                            <span className="text-base">📄</span>
                            <span className="truncate">{m.contenido.replace(/^📄\s*/, '')}</span>
                            <span className="shrink-0 opacity-70">↓</span>
                          </a>
                        )
                        : (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={m.media_url} alt="adjunto" className="rounded-lg mb-1 max-w-full max-h-48 object-cover" />
                        )
                    )}
                    <p className="whitespace-pre-wrap">{m.contenido}</p>
                    <p className="text-[10px] mt-1" style={{ color: m.origen === 'OPERADOR' ? 'rgba(255,255,255,0.6)' : 'var(--text-muted)' }}>
                      {m.origen === 'AUTO' && '🤖 '}{hora(m.timestamp)}
                    </p>
                  </div>
                  </div>
                </div>
                );
              })}
              <div ref={finRef} />
            </div>

            {/* Caja de envío */}
            <div className="border-t p-3 shrink-0 relative" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
              {mostrarRapidas && rapidasFiltradas.length > 0 && (
                <div className="absolute bottom-full left-3 right-3 mb-1 dv-card shadow-lg overflow-hidden dv-animate-scale">
                  {rapidasFiltradas.map((r) => (
                    <button key={r.id} onClick={() => aplicarRapida(r)}
                      className="w-full text-left px-3 py-2 border-b last:border-0 transition-colors hover:bg-[var(--surface-muted)] flex items-center gap-2.5"
                      style={{ borderColor: 'var(--border)' }}>
                      {r.media_url && (
                        r.media_url.includes('/documentos/') ? (
                          <div className="w-8 h-8 rounded-lg border flex items-center justify-center text-sm shrink-0"
                            style={{ borderColor: 'var(--border)', background: 'var(--surface-muted)' }}>📄</div>
                        ) : (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={r.media_url} alt="" className="w-8 h-8 rounded-lg object-cover shrink-0 border" style={{ borderColor: 'var(--border)' }} />
                        )
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold" style={{ color: 'var(--accent-hover)' }}>{r.trigger}</span>
                          {r.media_url && <span className="text-[9px] px-1 py-0.5 rounded" style={{ background: 'var(--accent-soft)', color: 'var(--accent-hover)' }}>{r.media_url.includes('/documentos/') ? '📄 doc' : '📷 foto'}</span>}
                        </div>
                        <p className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>{r.texto}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {/* Preview de imagen pendiente (del atajo aplicado) */}
              {pendingMedia && (
                <div className="absolute bottom-full left-3 mb-1 flex items-center gap-2 px-2.5 py-1.5 rounded-xl border dv-animate-in"
                  style={{ background: 'var(--surface)', borderColor: 'var(--accent)', boxShadow: '0 2px 8px rgba(78,161,255,0.15)' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={pendingMedia.url} alt="adjunto" className="w-8 h-8 rounded-lg object-cover shrink-0" />
                  <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Imagen adjunta al enviar</span>
                  <button onClick={() => setPendingMedia(null)} className="text-xs ml-1 hover:opacity-70" style={{ color: 'var(--danger)' }}>✕</button>
                </div>
              )}
              <div className="flex items-end gap-2">
                <input ref={imgRef} type="file" accept="image/*,application/pdf" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) enviarArchivo(f); e.target.value = ''; }} />
                <button onClick={() => imgRef.current?.click()} title="Adjuntar imagen o PDF"
                  className="px-3 py-2 border rounded-xl transition-colors hover:bg-[var(--surface-muted)]"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>📎</button>
                <textarea value={texto} onChange={(e) => onTextoChange(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar(); } }}
                  placeholder="Escribe un mensaje… ( / para respuestas rápidas )" rows={1}
                  className="dv-input flex-1 resize-none !rounded-xl" />
                <button onClick={enviar} disabled={enviando || !texto.trim()}
                  className="dv-btn-primary !rounded-xl disabled:opacity-40">
                  Enviar
                </button>
              </div>
            </div>
          </>
        )}
      </section>

      {/* Panel derecho: detalles del contacto */}
      {activo && (
        <aside className="w-64 border-l p-4 overflow-y-auto shrink-0 dv-animate-panel" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
          <h3 className="dv-eyebrow mb-2">Etiquetas</h3>
          <div className="flex flex-wrap gap-1.5 mb-5">
            {ETIQUETAS_DISP.map((t) => {
              const on = activo.etiquetas.includes(t);
              return (
                <button key={t} onClick={() => toggleEtiqueta(t)}
                  className={`text-xs px-2 py-1 rounded-full border transition-all ${on ? colorTag(t) + ' border-transparent' : ''}`}
                  style={!on ? { borderColor: 'var(--border)', color: 'var(--text-muted)' } : undefined}>
                  {t}
                </button>
              );
            })}
          </div>

          <h3 className="dv-eyebrow mb-2">Datos</h3>
          <div className="text-sm space-y-1.5 mb-5">
            {(['nombre', 'telefono', 'email'] as const).map((campo) => {
              const icono = campo === 'nombre' ? '👤' : campo === 'telefono' ? '📱' : '📧';
              const valor = activo[campo] ?? '';
              const editando = editandoDato === campo;
              return (
                <div key={campo}>
                  {editando ? (
                    <div className="flex items-center gap-1">
                      <input autoFocus value={valorEdicion}
                        onChange={(e) => setValorEdicion(e.target.value)}
                        onBlur={() => guardarDatoContacto(campo, valorEdicion)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') guardarDatoContacto(campo, valorEdicion);
                          if (e.key === 'Escape') setEditandoDato(null);
                        }}
                        className="dv-input !text-xs !py-1 flex-1" />
                    </div>
                  ) : (
                    <button onClick={() => { setEditandoDato(campo); setValorEdicion(valor); }}
                      className="w-full text-left flex items-center gap-1.5 group"
                      style={{ color: 'var(--text-secondary)' }}>
                      <span>{icono}</span>
                      <span className="truncate flex-1 text-xs">{valor || '—'}</span>
                      <span className="opacity-0 group-hover:opacity-100 text-[10px] transition-opacity" style={{ color: 'var(--text-muted)' }}>✏️</span>
                    </button>
                  )}
                </div>
              );
            })}
            <a href={waLink(activo.telefono)} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs mt-1 hover:opacity-80 transition-opacity w-fit"
              style={{ color: '#25D366' }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Abrir en WhatsApp
            </a>
          </div>

          <h3 className="dv-eyebrow mb-2">Etapa del pipeline</h3>
          <div className="mb-5 flex flex-wrap gap-1.5">
            {ETAPAS_CRM.map((e, idx) => {
              const active = activo.etapa === e.id;
              return (
                <button key={e.id} onClick={() => cambiarEtapa(e.id)}
                  className="text-[11px] px-2.5 py-1 rounded-full border font-medium transition-all"
                  style={active
                    ? { background: e.color, color: 'white', borderColor: e.color, boxShadow: `0 2px 8px ${e.color}44` }
                    : { borderColor: 'var(--border)', color: 'var(--text-muted)', background: 'var(--surface)' }}>
                  {idx + 1}. {e.id}
                </button>
              );
            })}
          </div>

          <h3 className="dv-eyebrow mb-2">Resumen financiero</h3>
          {finanzas ? (
            <div className="mb-5 dv-card-muted p-3 text-sm dv-animate-in">
              <div className="flex justify-between"><span style={{ color: 'var(--text-secondary)' }}>Ingresos</span><span className="font-medium" style={{ color: 'var(--success)' }}>{soles(finanzas.ingresos)}</span></div>
              <div className="flex justify-between"><span style={{ color: 'var(--text-secondary)' }}>Egresos</span><span className="font-medium" style={{ color: 'var(--danger)' }}>{soles(finanzas.egresos)}</span></div>
              <div className="flex justify-between border-t mt-1 pt-1" style={{ borderColor: 'var(--border)' }}>
                <span style={{ color: 'var(--text-primary)' }}>Neto</span>
                <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{soles(finanzas.ingresos - finanzas.egresos)}</span>
              </div>
              {finanzas.ultimas.length > 0 && (
                <div className="mt-2 pt-2 border-t space-y-0.5" style={{ borderColor: 'var(--border)' }}>
                  {finanzas.ultimas.slice(0, 3).map((u) => (
                    <div key={u.id} className="flex justify-between text-xs">
                      <span className="truncate" style={{ color: 'var(--text-muted)' }}>{u.fecha} · {u.categoria}</span>
                      <span style={{ color: u.tipo === 'INGRESO' ? 'var(--success)' : 'var(--danger)' }}>{soles(u.monto)}</span>
                    </div>
                  ))}
                </div>
              )}
              <a href="/dashboard/finanzas" className="block mt-2 text-xs hover:underline font-medium" style={{ color: 'var(--accent-hover)' }}>Ver en Finanzas →</a>
            </div>
          ) : (
            <div className="mb-5 space-y-2">
              <div className="dv-skeleton h-4 w-full" />
              <div className="dv-skeleton h-4 w-2/3" />
            </div>
          )}

          <h3 className="dv-eyebrow mb-2">Notas internas</h3>
          <textarea defaultValue={activo.notas ?? ''} onBlur={(e) => guardarNotas(e.target.value)}
            placeholder="No visible para el cliente…" rows={4}
            className="dv-input resize-none" />
        </aside>
      )}
      </div>
      )}

      <AgentePanel
        contactoActivoId={activo?.id ?? null}
        onAplicarBorrador={(t) => setTexto(t)}
      />

      {/* Modal nuevo contacto */}
      {modalNuevoContacto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.45)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setModalNuevoContacto(false); }}>
          <div className="dv-card p-6 w-full max-w-sm space-y-4 dv-animate-scale">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Nuevo contacto</h2>
              <button onClick={() => setModalNuevoContacto(false)} className="text-sm" style={{ color: 'var(--text-muted)' }}>✕</button>
            </div>
            <input value={nuevoContacto.nombre} onChange={(e) => setNuevoContacto((v) => ({ ...v, nombre: e.target.value }))}
              placeholder="Nombre completo *" className="dv-input" />
            <input value={nuevoContacto.telefono} onChange={(e) => setNuevoContacto((v) => ({ ...v, telefono: e.target.value }))}
              placeholder="+51 9XXXXXXXX *" className="dv-input" />
            <input value={nuevoContacto.email} onChange={(e) => setNuevoContacto((v) => ({ ...v, email: e.target.value }))}
              placeholder="Email (opcional)" className="dv-input" type="email" />
            <div className="flex gap-2 pt-1">
              <button onClick={() => setModalNuevoContacto(false)}
                className="flex-1 dv-btn-ghost">Cancelar</button>
              <button onClick={crearContacto} disabled={creandoContacto || !nuevoContacto.nombre.trim() || !nuevoContacto.telefono.trim()}
                className="flex-1 dv-btn-primary disabled:opacity-40">
                {creandoContacto ? 'Creando…' : 'Crear contacto'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

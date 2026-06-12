'use client';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';

type ResumenCliente = { ingresos: number; egresos: number; total: number; ultimas: { id: string; tipo: string; monto: number; fecha: string; categoria: string }[] };
const soles = (n: number) => 'S/. ' + Number(n).toLocaleString('es-PE', { minimumFractionDigits: 2 });

type Contacto = {
  id: string; nombre: string; telefono: string; email: string | null;
  etiquetas: string[]; notas: string | null;
  ultimo_mensaje: string | null; ultimo_at: string | null; no_leidos: number;
};
type Mensaje = {
  id: string; origen: 'CLIENTE' | 'OPERADOR' | 'AUTO'; tipo: string;
  contenido: string; media_url: string | null; timestamp: string;
};
type Respuesta = { id: string; trigger: string; texto: string };

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

export default function CrmClient() {
  const [contactos, setContactos] = useState<Contacto[]>([]);
  const [activo, setActivo] = useState<Contacto | null>(null);
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [respuestas, setRespuestas] = useState<Respuesta[]>([]);
  const [texto, setTexto] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [mostrarRapidas, setMostrarRapidas] = useState(false);
  const [finanzas, setFinanzas] = useState<ResumenCliente | null>(null);
  const finRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLInputElement>(null);

  const cargarContactos = useCallback(async () => {
    const c = await fetch('/api/crm/contactos').then((x) => x.json());
    setContactos(Array.isArray(c) ? c : []);
  }, []);

  const abrir = useCallback(async (c: Contacto) => {
    setActivo(c);
    setFinanzas(null);
    const r = await fetch(`/api/crm/conversaciones/${c.id}`).then((x) => x.json());
    setMensajes(r.mensajes ?? []);
    fetch(`/api/crm/contactos/${c.id}/finanzas`).then((x) => x.json()).then(setFinanzas).catch(() => {});
    cargarContactos();
  }, [cargarContactos]);

  const enviarImagen = async (file: File) => {
    if (!activo) return;
    const fd = new FormData(); fd.append('media', file);
    const up = await fetch('/api/crm/media', { method: 'POST', body: fd });
    if (!up.ok) return;
    const { url } = await up.json();
    const r = await fetch('/api/crm/mensajes/enviar', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contacto_id: activo.id, texto: '📷 Imagen', media_url: url, tipo: 'IMAGEN' }),
    }).then((x) => x.json());
    if (r.mensaje) setMensajes((m) => [...m, r.mensaje]);
  };

  useEffect(() => { cargarContactos(); }, [cargarContactos]);
  useEffect(() => {
    fetch('/api/crm/respuestas-rapidas').then((x) => x.json()).then((r) => setRespuestas(Array.isArray(r) ? r : []));
  }, []);

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
    setTexto('');
    try {
      const r = await fetch('/api/crm/mensajes/enviar', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contacto_id: activo.id, texto: contenido }),
      }).then((x) => x.json());
      if (r.mensaje) setMensajes((m) => [...m, r.mensaje]);
    } finally {
      setEnviando(false);
    }
  };

  const aplicarRapida = (r: Respuesta) => { setTexto(r.texto); setMostrarRapidas(false); };

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
    const q = busqueda.trim().toLowerCase();
    if (!q) return contactos;
    return contactos.filter((c) =>
      c.nombre.toLowerCase().includes(q) || c.telefono.includes(q) || (c.email ?? '').toLowerCase().includes(q)
    );
  }, [contactos, busqueda]);

  return (
    <div className="h-full flex">
      {/* Lista de contactos */}
      <aside className="w-72 border-r flex flex-col shrink-0" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
        <div className="p-3 border-b" style={{ borderColor: 'var(--border)' }}>
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar contacto…"
            className="dv-input !rounded-lg !py-1.5"
          />
        </div>
        <div className="flex-1 overflow-y-auto">
          {contactosFiltrados.map((c, i) => (
            <button key={c.id} onClick={() => abrir(c)}
              className={`w-full text-left px-3 py-3 border-b transition-colors dv-animate-in`}
              style={{
                borderColor: 'var(--border)',
                background: activo?.id === c.id ? 'var(--brand-soft)' : undefined,
                animationDelay: `${Math.min(i * 25, 250)}ms`,
              }}>
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
                  style={{ background: 'var(--brand)', color: 'var(--accent)' }}>
                  {iniciales(c.nombre)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm truncate" style={{ color: 'var(--text-primary)' }}>{c.nombre}</span>
                    {c.no_leidos > 0 && (
                      <span className="ml-2 shrink-0 text-[10px] font-bold rounded-full px-1.5 py-0.5 text-white" style={{ background: 'var(--success)' }}>
                        {c.no_leidos}
                      </span>
                    )}
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
          <div className="flex-1 flex flex-col items-center justify-center gap-3 dv-animate-in">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'var(--brand-soft)', color: 'var(--brand)' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8z" />
              </svg>
            </div>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Selecciona una conversación para empezar</p>
          </div>
        ) : (
          <>
            <div className="border-b px-5 py-3 flex items-center justify-between shrink-0" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold"
                  style={{ background: 'var(--brand)', color: 'var(--accent)' }}>
                  {iniciales(activo.nombre)}
                </div>
                <div>
                  <h2 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{activo.nombre}</h2>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{activo.telefono}</p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-2">
              {mensajes.map((m) => (
                <div key={m.id} className={`flex dv-animate-in ${m.origen === 'CLIENTE' ? 'justify-start' : 'justify-end'}`}>
                  <div className="max-w-[70%] rounded-2xl px-3.5 py-2 text-sm"
                    style={
                      m.origen === 'CLIENTE'
                        ? { background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }
                        : m.origen === 'AUTO'
                          ? { background: 'var(--accent-soft)', border: '1px solid var(--accent)', color: 'var(--text-secondary)' }
                          : { background: 'var(--brand)', color: 'white' }
                    }>
                    {m.media_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={m.media_url} alt="adjunto" className="rounded-lg mb-1 max-w-full max-h-48 object-cover" />
                    )}
                    <p className="whitespace-pre-wrap">{m.contenido}</p>
                    <p className="text-[10px] mt-1" style={{ color: m.origen === 'OPERADOR' ? 'rgba(255,255,255,0.6)' : 'var(--text-muted)' }}>
                      {m.origen === 'AUTO' && '🤖 '}{hora(m.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={finRef} />
            </div>

            {/* Caja de envío */}
            <div className="border-t p-3 shrink-0 relative" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
              {mostrarRapidas && rapidasFiltradas.length > 0 && (
                <div className="absolute bottom-full left-3 right-3 mb-1 dv-card shadow-lg overflow-hidden dv-animate-scale">
                  {rapidasFiltradas.map((r) => (
                    <button key={r.id} onClick={() => aplicarRapida(r)}
                      className="w-full text-left px-3 py-2 border-b last:border-0 transition-colors hover:bg-[var(--surface-muted)]"
                      style={{ borderColor: 'var(--border)' }}>
                      <span className="text-xs font-semibold" style={{ color: 'var(--accent-hover)' }}>{r.trigger}</span>
                      <p className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>{r.texto}</p>
                    </button>
                  ))}
                </div>
              )}
              <div className="flex items-end gap-2">
                <input ref={imgRef} type="file" accept="image/*" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) enviarImagen(f); e.target.value = ''; }} />
                <button onClick={() => imgRef.current?.click()} title="Adjuntar imagen"
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
          <div className="text-sm space-y-1 mb-5" style={{ color: 'var(--text-secondary)' }}>
            <p>📧 {activo.email ?? '—'}</p>
            <p>📱 {activo.telefono}</p>
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
  );
}

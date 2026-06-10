'use client';

import { useEffect, useState, useCallback, useRef } from 'react';

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
    Nuevo: 'bg-blue-100 text-blue-700', 'En proceso': 'bg-yellow-100 text-yellow-700',
    Pagado: 'bg-green-100 text-green-700', Turnitin: 'bg-purple-100 text-purple-700',
    Afiliado: 'bg-indigo-100 text-indigo-700', VIP: 'bg-pink-100 text-pink-700',
  };
  return m[t] ?? 'bg-gray-100 text-gray-600';
};
const hora = (s: string) => new Date(s).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });

export default function CrmClient() {
  const [contactos, setContactos] = useState<Contacto[]>([]);
  const [activo, setActivo] = useState<Contacto | null>(null);
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [respuestas, setRespuestas] = useState<Respuesta[]>([]);
  const [texto, setTexto] = useState('');
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

  return (
    <div className="h-full flex">
      {/* Lista de contactos */}
      <aside className="w-72 border-r border-gray-100 bg-white flex flex-col shrink-0">
        <div className="p-3 border-b border-gray-100">
          <input placeholder="Buscar..." className="w-full bg-gray-100 rounded-lg px-3 py-1.5 text-sm focus:outline-none" />
        </div>
        <div className="flex-1 overflow-y-auto">
          {contactos.map((c) => (
            <button key={c.id} onClick={() => abrir(c)}
              className={`w-full text-left px-3 py-3 border-b border-gray-50 hover:bg-gray-50 ${activo?.id === c.id ? 'bg-gray-50' : ''}`}>
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm text-gray-900 truncate">{c.nombre}</span>
                {c.no_leidos > 0 && (
                  <span className="ml-2 shrink-0 bg-green-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5">{c.no_leidos}</span>
                )}
              </div>
              <p className="text-xs text-gray-400 truncate mt-0.5">{c.ultimo_mensaje ?? c.telefono}</p>
              <div className="flex gap-1 mt-1 flex-wrap">
                {c.etiquetas.slice(0, 3).map((t) => (
                  <span key={t} className={`text-[10px] px-1.5 py-0.5 rounded-full ${colorTag(t)}`}>{t}</span>
                ))}
              </div>
            </button>
          ))}
          {contactos.length === 0 && <p className="p-4 text-sm text-gray-400 text-center">Sin contactos</p>}
        </div>
      </aside>

      {/* Conversación */}
      <section className="flex-1 flex flex-col min-w-0 bg-gray-50">
        {!activo ? (
          <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
            Selecciona una conversación
          </div>
        ) : (
          <>
            <div className="bg-white border-b border-gray-100 px-5 py-3 flex items-center justify-between shrink-0">
              <div>
                <h2 className="font-semibold text-sm text-gray-900">{activo.nombre}</h2>
                <p className="text-xs text-gray-400">{activo.telefono}</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-2">
              {mensajes.map((m) => (
                <div key={m.id} className={`flex ${m.origen === 'CLIENTE' ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[70%] rounded-2xl px-3.5 py-2 text-sm ${
                    m.origen === 'CLIENTE' ? 'bg-white border border-gray-100 text-gray-800'
                      : m.origen === 'AUTO' ? 'bg-gray-200 text-gray-600' : 'bg-green-500 text-white'}`}>
                    {m.media_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={m.media_url} alt="adjunto" className="rounded-lg mb-1 max-w-full max-h-48 object-cover" />
                    )}
                    <p className="whitespace-pre-wrap">{m.contenido}</p>
                    <p className={`text-[10px] mt-1 ${m.origen === 'CLIENTE' ? 'text-gray-400' : 'text-white/70'}`}>
                      {m.origen === 'AUTO' && '🤖 '}{hora(m.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={finRef} />
            </div>

            {/* Caja de envío */}
            <div className="bg-white border-t border-gray-100 p-3 shrink-0 relative">
              {mostrarRapidas && rapidasFiltradas.length > 0 && (
                <div className="absolute bottom-full left-3 right-3 mb-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                  {rapidasFiltradas.map((r) => (
                    <button key={r.id} onClick={() => aplicarRapida(r)}
                      className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b border-gray-50 last:border-0">
                      <span className="text-xs font-semibold text-green-600">{r.trigger}</span>
                      <p className="text-xs text-gray-500 truncate">{r.texto}</p>
                    </button>
                  ))}
                </div>
              )}
              <div className="flex items-end gap-2">
                <input ref={imgRef} type="file" accept="image/*" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) enviarImagen(f); e.target.value = ''; }} />
                <button onClick={() => imgRef.current?.click()} title="Adjuntar imagen"
                  className="px-3 py-2 border border-gray-200 rounded-xl text-gray-500 hover:bg-gray-50">📎</button>
                <textarea value={texto} onChange={(e) => onTextoChange(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar(); } }}
                  placeholder="Escribe un mensaje… ( / para respuestas rápidas )" rows={1}
                  className="flex-1 resize-none border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                <button onClick={enviar} disabled={enviando || !texto.trim()}
                  className="px-4 py-2 bg-green-500 text-white rounded-xl text-sm font-medium hover:bg-green-600 disabled:bg-gray-300">
                  Enviar
                </button>
              </div>
            </div>
          </>
        )}
      </section>

      {/* Panel derecho: detalles del contacto */}
      {activo && (
        <aside className="w-64 border-l border-gray-100 bg-white p-4 overflow-y-auto shrink-0">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Etiquetas</h3>
          <div className="flex flex-wrap gap-1.5 mb-5">
            {ETIQUETAS_DISP.map((t) => {
              const on = activo.etiquetas.includes(t);
              return (
                <button key={t} onClick={() => toggleEtiqueta(t)}
                  className={`text-xs px-2 py-1 rounded-full border ${on ? colorTag(t) + ' border-transparent' : 'border-gray-200 text-gray-400'}`}>
                  {t}
                </button>
              );
            })}
          </div>

          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Datos</h3>
          <div className="text-sm text-gray-600 space-y-1 mb-5">
            <p>📧 {activo.email ?? '—'}</p>
            <p>📱 {activo.telefono}</p>
          </div>

          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">💰 Resumen financiero</h3>
          {finanzas ? (
            <div className="mb-5 rounded-xl border border-gray-100 p-3 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Ingresos</span><span className="text-green-600 font-medium">{soles(finanzas.ingresos)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Egresos</span><span className="text-red-500 font-medium">{soles(finanzas.egresos)}</span></div>
              <div className="flex justify-between border-t border-gray-100 mt-1 pt-1"><span className="text-gray-600">Neto</span><span className="font-semibold">{soles(finanzas.ingresos - finanzas.egresos)}</span></div>
              {finanzas.ultimas.length > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-100 space-y-0.5">
                  {finanzas.ultimas.slice(0, 3).map((u) => (
                    <div key={u.id} className="flex justify-between text-xs">
                      <span className="text-gray-400 truncate">{u.fecha} · {u.categoria}</span>
                      <span className={u.tipo === 'INGRESO' ? 'text-green-600' : 'text-red-500'}>{soles(u.monto)}</span>
                    </div>
                  ))}
                </div>
              )}
              <a href="/dashboard/finanzas" className="block mt-2 text-xs text-blue-500 hover:underline">Ver en Finanzas →</a>
            </div>
          ) : (
            <p className="text-xs text-gray-300 mb-5">Cargando…</p>
          )}

          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Notas internas</h3>
          <textarea defaultValue={activo.notas ?? ''} onBlur={(e) => guardarNotas(e.target.value)}
            placeholder="No visible para el cliente…" rows={4}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
        </aside>
      )}
    </div>
  );
}

'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import MdTexto from './MdTexto';

type ChatTurno = { rol: 'user' | 'assistant'; contenido: string; borrador?: string };
type Aviso = {
  id: string; tipo: string; severidad: 'info' | 'warn' | 'urgente';
  titulo: string; detalle: string | null; contacto_id: string | null;
  metadata: any; created_at: string;
};

const ACCIONES_RAPIDAS = [
  { id: 'reporte', label: '📊 Reporte de hoy', prompt: 'Dame el reporte diario de hoy con lo más accionable' },
  { id: 'sin_resp', label: '⏰ Sin respuesta', prompt: '¿Qué contactos tienen más de 2 horas sin respuesta?' },
  { id: 'pico', label: '🔝 Pico del día', prompt: 'Resume el servicio más solicitado hoy y qué priorizar' },
];

const sevClase: Record<Aviso['severidad'], string> = {
  info: 'dv-badge-brand',
  warn: 'dv-badge-warning',
  urgente: 'dv-badge-danger',
};

export default function AgentePanel({
  contactoActivoId,
  onAplicarBorrador,
}: {
  contactoActivoId: string | null;
  onAplicarBorrador: (texto: string) => void;
}) {
  const [abierto, setAbierto] = useState(false);
  const [historial, setHistorial] = useState<ChatTurno[]>([]);
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [pensando, setPensando] = useState(false);
  const [configurado, setConfigurado] = useState(false);
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [tab, setTab] = useState<'chat' | 'avisos' | 'reporte' | 'yapes'>('chat');
  const [yapeFiltro, setYapeFiltro] = useState({ desde: '', hasta: '' });
  const [exportandoYapes, setExportandoYapes] = useState(false);
  const [reporte, setReporte] = useState<{ contenido: string; metricas: any; generado_en?: string } | null>(null);
  const [cargandoReporte, setCargandoReporte] = useState(false);
  const finRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLInputElement>(null);
  const yapeImgRef = useRef<HTMLInputElement>(null);

  const cargar = useCallback(async () => {
    const r = await fetch('/api/agente/chat').then((x) => x.json()).catch(() => null);
    if (r) {
      setHistorial(r.historial ?? []);
      setConfigurado(r.configurado);
    }
    const a = await fetch('/api/agente/avisos').then((x) => x.json()).catch(() => []);
    setAvisos(Array.isArray(a) ? a : []);
  }, []);

  // Carga inicial de avisos para que el badge sea visible aunque el panel esté cerrado.
  useEffect(() => {
    fetch('/api/agente/avisos').then((x) => x.json()).then((a) => setAvisos(Array.isArray(a) ? a : [])).catch(() => {});
  }, []);

  useEffect(() => { if (abierto) cargar(); }, [abierto, cargar]);
  useEffect(() => { finRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [historial, pensando]);

  // Esc cierra el panel.
  useEffect(() => {
    if (!abierto) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setAbierto(false); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [abierto]);

  // Al abrir el panel por primera vez sin historial, inyecta el reporte del día como mensaje de bienvenida.
  useEffect(() => {
    if (!abierto) return;
    fetch('/api/agente/reporte-diario')
      .then((x) => x.json())
      .then((r) => {
        if (r?.contenido && historial.length === 0) {
          setHistorial([{ rol: 'assistant', contenido: `📊 **Reporte del día**\n\n${r.contenido}` }]);
        }
      })
      .catch(() => {});
  // Solo al abrir — no queremos re-inyectar si ya hay historial
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto]);

  const enviar = async (promptOverride?: string, imagen?: { mimeType: string; base64: string }) => {
    const prompt = promptOverride ?? texto.trim();
    if (!prompt || enviando) return;
    setEnviando(true);
    setPensando(true);
    setHistorial((h) => [...h, { rol: 'user', contenido: prompt }]);
    if (!promptOverride) setTexto('');
    try {
      const r = await fetch('/api/agente/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, imagen }),
      }).then((x) => x.json());
      if (r.error) throw new Error(r.error);
      setPensando(false);
      setHistorial((h) => [...h, { rol: 'assistant', contenido: r.texto }]);
    } catch (e: any) {
      setPensando(false);
      setHistorial((h) => [...h, { rol: 'assistant', contenido: '⚠️ ' + e.message }]);
    } finally {
      setEnviando(false);
    }
  };

  const analizarConversacionActiva = async () => {
    if (!contactoActivoId) {
      setHistorial((h) => [...h, { rol: 'assistant', contenido: 'Abre una conversación primero para analizarla.' }]);
      setTab('chat');
      return;
    }
    setEnviando(true);
    setPensando(true);
    setTab('chat');
    setHistorial((h) => [...h, { rol: 'user', contenido: '[acción] Analizar conversación activa' }]);
    try {
      const r = await fetch('/api/agente/analizar', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactoId: contactoActivoId }),
      }).then((x) => x.json());
      const md = [
        `**Resumen:** ${r.resumen}`,
        `**Sentimiento:** ${r.sentimiento}`,
        `**Siguiente acción:** ${r.siguienteAccion}`,
        '',
        '**Borrador sugerido:**',
        r.borrador,
      ].join('\n');
      setPensando(false);
      setHistorial((h) => [...h, { rol: 'assistant', contenido: md, borrador: r.borrador }]);
    } catch (e: any) {
      setPensando(false);
      setHistorial((h) => [...h, { rol: 'assistant', contenido: '⚠️ ' + e.message }]);
    } finally { setEnviando(false); }
  };

  const sugerirEnConversacion = async () => {
    if (!contactoActivoId) return;
    setEnviando(true);
    setPensando(true);
    try {
      const r = await fetch('/api/agente/sugerir', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactoId: contactoActivoId }),
      }).then((x) => x.json());
      setPensando(false);
      onAplicarBorrador(r.borrador);
      setHistorial((h) => [...h, { rol: 'user', contenido: '[acción] Sugerir mensaje en el chat' }, { rol: 'assistant', contenido: `Borrador puesto en el chat ↘\n\n"${r.borrador}"` }]);
      setTab('chat');
    } catch (e: any) {
      setPensando(false);
      setHistorial((h) => [...h, { rol: 'assistant', contenido: '⚠️ ' + e.message }]);
    } finally { setEnviando(false); }
  };

  const cargarReporte = async (regenerar = false) => {
    setCargandoReporte(true);
    try {
      const url = `/api/agente/reporte-diario${regenerar ? '?generar=true' : ''}`;
      const r = await fetch(url).then((x) => x.json());
      setReporte(r);
    } finally { setCargandoReporte(false); }
  };
  useEffect(() => { if (tab === 'reporte') cargarReporte(false); }, [tab]);

  const dismissAviso = async (id: string) => {
    await fetch('/api/agente/avisos', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    setAvisos((a) => a.filter((x) => x.id !== id));
  };

  const detectarYapeImg = async (file: File) => {
    const base64 = await new Promise<string>((res) => {
      const r = new FileReader();
      r.onload = () => res(String(r.result).split(',')[1]);
      r.readAsDataURL(file);
    });
    setEnviando(true);
    setTab('chat');
    setHistorial((h) => [...h, { rol: 'user', contenido: `[Yape] Detectar comprobante (${file.name})` }]);
    try {
      const r = await fetch('/api/agente/detectar-yape', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imagen: { base64, mimeType: file.type }, contactoId: contactoActivoId, registrar: true }),
      }).then((x) => x.json());
      if (!r.ok) {
        setHistorial((h) => [...h, { rol: 'assistant', contenido: `No pude leer el comprobante: ${r.error ?? 'datos insuficientes'}.` }]);
      } else {
        const msg = [
          `✅ Yape detectado y registrado en finanzas.`,
          `**Monto:** S/. ${r.deteccion.monto?.toFixed?.(2) ?? r.deteccion.monto}`,
          r.deteccion.pagador ? `**Pagador:** ${r.deteccion.pagador}` : null,
          r.deteccion.fecha ? `**Fecha:** ${r.deteccion.fecha}` : null,
          `**Confianza:** ${r.deteccion.confianza}`,
          r.deteccion.mock ? '\n_modo simulado — define ANTHROPIC_API_KEY para visión real_' : '',
        ].filter(Boolean).join('\n');
        setHistorial((h) => [...h, { rol: 'assistant', contenido: msg }]);
      }
    } catch (e: any) {
      setHistorial((h) => [...h, { rol: 'assistant', contenido: '⚠️ ' + e.message }]);
    } finally { setEnviando(false); }
  };

  if (!abierto) {
    return (
      <button
        onClick={() => setAbierto(true)}
        className="fixed bottom-6 right-6 z-30 flex items-center gap-2 px-4 py-3 rounded-full text-white text-sm font-semibold shadow-lg dv-pulse"
        style={{ background: 'var(--brand)', boxShadow: '0 8px 24px rgba(30,58,95,0.30)' }}
      >
        <span className="text-base">🪶</span>
        Davinci
        {avisos.length > 0 && (
          <span className="ml-1 text-[10px] font-bold rounded-full px-1.5 py-0.5"
            style={{ background: 'var(--accent)', color: 'white' }}>
            {avisos.length}
          </span>
        )}
      </button>
    );
  }

  return (
    <aside className="fixed top-0 right-0 h-screen w-[380px] border-l z-30 flex flex-col dv-animate-panel"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
      {/* Header */}
      <div className="px-4 py-3 border-b flex items-center gap-2" style={{ borderColor: 'var(--border)' }}>
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
          style={{ background: 'var(--brand)', color: 'white' }}>🪶</div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold leading-tight" style={{ color: 'var(--text-primary)' }}>Davinci</p>
          <p className="text-[10px] leading-tight" style={{ color: configurado ? 'var(--success)' : 'var(--warning)' }}>
            {configurado ? '● Conectado' : '○ Modo mock'}
          </p>
        </div>
        <button onClick={() => setAbierto(false)} className="w-8 h-8 rounded-lg transition-colors hover:bg-[var(--surface-muted)]"
          style={{ color: 'var(--text-muted)' }}>✕</button>
      </div>

      {/* Tabs */}
      <div className="flex border-b" style={{ borderColor: 'var(--border)' }}>
        {([
          ['chat', 'Chat', null],
          ['avisos', 'Avisos', avisos.length],
          ['reporte', 'Reporte', null],
          ['yapes', 'Yapes', null],
        ] as const).map(([id, label, badge]) => (
          <button key={id} onClick={() => setTab(id as any)}
            className="flex-1 px-2 py-2 text-[11px] font-medium transition-colors border-b-2"
            style={tab === id
              ? { color: 'var(--brand)', borderColor: 'var(--accent)' }
              : { color: 'var(--text-secondary)', borderColor: 'transparent' }}>
            {label}{badge != null && badge > 0 ? ` (${badge})` : ''}
          </button>
        ))}
      </div>

      {/* Acciones rápidas */}
      <div className="px-3 py-2 border-b flex flex-wrap gap-1.5" style={{ borderColor: 'var(--border)', background: 'var(--surface-muted)' }}>
        <button onClick={analizarConversacionActiva} disabled={!contactoActivoId || enviando}
          className="text-[11px] px-2 py-1 rounded-md border transition-colors disabled:opacity-40 hover:bg-[var(--accent-soft)]"
          style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
          🔎 Analizar conversación
        </button>
        <button onClick={sugerirEnConversacion} disabled={!contactoActivoId || enviando}
          className="text-[11px] px-2 py-1 rounded-md border transition-colors disabled:opacity-40 hover:bg-[var(--accent-soft)]"
          style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
          ✍️ Sugerir respuesta
        </button>
        <button onClick={() => imgRef.current?.click()} disabled={enviando}
          className="text-[11px] px-2 py-1 rounded-md border transition-colors disabled:opacity-40 hover:bg-[var(--accent-soft)]"
          style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
          💸 Detectar Yape
        </button>
        <input ref={imgRef} type="file" accept="image/*" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) detectarYapeImg(f); e.target.value = ''; }} />
      </div>

      {/* Tab: Chat */}
      {tab === 'chat' && (
        <>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {historial.length === 0 && !pensando && (
              <div className="text-center text-xs py-6" style={{ color: 'var(--text-muted)' }}>
                <p className="mb-3">¿En qué te ayudo? Probá una acción rápida o escribime:</p>
                <div className="flex flex-col gap-1.5 items-stretch">
                  {ACCIONES_RAPIDAS.map((a) => (
                    <button key={a.id} onClick={() => enviar(a.prompt)}
                      className="px-3 py-2 rounded-lg border text-xs text-left transition-colors hover:bg-[var(--accent-soft)]"
                      style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {historial.map((t, i) => (
              <div key={i} className={`flex ${t.rol === 'user' ? 'justify-end' : 'justify-start'} dv-animate-in`}>
                <div className="max-w-[90%] flex flex-col gap-1.5">
                  {t.rol === 'user' ? (
                    <div className="rounded-2xl px-3 py-2 text-sm"
                      style={{ background: 'var(--brand)', color: 'white' }}>
                      {t.contenido}
                    </div>
                  ) : (
                    <div className="rounded-2xl px-3 py-2"
                      style={{ background: 'var(--surface-muted)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}>
                      <MdTexto texto={t.contenido} />
                    </div>
                  )}
                  {t.borrador && (
                    <button
                      onClick={() => { onAplicarBorrador(t.borrador!); setAbierto(false); }}
                      className="self-start text-[11px] px-2.5 py-1 rounded-lg border transition-colors hover:bg-[var(--accent-soft)]"
                      style={{ borderColor: 'var(--accent)', color: 'var(--accent-hover)' }}>
                      ↗ Aplicar borrador en el chat
                    </button>
                  )}
                </div>
              </div>
            ))}
            {/* Burbuja "pensando" animada */}
            {pensando && (
              <div className="flex justify-start dv-animate-in">
                <div className="rounded-2xl px-4 py-3 flex items-center gap-1"
                  style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)' }}>
                  {[0, 1, 2].map((n) => (
                    <span key={n} className="w-1.5 h-1.5 rounded-full"
                      style={{
                        background: 'var(--text-muted)',
                        animation: `bounce 1.2s ease-in-out ${n * 0.2}s infinite`,
                      }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={finRef} />
          </div>

          <div className="p-3 border-t" style={{ borderColor: 'var(--border)' }}>
            <div className="flex items-end gap-2">
              <textarea value={texto} onChange={(e) => setTexto(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar(); } }}
                placeholder="Pregúntale a Davinci…" rows={1}
                className="dv-input resize-none !rounded-xl flex-1" />
              <button onClick={() => enviar()} disabled={enviando || !texto.trim()}
                className="dv-btn-primary !rounded-xl shrink-0 disabled:opacity-40">
                Enviar
              </button>
            </div>
          </div>
        </>
      )}

      {/* Tab: Avisos */}
      {tab === 'avisos' && (
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {avisos.length === 0 ? (
            <p className="text-center text-xs py-8" style={{ color: 'var(--text-muted)' }}>
              Sin avisos pendientes. Davinci los detecta cada vez que corre el cron.
            </p>
          ) : (
            avisos.map((a) => (
              <div key={a.id} className="dv-card p-3 dv-animate-in">
                <div className="flex items-start justify-between gap-2">
                  <span className={`dv-badge ${sevClase[a.severidad]}`}>{a.tipo}</span>
                  <button onClick={() => dismissAviso(a.id)} className="text-xs hover:underline" style={{ color: 'var(--text-muted)' }}>✕</button>
                </div>
                <p className="text-sm font-semibold mt-1.5" style={{ color: 'var(--text-primary)' }}>{a.titulo}</p>
                {a.detalle && <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{a.detalle}</p>}
              </div>
            ))
          )}
          <button onClick={async () => { await fetch('/api/agente/avisos', { method: 'POST' }); cargar(); }}
            className="w-full mt-2 dv-btn-ghost !py-1.5 text-xs">↻ Buscar avisos ahora</button>
        </div>
      )}

      {/* Tab: Reporte */}
      {tab === 'reporte' && (
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {cargandoReporte ? (
            <div className="space-y-2">
              <div className="dv-skeleton h-4 w-full" />
              <div className="dv-skeleton h-4 w-5/6" />
              <div className="dv-skeleton h-4 w-3/4" />
            </div>
          ) : !reporte ? (
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Aún no hay reporte para hoy.</p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2">
                {[
                  ['Contactos', reporte.metricas?.contactos_total],
                  ['Sin respuesta', reporte.metricas?.sin_respuesta],
                  ['Yapes hoy', reporte.metricas?.pagos_yape_dia],
                  ['Ingresos', 'S/. ' + Number(reporte.metricas?.ingresos_dia ?? 0).toFixed(2)],
                ].map(([k, v]) => (
                  <div key={k as string} className="dv-card-muted p-2">
                    <p className="dv-eyebrow text-[9px]">{k as string}</p>
                    <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{v as any}</p>
                  </div>
                ))}
              </div>
              <div className="dv-card p-3" style={{ color: 'var(--text-primary)' }}>
                <MdTexto texto={reporte.contenido} />
              </div>
            </>
          )}
          <button onClick={() => cargarReporte(true)} disabled={cargandoReporte}
            className="w-full dv-btn-ghost !py-1.5 text-xs">↻ Regenerar reporte</button>
        </div>
      )}

      {/* Tab: Yapes */}
      {tab === 'yapes' && (
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>Exportar Yapes a Excel</p>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="dv-eyebrow text-[9px]">Desde</label>
              <input type="date" value={yapeFiltro.desde}
                onChange={(e) => setYapeFiltro((v) => ({ ...v, desde: e.target.value }))}
                className="dv-input !text-xs !py-1.5 w-full mt-0.5" />
            </div>
            <div>
              <label className="dv-eyebrow text-[9px]">Hasta</label>
              <input type="date" value={yapeFiltro.hasta}
                onChange={(e) => setYapeFiltro((v) => ({ ...v, hasta: e.target.value }))}
                className="dv-input !text-xs !py-1.5 w-full mt-0.5" />
            </div>
          </div>
          <button
            disabled={exportandoYapes}
            onClick={async () => {
              setExportandoYapes(true);
              const params = new URLSearchParams();
              if (yapeFiltro.desde) params.set('desde', yapeFiltro.desde);
              if (yapeFiltro.hasta) params.set('hasta', yapeFiltro.hasta);
              const url = `/api/agente/yapes/exportar?${params}`;
              const res = await fetch(url);
              const blob = await res.blob();
              const a = document.createElement('a');
              a.href = URL.createObjectURL(blob);
              a.download = `yapes-${yapeFiltro.desde || 'todo'}_${yapeFiltro.hasta || 'todo'}.xlsx`;
              a.click();
              URL.revokeObjectURL(a.href);
              setExportandoYapes(false);
            }}
            className="w-full dv-btn-primary !py-2 text-xs disabled:opacity-40">
            {exportandoYapes ? '⏳ Generando…' : '⬇ Descargar .xlsx'}
          </button>
          <div className="border-t pt-3" style={{ borderColor: 'var(--border)' }}>
            <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Registrar Yape manualmente</p>
            <button onClick={() => yapeImgRef.current?.click()} disabled={enviando}
              className="w-full text-xs px-3 py-2 rounded-lg border transition-colors disabled:opacity-40 hover:bg-[var(--accent-soft)]"
              style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
              📸 Subir comprobante Yape (imagen)
            </button>
            <input ref={yapeImgRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) { setTab('chat'); detectarYapeImg(f); } e.target.value = ''; }} />
          </div>
        </div>
      )}
    </aside>
  );
}

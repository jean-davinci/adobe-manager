'use client';

import { useState } from 'react';
import type { PedidoTurnitin } from '@/lib/portal-types';

type Pedido = PedidoTurnitin & { nombre: string; email: string };

const ESTADO_INFO: Record<string, { label: string; color: string; bg: string }> = {
  pendiente:  { label: 'Pendiente',  color: 'var(--warning)',  bg: 'var(--warning-soft)'  },
  procesando: { label: 'Procesando', color: 'var(--brand)',    bg: 'rgba(26,43,74,0.08)' },
  completado: { label: 'Completado', color: 'var(--success)',  bg: 'var(--success-soft)'  },
  error:      { label: 'Error',      color: 'var(--danger)',   bg: 'var(--danger-soft)'   },
};

function PedidoRow({ pedido, onUpdate }: { pedido: Pedido; onUpdate: (p: Pedido) => void }) {
  const [abierto, setAbierto] = useState(false);
  const [form, setForm] = useState({
    estado: pedido.estado,
    similitud_pct: pedido.similitud_pct?.toString() ?? '',
    ia_pct: pedido.ia_pct?.toString() ?? '',
    palabras: pedido.palabras?.toString() ?? '',
    error_msg: pedido.error_msg ?? '',
  });
  const [reporte, setReporte] = useState<File | null>(null);
  const [guardando, setGuardando] = useState(false);

  const guardar = async () => {
    setGuardando(true);
    try {
      const fd = new FormData();
      fd.append('estado', form.estado);
      if (form.similitud_pct) fd.append('similitud_pct', form.similitud_pct);
      if (form.ia_pct) fd.append('ia_pct', form.ia_pct);
      if (form.palabras) fd.append('palabras', form.palabras);
      if (form.error_msg) fd.append('error_msg', form.error_msg);
      if (reporte) fd.append('reporte', reporte);

      const res = await fetch(`/api/admin/portal/pedidos/${pedido.id}`, { method: 'PATCH', body: fd });
      const data = await res.json();
      if (res.ok) {
        onUpdate({ ...pedido, ...data.pedido });
        setAbierto(false);
      }
    } finally {
      setGuardando(false);
    }
  };

  const info = ESTADO_INFO[pedido.estado] ?? ESTADO_INFO.pendiente;

  return (
    <div style={{ borderBottom: '1px solid var(--border)' }}>
      <div
        className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-black/[0.02] transition-colors"
        onClick={() => setAbierto(!abierto)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>
              {pedido.nombre_archivo}
            </p>
          </div>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {pedido.nombre} · {pedido.email} · {new Date(pedido.created_at).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {pedido.similitud_pct !== null && (
            <span className="text-xs font-bold px-2 py-0.5 rounded-full"
              style={{ background: pedido.similitud_pct <= 15 ? 'var(--success-soft)' : 'var(--warning-soft)',
                       color: pedido.similitud_pct <= 15 ? 'var(--success)' : 'var(--warning)' }}>
              {pedido.similitud_pct}%
            </span>
          )}
          <span className="text-xs px-2.5 py-1 rounded-full font-medium"
            style={{ background: info.bg, color: info.color }}>
            {info.label}
          </span>
          <a
            href={pedido.archivo_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-xs underline"
            style={{ color: 'var(--brand)' }}
          >
            Doc
          </a>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            className={`transition-transform ${abierto ? 'rotate-180' : ''}`} style={{ color: 'var(--text-muted)' }}>
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>

      {abierto && (
        <div className="px-5 pb-5 pt-1 space-y-4" style={{ background: 'var(--surface-2)' }}>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="dv-label">Estado</label>
              <select
                value={form.estado}
                onChange={(e) => setForm((v) => ({ ...v, estado: e.target.value as any }))}
                className="dv-input"
              >
                {['pendiente', 'procesando', 'completado', 'error'].map((s) => (
                  <option key={s} value={s}>{ESTADO_INFO[s]?.label ?? s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="dv-label">% Similitud</label>
              <input type="number" min="0" max="100" value={form.similitud_pct}
                onChange={(e) => setForm((v) => ({ ...v, similitud_pct: e.target.value }))}
                placeholder="Ej: 8" className="dv-input" />
            </div>
            <div>
              <label className="dv-label">% Detección IA</label>
              <input type="number" min="0" max="100" value={form.ia_pct}
                onChange={(e) => setForm((v) => ({ ...v, ia_pct: e.target.value }))}
                placeholder="Ej: 0" className="dv-input" />
            </div>
            <div>
              <label className="dv-label">Palabras</label>
              <input type="number" min="0" value={form.palabras}
                onChange={(e) => setForm((v) => ({ ...v, palabras: e.target.value }))}
                placeholder="Ej: 4500" className="dv-input" />
            </div>
          </div>
          <div>
            <label className="dv-label">Subir reporte PDF</label>
            <input type="file" accept=".pdf" className="dv-input py-2 text-sm"
              onChange={(e) => setReporte(e.target.files?.[0] ?? null)} />
          </div>
          {form.estado === 'error' && (
            <div>
              <label className="dv-label">Mensaje de error</label>
              <input type="text" value={form.error_msg}
                onChange={(e) => setForm((v) => ({ ...v, error_msg: e.target.value }))}
                placeholder="Descripción del error" className="dv-input" />
            </div>
          )}
          <div className="flex gap-2">
            <button
              onClick={guardar}
              disabled={guardando}
              className="px-4 py-2 rounded-xl text-sm font-medium text-white disabled:opacity-50"
              style={{ background: 'var(--brand)' }}
            >
              {guardando ? 'Guardando…' : 'Guardar'}
            </button>
            <button onClick={() => setAbierto(false)} className="px-4 py-2 rounded-xl text-sm"
              style={{ background: 'var(--border)', color: 'var(--text)' }}>
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PedidosAdmin({ pedidosIniciales }: { pedidosIniciales: Pedido[] }) {
  const [pedidos, setPedidos] = useState(pedidosIniciales);
  const [filtro, setFiltro] = useState<string>('todos');

  const filtrados = filtro === 'todos' ? pedidos
    : filtro === 'activos' ? pedidos.filter((p) => ['pendiente', 'procesando'].includes(p.estado))
    : pedidos.filter((p) => p.estado === filtro);

  const update = (updated: Pedido) =>
    setPedidos((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: 'todos', label: 'Todos' },
          { key: 'activos', label: 'Activos' },
          { key: 'pendiente', label: 'Pendientes' },
          { key: 'procesando', label: 'Procesando' },
          { key: 'completado', label: 'Completados' },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFiltro(f.key)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
            style={{
              background: filtro === f.key ? 'var(--brand)' : 'var(--surface)',
              color: filtro === f.key ? 'white' : 'var(--text)',
              border: '1px solid var(--border)',
            }}
          >
            {f.label}
            {f.key === 'activos' && (
              <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold bg-white/20">
                {pedidos.filter((p) => ['pendiente', 'procesando'].includes(p.estado)).length}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
        {filtrados.length === 0 ? (
          <div className="py-10 text-center" style={{ background: 'var(--surface)', color: 'var(--text-muted)' }}>
            No hay pedidos en esta categoría
          </div>
        ) : (
          filtrados.map((p) => (
            <div key={p.id} style={{ background: 'var(--surface)' }}>
              <PedidoRow pedido={p} onUpdate={update} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}

'use client';
import { useState, useEffect } from 'react';

type TipoServicio = 'TURNITIN' | 'IA_REDUCCION' | 'ASESORIA' | 'TESIS_COMPLETA';
type EstadoServicio = 'PENDIENTE' | 'EN_PROCESO' | 'REVISION' | 'COMPLETADO' | 'CANCELADO';
type Prioridad = 'ALTA' | 'NORMAL' | 'BAJA';

interface Servicio {
  id: string;
  tipo_servicio: TipoServicio;
  nombre_cliente: string;
  email?: string;
  telefono?: string;
  estado: EstadoServicio;
  monto: number;
  fecha_entrega_esperada?: string;
  descripcion?: string;
  prioridad: Prioridad;
  porcentaje_actual?: number;
  created_at: string;
}

const TIPOS = {
  TURNITIN:       { label: 'Informe Turnitin',  color: 'bg-blue-50 text-blue-700',    emoji: '📄', monto: 12   },
  IA_REDUCCION:   { label: 'Reducción IA',       color: 'bg-indigo-50 text-indigo-700', emoji: '🤖', monto: 20   },
  ASESORIA:       { label: 'Asesoría de Tesis',  color: 'bg-emerald-50 text-emerald-700',  emoji: '📚', monto: 350  },
  TESIS_COMPLETA: { label: 'Tesis Completa',     color: 'bg-orange-50 text-orange-700',emoji: '🎓', monto: 3400 },
};

const ESTADOS = {
  PENDIENTE:  { label: 'Pendiente',   color: 'bg-amber-50 text-amber-700' },
  EN_PROCESO: { label: 'En proceso',  color: 'bg-blue-50 text-blue-700'    },
  REVISION:   { label: 'En revisión', color: 'bg-indigo-50 text-indigo-700' },
  COMPLETADO: { label: 'Completado',  color: 'bg-emerald-50 text-emerald-700'  },
  CANCELADO:  { label: 'Cancelado',   color: 'bg-red-50 text-red-700'      },
};

const FORM_VACIO = {
  tipo_servicio: 'TURNITIN' as TipoServicio,
  nombre_cliente: '',
  email: '',
  telefono: '',
  monto: 12,
  prioridad: 'NORMAL' as Prioridad,
  fecha_entrega_esperada: '',
  descripcion: '',
  porcentaje_actual: 0,
};

export default function ServiciosPage() {
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [cargando, setCargando]   = useState(true);
  const [modal, setModal]         = useState(false);
  const [form, setForm]           = useState(FORM_VACIO);
  const [guardando, setGuardando] = useState(false);
  const [filtroTipo, setFiltroTipo]     = useState('TODOS');
  const [filtroEstado, setFiltroEstado] = useState('TODOS');

  useEffect(() => { cargar(); }, []);

  async function cargar() {
    setCargando(true);
    try {
      const r = await fetch('/api/servicios');
      if (r.ok) setServicios(await r.json());
    } finally { setCargando(false); }
  }

  async function guardar() {
    if (!form.nombre_cliente.trim()) return alert('El nombre del cliente es requerido');
    setGuardando(true);
    try {
      const r = await fetch('/api/servicios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          monto: parseFloat(String(form.monto)),
          porcentaje_actual: parseInt(String(form.porcentaje_actual)) || 0,
        }),
      });
      if (r.ok) { setModal(false); setForm(FORM_VACIO); await cargar(); }
      else { const e = await r.json(); alert('Error: ' + e.error); }
    } finally { setGuardando(false); }
  }

  async function cambiarEstado(id: string, estado: EstadoServicio) {
    const r = await fetch(`/api/servicios/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado }),
    });
    if (r.ok) await cargar();
  }

  const filtrados = servicios.filter(s =>
    (filtroTipo === 'TODOS' || s.tipo_servicio === filtroTipo) &&
    (filtroEstado === 'TODOS' || s.estado === filtroEstado)
  );

  const stats = {
    total:       servicios.length,
    pendientes:  servicios.filter(s => s.estado === 'PENDIENTE').length,
    enProceso:   servicios.filter(s => s.estado === 'EN_PROCESO' || s.estado === 'REVISION').length,
    completados: servicios.filter(s => s.estado === 'COMPLETADO').length,
  };

  return (
    <main className="min-h-screen" style={{ background: 'var(--background)' }}>
      {/* Header */}
      <div className="bg-surface border-b px-6 py-4 flex items-center justify-between sticky top-0 z-20"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-3.5">
          <div className="dv-icon-tile" style={{ background: 'var(--brand)', color: 'var(--accent)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <a href="/dashboard" className="dv-eyebrow hover:text-[var(--accent-hover)] transition-colors">Panel</a>
              <span className="dv-eyebrow">·</span>
              <span className="dv-eyebrow" style={{ color: 'var(--accent-hover)' }}>Servicios</span>
            </div>
            <h1 className="font-serif text-[21px] font-semibold leading-tight" style={{ color: 'var(--text-primary)' }}>Centro de Servicios</h1>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>Turnitin · IA · Asesorías · Tesis</p>
          </div>
        </div>
        <button
          onClick={() => { setForm(FORM_VACIO); setModal(true); }}
          className="dv-btn-primary"
        >
          + Nuevo servicio
        </button>
      </div>

      <div className="p-6 max-w-5xl mx-auto">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total',       value: stats.total,       color: 'var(--text-primary)' },
            { label: 'Pendientes',  value: stats.pendientes,  color: 'var(--warning)'      },
            { label: 'En proceso',  value: stats.enProceso,   color: 'var(--brand)'        },
            { label: 'Completados', value: stats.completados, color: 'var(--success)'      },
          ].map((s, i) => (
            <div key={s.label} className={`dv-card dv-hover-lift p-5 dv-animate-up dv-delay-${i + 1}`}>
              <p className="dv-eyebrow mb-2">{s.label}</p>
              <p className="text-3xl font-bold font-serif" style={{ color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filtros */}
        <div className="flex gap-2 mb-4">
          <select
            value={filtroTipo}
            onChange={e => setFiltroTipo(e.target.value)}
            className="dv-input !w-auto"
          >
            <option value="TODOS">Todos los tipos</option>
            {Object.entries(TIPOS).map(([k, v]) => (
              <option key={k} value={k}>{v.emoji} {v.label}</option>
            ))}
          </select>
          <select
            value={filtroEstado}
            onChange={e => setFiltroEstado(e.target.value)}
            className="dv-input !w-auto"
          >
            <option value="TODOS">Todos los estados</option>
            {Object.entries(ESTADOS).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        </div>

        {/* Lista */}
        {cargando ? (
          <div className="grid gap-3">
            {[0, 1, 2].map((i) => <div key={i} className="dv-skeleton h-24 w-full" />)}
          </div>
        ) : filtrados.length === 0 ? (
          <div className="dv-card text-center py-16 dv-animate-in">
            <p className="text-4xl mb-3">📋</p>
            <p className="font-medium" style={{ color: 'var(--text-secondary)' }}>No hay servicios</p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Crea el primero con el botón de arriba</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {filtrados.map(s => {
              const tipo   = TIPOS[s.tipo_servicio];
              const estado = ESTADOS[s.estado];
              const esRapido = s.tipo_servicio === 'TURNITIN' || s.tipo_servicio === 'IA_REDUCCION';
              return (
                <div key={s.id} className="dv-card dv-hover-lift p-4 dv-animate-up">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <span className="text-2xl mt-0.5">{tipo.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${tipo.color}`}>{tipo.label}</span>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${estado.color}`}>{estado.label}</span>
                          {s.prioridad === 'ALTA' && (
                            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-50 text-red-700">Alta prioridad</span>
                          )}
                        </div>
                        <p className="font-semibold text-[var(--text-primary)]">{s.nombre_cliente}</p>
                        {s.telefono && <p className="text-sm text-[var(--text-muted)] mt-0.5">{s.telefono}</p>}
                        {s.descripcion && <p className="text-sm text-[var(--text-secondary)] mt-1 line-clamp-2">{s.descripcion}</p>}
                        {!esRapido && typeof s.porcentaje_actual === 'number' && (
                          <div className="mt-2">
                            <div className="flex justify-between text-xs text-[var(--text-muted)] mb-1">
                              <span>Avance</span><span>{s.porcentaje_actual}%</span>
                            </div>
                            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--brand-soft)' }}>
                              <div
                                className="h-full rounded-full transition-all"
                                style={{ width: `${s.porcentaje_actual}%`, background: 'linear-gradient(90deg, var(--brand), var(--accent))' }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <p className="font-bold text-[var(--text-primary)]">S/. {Number(s.monto).toFixed(2)}</p>
                      {s.fecha_entrega_esperada && (
                        <p className="text-xs text-[var(--text-muted)]">
                          📅 {new Date(s.fecha_entrega_esperada).toLocaleDateString('es-PE')}
                        </p>
                      )}
                      <div className="flex gap-1.5 mt-1">
                        {s.estado !== 'COMPLETADO' && s.estado !== 'CANCELADO' && (
                          <select
                            value={s.estado}
                            onChange={e => cambiarEstado(s.id, e.target.value as EstadoServicio)}
                            className="text-xs border border-[var(--border)] rounded-lg px-2 py-1 bg-[var(--surface)] cursor-pointer"
                          >
                            {Object.entries(ESTADOS).map(([k, v]) => (
                              <option key={k} value={k}>{v.label}</option>
                            ))}
                          </select>
                        )}
                        {s.telefono && (
                          <a
                            href={`https://wa.me/${s.telefono.replace(/\D/g, '')}?text=${encodeURIComponent(`Hola ${s.nombre_cliente}, tengo una actualización de tu servicio ${tipo.label}.`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-lg hover:bg-emerald-100 transition-colors font-medium"
                          >
                            💬 WA
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal overlay */}
      {modal && (
        <div
          className="dv-modal-backdrop"
          onClick={e => { if (e.target === e.currentTarget) setModal(false); }}
        >
          <div className="dv-modal max-w-lg max-h-[90vh] overflow-y-auto">
            {/* Modal header */}
            <div className="sticky top-0 bg-[var(--surface)] border-b border-[var(--border)] px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h2 className="font-bold text-[var(--text-primary)] text-lg">Nuevo servicio</h2>
              <button
                onClick={() => setModal(false)}
                className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] text-xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--surface-muted)]"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Tipo de servicio */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Tipo de servicio</label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(TIPOS).map(([k, v]) => (
                    <button
                      key={k}
                      onClick={() => setForm(p => ({ ...p, tipo_servicio: k as TipoServicio, monto: v.monto }))}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${
                        form.tipo_servicio === k ? 'border-[var(--brand)] bg-[var(--surface-muted)]' : 'border-[var(--border)] hover:border-[var(--border-strong)]'
                      }`}
                    >
                      <div className="text-xl mb-1">{v.emoji}</div>
                      <div className="text-xs font-semibold text-[var(--text-primary)]">{v.label}</div>
                      <div className="text-xs text-[var(--text-muted)]">S/. {v.monto}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Nombre + WhatsApp */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Nombre cliente *</label>
                  <input
                    type="text"
                    value={form.nombre_cliente}
                    onChange={e => setForm(p => ({ ...p, nombre_cliente: e.target.value }))}
                    placeholder="Ej: María García"
                    className="w-full border border-[var(--border)] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-soft)]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">WhatsApp</label>
                  <input
                    type="text"
                    value={form.telefono}
                    onChange={e => setForm(p => ({ ...p, telefono: e.target.value }))}
                    placeholder="+51 999 999 999"
                    className="w-full border border-[var(--border)] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-soft)]"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Email (opcional)</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  placeholder="cliente@email.com"
                  className="w-full border border-[var(--border)] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-soft)]"
                />
              </div>

              {/* Monto + Prioridad */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Monto S/.</label>
                  <input
                    type="number"
                    value={form.monto}
                    onChange={e => setForm(p => ({ ...p, monto: parseFloat(e.target.value) }))}
                    className="w-full border border-[var(--border)] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-soft)]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Prioridad</label>
                  <select
                    value={form.prioridad}
                    onChange={e => setForm(p => ({ ...p, prioridad: e.target.value as Prioridad }))}
                    className="w-full border border-[var(--border)] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-soft)] bg-[var(--surface)]"
                  >
                    <option value="ALTA">🔴 Alta</option>
                    <option value="NORMAL">🟡 Normal</option>
                    <option value="BAJA">🟢 Baja</option>
                  </select>
                </div>
              </div>

              {/* Fecha + % Avance (solo tesis y asesoría) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Fecha de entrega</label>
                  <input
                    type="date"
                    value={form.fecha_entrega_esperada}
                    onChange={e => setForm(p => ({ ...p, fecha_entrega_esperada: e.target.value }))}
                    className="w-full border border-[var(--border)] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-soft)]"
                  />
                </div>
                {(form.tipo_servicio === 'TESIS_COMPLETA' || form.tipo_servicio === 'ASESORIA') && (
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">% Avance inicial</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={form.porcentaje_actual}
                      onChange={e => setForm(p => ({ ...p, porcentaje_actual: parseInt(e.target.value) }))}
                      className="w-full border border-[var(--border)] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-soft)]"
                    />
                  </div>
                )}
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                  {form.tipo_servicio === 'TURNITIN'      ? 'Notas del documento'      :
                   form.tipo_servicio === 'IA_REDUCCION'  ? 'Notas sobre el documento' :
                   form.tipo_servicio === 'ASESORIA'      ? 'Descripción de la asesoría' :
                   'Descripción del proyecto'}
                </label>
                <textarea
                  value={form.descripcion}
                  onChange={e => setForm(p => ({ ...p, descripcion: e.target.value }))}
                  rows={3}
                  placeholder={
                    form.tipo_servicio === 'TURNITIN'      ? 'Ej: Tesis de comunicación, 80 páginas...' :
                    form.tipo_servicio === 'IA_REDUCCION'  ? 'Ej: Índice IA actual 45%, bajar a 15%...' :
                    form.tipo_servicio === 'ASESORIA'      ? 'Ej: Tesis de arquitectura, capítulo 3...' :
                    'Ej: Tesis de comunicación digital, USAT...'
                  }
                  className="w-full border border-[var(--border)] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-soft)] resize-none"
                />
              </div>
            </div>

            {/* Modal footer */}
            <div className="sticky bottom-0 bg-[var(--surface)] border-t border-[var(--border)] px-6 py-4 flex gap-3 rounded-b-2xl">
              <button
                onClick={() => setModal(false)}
                className="flex-1 border border-[var(--border)] text-[var(--text-secondary)] py-2.5 rounded-xl text-sm font-medium hover:bg-[var(--surface-muted)] transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={guardar}
                disabled={guardando || !form.nombre_cliente.trim()}
                className="flex-1 dv-btn-primary !py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {guardando ? 'Guardando...' : 'Crear servicio'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
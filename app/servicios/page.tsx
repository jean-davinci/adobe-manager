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
  TURNITIN:       { label: 'Informe Turnitin',  color: 'bg-blue-100 text-blue-700',    emoji: '📄', monto: 12   },
  IA_REDUCCION:   { label: 'Reducción IA',       color: 'bg-purple-100 text-purple-700', emoji: '🤖', monto: 20   },
  ASESORIA:       { label: 'Asesoría de Tesis',  color: 'bg-green-100 text-green-700',  emoji: '📚', monto: 350  },
  TESIS_COMPLETA: { label: 'Tesis Completa',     color: 'bg-orange-100 text-orange-700',emoji: '🎓', monto: 3400 },
};

const ESTADOS = {
  PENDIENTE:  { label: 'Pendiente',   color: 'bg-yellow-100 text-yellow-700' },
  EN_PROCESO: { label: 'En proceso',  color: 'bg-blue-100 text-blue-700'    },
  REVISION:   { label: 'En revisión', color: 'bg-purple-100 text-purple-700' },
  COMPLETADO: { label: 'Completado',  color: 'bg-green-100 text-green-700'  },
  CANCELADO:  { label: 'Cancelado',   color: 'bg-red-100 text-red-700'      },
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
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
            <a href="/" className="hover:text-gray-700 transition-colors">Adobe Manager</a>
            <span>/</span>
            <span className="text-gray-700 font-medium">Centro de Servicios</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900">Centro de Servicios</h1>
          <p className="text-xs text-gray-400 mt-0.5">Turnitin · IA · Asesorías · Tesis</p>
        </div>
        <button
          onClick={() => { setForm(FORM_VACIO); setModal(true); }}
          className="bg-gray-900 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-700 transition-colors"
        >
          + Nuevo servicio
        </button>
      </div>

      <div className="p-6 max-w-5xl mx-auto">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: 'TOTAL',       value: stats.total,       color: 'text-gray-900'   },
            { label: 'PENDIENTES',  value: stats.pendientes,  color: 'text-yellow-600' },
            { label: 'EN PROCESO',  value: stats.enProceso,   color: 'text-blue-600'   },
            { label: 'COMPLETADOS', value: stats.completados, color: 'text-green-600'  },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl p-5 border border-gray-100">
              <p className="text-xs text-gray-400 font-medium tracking-wider mb-2">{s.label}</p>
              <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filtros */}
        <div className="flex gap-2 mb-4">
          <select
            value={filtroTipo}
            onChange={e => setFiltroTipo(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none"
          >
            <option value="TODOS">Todos los tipos</option>
            {Object.entries(TIPOS).map(([k, v]) => (
              <option key={k} value={k}>{v.emoji} {v.label}</option>
            ))}
          </select>
          <select
            value={filtroEstado}
            onChange={e => setFiltroEstado(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none"
          >
            <option value="TODOS">Todos los estados</option>
            {Object.entries(ESTADOS).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        </div>

        {/* Lista */}
        {cargando ? (
          <div className="text-center py-12 text-gray-400">Cargando...</div>
        ) : filtrados.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">📋</p>
            <p className="text-gray-500 font-medium">No hay servicios</p>
            <p className="text-gray-400 text-sm mt-1">Crea el primero con el botón de arriba</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {filtrados.map(s => {
              const tipo   = TIPOS[s.tipo_servicio];
              const estado = ESTADOS[s.estado];
              const esRapido = s.tipo_servicio === 'TURNITIN' || s.tipo_servicio === 'IA_REDUCCION';
              return (
                <div key={s.id} className="bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-sm transition-all">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <span className="text-2xl mt-0.5">{tipo.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${tipo.color}`}>{tipo.label}</span>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${estado.color}`}>{estado.label}</span>
                          {s.prioridad === 'ALTA' && (
                            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-700">Alta prioridad</span>
                          )}
                        </div>
                        <p className="font-semibold text-gray-900">{s.nombre_cliente}</p>
                        {s.telefono && <p className="text-sm text-gray-400 mt-0.5">{s.telefono}</p>}
                        {s.descripcion && <p className="text-sm text-gray-500 mt-1 line-clamp-2">{s.descripcion}</p>}
                        {!esRapido && typeof s.porcentaje_actual === 'number' && (
                          <div className="mt-2">
                            <div className="flex justify-between text-xs text-gray-400 mb-1">
                              <span>Avance</span><span>{s.porcentaje_actual}%</span>
                            </div>
                            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-blue-500 rounded-full transition-all"
                                style={{ width: `${s.porcentaje_actual}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <p className="font-bold text-gray-900">S/. {Number(s.monto).toFixed(2)}</p>
                      {s.fecha_entrega_esperada && (
                        <p className="text-xs text-gray-400">
                          📅 {new Date(s.fecha_entrega_esperada).toLocaleDateString('es-PE')}
                        </p>
                      )}
                      <div className="flex gap-1.5 mt-1">
                        {s.estado !== 'COMPLETADO' && s.estado !== 'CANCELADO' && (
                          <select
                            value={s.estado}
                            onChange={e => cambiarEstado(s.id, e.target.value as EstadoServicio)}
                            className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white cursor-pointer"
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
                            className="text-xs bg-green-50 text-green-700 border border-green-200 px-2.5 py-1 rounded-lg hover:bg-green-100 transition-colors font-medium"
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
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={e => { if (e.target === e.currentTarget) setModal(false); }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            {/* Modal header */}
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h2 className="font-bold text-gray-900 text-lg">Nuevo servicio</h2>
              <button
                onClick={() => setModal(false)}
                className="text-gray-400 hover:text-gray-600 text-xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Tipo de servicio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de servicio</label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(TIPOS).map(([k, v]) => (
                    <button
                      key={k}
                      onClick={() => setForm(p => ({ ...p, tipo_servicio: k as TipoServicio, monto: v.monto }))}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${
                        form.tipo_servicio === k ? 'border-gray-900 bg-gray-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-xl mb-1">{v.emoji}</div>
                      <div className="text-xs font-semibold text-gray-800">{v.label}</div>
                      <div className="text-xs text-gray-400">S/. {v.monto}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Nombre + WhatsApp */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre cliente *</label>
                  <input
                    type="text"
                    value={form.nombre_cliente}
                    onChange={e => setForm(p => ({ ...p, nombre_cliente: e.target.value }))}
                    placeholder="Ej: María García"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
                  <input
                    type="text"
                    value={form.telefono}
                    onChange={e => setForm(p => ({ ...p, telefono: e.target.value }))}
                    placeholder="+51 999 999 999"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email (opcional)</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  placeholder="cliente@email.com"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
                />
              </div>

              {/* Monto + Prioridad */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Monto S/.</label>
                  <input
                    type="number"
                    value={form.monto}
                    onChange={e => setForm(p => ({ ...p, monto: parseFloat(e.target.value) }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prioridad</label>
                  <select
                    value={form.prioridad}
                    onChange={e => setForm(p => ({ ...p, prioridad: e.target.value as Prioridad }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 bg-white"
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de entrega</label>
                  <input
                    type="date"
                    value={form.fecha_entrega_esperada}
                    onChange={e => setForm(p => ({ ...p, fecha_entrega_esperada: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
                  />
                </div>
                {(form.tipo_servicio === 'TESIS_COMPLETA' || form.tipo_servicio === 'ASESORIA') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">% Avance inicial</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={form.porcentaje_actual}
                      onChange={e => setForm(p => ({ ...p, porcentaje_actual: parseInt(e.target.value) }))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
                    />
                  </div>
                )}
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
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
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 resize-none"
                />
              </div>
            </div>

            {/* Modal footer */}
            <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex gap-3 rounded-b-2xl">
              <button
                onClick={() => setModal(false)}
                className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={guardar}
                disabled={guardando || !form.nombre_cliente.trim()}
                className="flex-1 bg-gray-900 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
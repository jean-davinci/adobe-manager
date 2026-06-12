'use client';

import { useEffect, useState, useCallback } from 'react';

type Asesoria = {
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
};

const ESTADOS: Record<Asesoria['estado'], { label: string; badge: string }> = {
  RESERVADA: { label: 'Reservada', badge: 'dv-badge-brand' },
  COMPLETADA: { label: 'Completada', badge: 'dv-badge-success' },
  CANCELADA: { label: 'Cancelada', badge: 'dv-badge-muted' },
};

const fmtFecha = (f: string) =>
  new Date(f.slice(0, 10) + 'T12:00:00').toLocaleDateString('es-PE', { weekday: 'short', day: 'numeric', month: 'short' });

export default function AsesoriasClient() {
  const [lista, setLista] = useState<Asesoria[]>([]);
  const [cargando, setCargando] = useState(true);
  const [soloProximas, setSoloProximas] = useState(true);

  const cargar = useCallback(async () => {
    setCargando(true);
    const params = soloProximas ? `?desde=${new Date().toISOString().slice(0, 10)}` : '';
    const r = await fetch('/api/asesorias' + params).then((x) => x.json());
    setLista(Array.isArray(r) ? r : []);
    setCargando(false);
  }, [soloProximas]);

  useEffect(() => { cargar(); }, [cargar]);

  const cancelar = async (a: Asesoria) => {
    if (!confirm(`¿Cancelar la asesoría de ${a.nombre} (${fmtFecha(a.fecha)} ${a.hora_inicio.slice(0, 5)})?`)) return;
    await fetch(`/api/asesorias/${a.id}`, { method: 'DELETE' });
    cargar();
  };

  const completar = async (a: Asesoria) => {
    await fetch(`/api/asesorias/${a.id}`, { method: 'PATCH' });
    cargar();
  };

  const hoy = new Date().toISOString().slice(0, 10);
  const deHoy = lista.filter((a) => a.fecha.slice(0, 10) === hoy && a.estado === 'RESERVADA');
  const reservadas = lista.filter((a) => a.estado === 'RESERVADA').length;

  return (
    <div className="space-y-6">
      {/* Resumen */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { label: 'Hoy', valor: deHoy.length },
          { label: 'Reservadas', valor: reservadas },
          { label: 'Total listadas', valor: lista.length },
        ].map((k, i) => (
          <div key={k.label} className={`dv-card p-4 dv-animate-up dv-delay-${i + 1}`}>
            <p className="dv-eyebrow mb-1">{k.label}</p>
            <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{k.valor}</p>
          </div>
        ))}
      </div>

      {/* Lista */}
      <div className="dv-card overflow-hidden dv-animate-up dv-delay-2">
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Agenda</h2>
          <label className="flex items-center gap-2 text-xs cursor-pointer" style={{ color: 'var(--text-secondary)' }}>
            <input type="checkbox" checked={soloProximas} onChange={(e) => setSoloProximas(e.target.checked)} />
            Solo próximas
          </label>
        </div>

        {cargando ? (
          <div className="p-4 space-y-3">
            {[0, 1, 2].map((i) => <div key={i} className="dv-skeleton h-12 w-full" />)}
          </div>
        ) : lista.length === 0 ? (
          <div className="py-14 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
            Sin asesorías {soloProximas ? 'próximas' : 'registradas'}. Las reservas llegan desde la landing.
          </div>
        ) : (
          <table className="dv-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Hora</th>
                <th>Cliente</th>
                <th>Contacto</th>
                <th>Estado</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {lista.map((a) => (
                <tr key={a.id}>
                  <td className="whitespace-nowrap font-medium">{fmtFecha(a.fecha)}</td>
                  <td className="whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>
                    {a.hora_inicio.slice(0, 5)} · {a.duracion_min}min
                  </td>
                  <td>
                    <div className="font-medium">{a.nombre}</div>
                    {a.notas && <div className="text-xs truncate max-w-[200px]" style={{ color: 'var(--text-muted)' }}>{a.notas}</div>}
                  </td>
                  <td className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {a.telefono && (
                      <a href={`https://wa.me/${a.telefono.replace(/\D/g, '')}`} target="_blank" className="hover:underline block" style={{ color: '#34D399' }}>
                        📱 {a.telefono}
                      </a>
                    )}
                    {a.email && <span className="block">📧 {a.email}</span>}
                    {!a.telefono && !a.email && '—'}
                  </td>
                  <td>
                    <span className={`dv-badge ${ESTADOS[a.estado].badge}`}>{ESTADOS[a.estado].label}</span>
                    {a.estado === 'RESERVADA' && a.recordatorio_enviado && (
                      <span className="block text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>⏰ recordada</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {a.estado === 'RESERVADA' && (
                      <div className="flex items-center gap-3 justify-end">
                        <button onClick={() => completar(a)} className="text-xs hover:underline font-medium" style={{ color: 'var(--success)' }}>
                          ✓ Completada
                        </button>
                        <button onClick={() => cancelar(a)} className="text-xs hover:underline" style={{ color: 'var(--danger)' }}>
                          Cancelar
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
        Las reservas crean un evento en Google Calendar (cuenta davincilabs.peru@gmail.com) y el cron envía un
        recordatorio por WhatsApp 1 hora antes. En MOCK_MODE todo se simula en consola.
      </p>
    </div>
  );
}

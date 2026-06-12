'use client';
import { useEffect, useState } from 'react';
import { ClienteAdobe } from '@/lib/supabase';

export default function TablaClientes({ refresh, onSeleccionar }: { refresh: number, onSeleccionar: (c: any) => void }) {
  const [clientes, setClientes] = useState<ClienteAdobe[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<'todos' | 'activos' | 'inactivos'>('activos');

  useEffect(() => {
    fetch('/api/clientes')
      .then(r => r.json())
      .then(data => { setClientes(data); setLoading(false); });
  }, [refresh]);

  const calcularDias = (fecha: string) => {
    const diff = new Date(fecha).getTime() - new Date().getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

  const clientesFiltrados = clientes.filter(c => {
    if (filtro === 'activos') return c.estado === 'ACTIVO';
    if (filtro === 'inactivos') return ['INACTIVO', 'CANCELADO'].includes(c.estado); // eslint-disable-line
    return true;
  });

  if (loading) return (
    <div className="dv-card p-4 space-y-3">
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center gap-4">
          <div className="dv-skeleton h-9 w-16" />
          <div className="dv-skeleton h-9 w-1/3" />
          <div className="dv-skeleton h-9 flex-1" />
        </div>
      ))}
    </div>
  );

  return (
    <div className="dv-animate-up dv-delay-2">
      {/* Filtros */}
      <div className="flex gap-2 mb-4">
        {[
          { key: 'activos', label: 'Activos' },
          { key: 'inactivos', label: 'Inactivos' },
          { key: 'todos', label: 'Todos' },
        ].map(f => (
          <button key={f.key}
            onClick={() => setFiltro(f.key as any)}
            className="px-4 py-1.5 rounded-full text-sm font-medium transition-all"
            style={filtro === f.key
              ? { background: 'var(--brand)', color: 'white' }
              : { background: 'var(--brand-soft)', color: 'var(--text-secondary)' }}>
            {f.label}
            <span className="ml-2 text-xs px-1.5 py-0.5 rounded-full"
              style={filtro === f.key ? { background: 'rgba(255,255,255,0.2)' } : { background: 'var(--surface)' }}>
              {f.key === 'activos' ? clientes.filter(c => c.estado === 'ACTIVO').length :
               f.key === 'inactivos' ? clientes.filter(c => ["INACTIVO","CANCELADO"].includes(c.estado)).length :
               clientes.length}
            </span>
          </button>
        ))}
      </div>

      {clientesFiltrados.length === 0 ? (
        <div className="dv-card text-center py-16 text-sm" style={{ color: 'var(--text-muted)' }}>
          {filtro === 'inactivos' ? 'No hay clientes inactivos' : 'No hay clientes aún'}
        </div>
      ) : (
        <div className="dv-card overflow-hidden">
          <table className="dv-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Cliente</th>
                <th>Teléfono</th>
                <th>Plan</th>
                <th style={{ textAlign: 'right' }}>Costo</th>
                <th>Vence</th>
                <th style={{ textAlign: 'center' }}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {clientesFiltrados.map((c) => {
                const dias = calcularDias(c.fecha_renovacion_proxima);
                const esInactivo = ['INACTIVO', 'CANCELADO'].includes(c.estado); // eslint-disable-line
                return (
                  <tr key={c.id}
                    onClick={() => onSeleccionar(c)}
                    className="cursor-pointer">
                    <td>
                      <span className="font-mono text-xs font-semibold" style={{ color: 'var(--accent-hover)' }}>{c.numero_pedido}</span>
                    </td>
                    <td>
                      <div className="font-medium text-sm" style={{ color: esInactivo ? 'var(--text-muted)' : 'var(--text-primary)' }}>
                        {c.nombre_cliente}
                      </div>
                      <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{c.email_cliente}</div>
                    </td>
                    <td className="text-sm" style={{ color: 'var(--text-secondary)' }}>{c.telefono}</td>
                    <td>
                      <span className="dv-badge dv-badge-brand">
                        {c.plan_duracion === 12 ? '12 meses' : `${c.plan_duracion} mes`}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>S/. {Number(c.costo_servicio).toFixed(2)}</span>
                    </td>
                    <td>
                      {esInactivo ? (
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>—</span>
                      ) : (
                        <div>
                          <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                            {new Date(c.fecha_renovacion_proxima).toLocaleDateString('es-PE')}
                          </div>
                          <div className="text-xs font-medium mt-0.5" style={{
                            color: dias <= 0 ? 'var(--danger)' :
                                   dias <= 5 ? 'var(--warning)' :
                                   dias <= 15 ? 'var(--accent-hover)' :
                                   'var(--success)',
                          }}>
                            {dias <= 0 ? 'Vencido' : `${dias}d restantes`}
                          </div>
                        </div>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {esInactivo ? (
                        <span className="dv-badge dv-badge-muted">Inactivo</span>
                      ) : dias <= 0 ? (
                        <span className="dv-badge dv-badge-danger">Vencido</span>
                      ) : dias <= 5 ? (
                        <span className="dv-badge dv-badge-warning">Urgente</span>
                      ) : dias <= 15 ? (
                        <span className="dv-badge dv-badge-accent">Por vencer</span>
                      ) : (
                        <span className="dv-badge dv-badge-success">Activo</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

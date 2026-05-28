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
    <div className="flex items-center justify-center py-20">
      <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
    </div>
  );

  return (
    <div>
      {/* Filtros */}
      <div className="flex gap-2 mb-4">
        {[
          { key: 'activos', label: 'Activos' },
          { key: 'inactivos', label: 'Inactivos' },
          { key: 'todos', label: 'Todos' },
        ].map(f => (
          <button key={f.key}
            onClick={() => setFiltro(f.key as any)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              filtro === f.key
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}>
            {f.label}
            <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${
              filtro === f.key ? 'bg-white/20' : 'bg-gray-200'
            }`}>
              {f.key === 'activos' ? clientes.filter(c => c.estado === 'ACTIVO').length :
               f.key === 'inactivos' ? clientes.filter(c => ["INACTIVO","CANCELADO"].includes(c.estado)).length :
               clientes.length}
            </span>
          </button>
        ))}
      </div>

      {clientesFiltrados.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm">
          {filtro === 'inactivos' ? 'No hay clientes inactivos' : 'No hay clientes aún'}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-50">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">#</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Cliente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Teléfono</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Plan</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Costo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Vence</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {clientesFiltrados.map((c) => {
                const dias = calcularDias(c.fecha_renovacion_proxima);
                const esInactivo = ['INACTIVO', 'CANCELADO'].includes(c.estado); // eslint-disable-line
                return (
                  <tr key={c.id}
                    onClick={() => onSeleccionar(c)}
                    className="hover:bg-gray-50 transition-colors cursor-pointer group">
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs text-blue-500 font-medium">{c.numero_pedido}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`font-medium text-sm ${esInactivo ? 'text-gray-400' : 'text-gray-900'}`}>
                        {c.nombre_cliente}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">{c.email_cliente}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{c.telefono}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                        {c.plan_duracion === 12 ? '12 meses' : `${c.plan_duracion} mes`}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-semibold text-gray-900">S/. {Number(c.costo_servicio).toFixed(2)}</span>
                    </td>
                    <td className="px-6 py-4">
                      {esInactivo ? (
                        <span className="text-xs text-gray-400">—</span>
                      ) : (
                        <div>
                          <div className="text-xs text-gray-500">
                            {new Date(c.fecha_renovacion_proxima).toLocaleDateString('es-PE')}
                          </div>
                          <div className={`text-xs font-medium mt-0.5 ${
                            dias <= 0 ? 'text-red-500' :
                            dias <= 5 ? 'text-orange-500' :
                            dias <= 15 ? 'text-yellow-600' :
                            'text-green-500'
                          }`}>
                            {dias <= 0 ? 'Vencido' : `${dias}d restantes`}
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {esInactivo ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                          Inactivo
                        </span>
                      ) : dias <= 0 ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-600">
                          Vencido
                        </span>
                      ) : dias <= 5 ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-50 text-orange-600">
                          Urgente
                        </span>
                      ) : dias <= 15 ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-50 text-yellow-700">
                          Por vencer
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-600">
                          Activo
                        </span>
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

'use client';
import { useEffect, useState } from 'react';

export default function Metricas({ refresh }: { refresh: number }) {
  const [stats, setStats] = useState({
    total: 0, activos: 0, inactivos: 0, vencenPronto: 0, ingresosMes: 0,
  });

  useEffect(() => {
    fetch('/api/clientes')
      .then(r => r.json())
      .then(clientes => {
        const hoy = new Date();
        let vencenPronto = 0, ingresosMes = 0, inactivos = 0;
        clientes.forEach((c: any) => {
          if (c.estado === 'INACTIVO' || c.estado === 'CANCELADO') { inactivos++; return; }
          const dias = Math.floor((new Date(c.fecha_renovacion_proxima).getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
          if (dias <= 15 && dias >= 0) vencenPronto++;
          ingresosMes += Number(c.costo_servicio);
        });
        setStats({
          total: clientes.length,
          activos: clientes.filter((c: any) => c.estado === 'ACTIVO').length,
          inactivos,
          vencenPronto,
          ingresosMes,
        });
      });
  }, [refresh]);

  const cards = [
    { label: 'Clientes activos', value: stats.activos, sub: `de ${stats.total} totales`, color: 'text-gray-900', bg: 'bg-white' },
    { label: 'Ingresos estimados', value: `S/. ${stats.ingresosMes.toFixed(2)}`, sub: 'este mes', color: 'text-green-600', bg: 'bg-white' },
    { label: 'Por vencer', value: stats.vencenPronto, sub: 'en los próximos 15 días', color: stats.vencenPronto > 0 ? 'text-orange-500' : 'text-gray-900', bg: 'bg-white' },
    { label: 'Inactivos', value: stats.inactivos, sub: 'clientes cancelados', color: stats.inactivos > 0 ? 'text-red-400' : 'text-gray-400', bg: 'bg-white' },
  ];

  return (
    <div className="grid grid-cols-4 gap-4 mb-8">
      {cards.map((card) => (
        <div key={card.label} className={`${card.bg} rounded-2xl border border-gray-100 p-5 shadow-sm`}>
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-2">{card.label}</p>
          <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
          <p className="text-xs text-gray-400 mt-1">{card.sub}</p>
        </div>
      ))}
    </div>
  );
}

'use client';
import { useEffect, useState } from 'react';

export default function Metricas({ refresh }: { refresh: number }) {
  const [stats, setStats] = useState<{
    total: number; activos: number; inactivos: number; vencenPronto: number; ingresosMes: number;
  } | null>(null);

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

  const cards = stats == null ? null : [
    { label: 'Clientes activos', value: stats.activos, sub: `de ${stats.total} totales`, color: 'var(--text-primary)' },
    { label: 'Ingresos estimados', value: `S/. ${stats.ingresosMes.toFixed(2)}`, sub: 'este mes', color: 'var(--success)' },
    { label: 'Por vencer', value: stats.vencenPronto, sub: 'en los próximos 15 días', color: stats.vencenPronto > 0 ? 'var(--warning)' : 'var(--text-primary)' },
    { label: 'Inactivos', value: stats.inactivos, sub: 'clientes cancelados', color: stats.inactivos > 0 ? 'var(--danger)' : 'var(--text-muted)' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {cards == null
        ? [0, 1, 2, 3].map((i) => (
            <div key={i} className="dv-card p-5">
              <div className="dv-skeleton h-3 w-24 mb-3" />
              <div className="dv-skeleton h-8 w-20" />
            </div>
          ))
        : cards.map((card, i) => (
            <div key={card.label} className={`dv-card dv-hover-lift p-5 dv-animate-up dv-delay-${i + 1}`}>
              <p className="dv-eyebrow mb-2">{card.label}</p>
              <p className="text-2xl font-bold font-serif" style={{ color: card.color }}>{card.value}</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{card.sub}</p>
            </div>
          ))}
    </div>
  );
}

'use client';

import { useState } from 'react';
import type { CompraCreditos } from '@/lib/portal-types';
import { PAQUETES } from '@/lib/portal-config';

type Compra = CompraCreditos & { nombre: string; email: string };

const ESTADO: Record<string, { label: string; color: string; bg: string }> = {
  pendiente:  { label: 'Pendiente',   color: 'var(--warning)',  bg: 'var(--warning-soft)'  },
  confirmado: { label: 'Confirmado',  color: 'var(--success)',  bg: 'var(--success-soft)'  },
  rechazado:  { label: 'Rechazado',   color: 'var(--danger)',   bg: 'var(--danger-soft)'   },
};

function CompraRow({ compra, onUpdate }: { compra: Compra; onUpdate: (c: Compra) => void }) {
  const [notas, setNotas] = useState('');
  const [accionando, setAccionando] = useState(false);

  const accion = async (tipo: 'confirmar' | 'rechazar') => {
    setAccionando(true);
    try {
      const res = await fetch(`/api/admin/portal/compras/${compra.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accion: tipo, notas: notas || null }),
      });
      if (res.ok) {
        onUpdate({ ...compra, estado: tipo === 'confirmar' ? 'confirmado' : 'rechazado', notas });
      }
    } finally {
      setAccionando(false);
    }
  };

  const p = PAQUETES[compra.paquete];
  const badge = ESTADO[compra.estado] ?? ESTADO.pendiente;

  return (
    <div className="px-5 py-4 space-y-3" style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>
            {compra.nombre} — {p?.label ?? compra.paquete} ({compra.cantidad} crédito{Number(compra.cantidad) !== 1 ? 's' : ''})
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {compra.email} · {new Date(compra.created_at).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </p>
          {compra.referencia && (
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Ref: {compra.referencia}</p>
          )}
          {compra.notas && (
            <p className="text-xs mt-0.5 italic" style={{ color: 'var(--text-muted)' }}>{compra.notas}</p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="font-bold text-sm" style={{ color: 'var(--text)' }}>S/. {compra.monto}</span>
          <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: badge.bg, color: badge.color }}>
            {badge.label}
          </span>
        </div>
      </div>

      {compra.imagen_url && (
        <a href={compra.imagen_url} target="_blank" rel="noopener noreferrer">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={compra.imagen_url} alt="voucher" className="max-h-24 rounded-lg object-contain" />
        </a>
      )}

      {compra.estado === 'pendiente' && (
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            placeholder="Nota opcional…"
            className="dv-input flex-1 text-xs py-1.5"
          />
          <button
            onClick={() => accion('confirmar')}
            disabled={accionando}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-white disabled:opacity-50"
            style={{ background: 'var(--success)' }}
          >
            ✓ Confirmar
          </button>
          <button
            onClick={() => accion('rechazar')}
            disabled={accionando}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-white disabled:opacity-50"
            style={{ background: 'var(--danger)' }}
          >
            ✗ Rechazar
          </button>
        </div>
      )}
    </div>
  );
}

export default function ComprasAdmin({ comprasIniciales }: { comprasIniciales: Compra[] }) {
  const [compras, setCompras] = useState(comprasIniciales);
  const [filtro, setFiltro] = useState('pendiente');

  const filtradas = filtro === 'todos' ? compras : compras.filter((c) => c.estado === filtro);
  const update = (updated: Compra) =>
    setCompras((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {['pendiente', 'confirmado', 'rechazado', 'todos'].map((f) => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
            style={{
              background: filtro === f ? 'var(--brand)' : 'var(--surface)',
              color: filtro === f ? 'white' : 'var(--text)',
              border: '1px solid var(--border)',
            }}
          >
            {f === 'pendiente' ? 'Pendientes' : f === 'confirmado' ? 'Confirmados' : f === 'rechazado' ? 'Rechazados' : 'Todos'}
            {f === 'pendiente' && (
              <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold bg-white/20">
                {compras.filter((c) => c.estado === 'pendiente').length}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
        {filtradas.length === 0 ? (
          <div className="py-10 text-center" style={{ background: 'var(--surface)', color: 'var(--text-muted)' }}>
            No hay compras en esta categoría
          </div>
        ) : (
          filtradas.map((c) => <CompraRow key={c.id} compra={c} onUpdate={update} />)
        )}
      </div>
    </div>
  );
}

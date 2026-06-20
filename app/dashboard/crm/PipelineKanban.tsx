'use client';

import { useEffect, useState, useCallback } from 'react';

type ContactoCard = {
  id: string;
  nombre: string;
  telefono: string;
  email: string | null;
  etiquetas: string[];
  etapa: string;
  ultimo_mensaje: string | null;
  ultimo_at: string | null;
  no_leidos: number;
};

const ETAPAS = ['Nuevo', 'Contactado', 'En proceso', 'Pagado', 'Completado'] as const;
type Etapa = (typeof ETAPAS)[number];

const COLOR_ETAPA: Record<Etapa, string> = {
  'Nuevo': 'var(--accent)',
  'Contactado': 'var(--brand)',
  'En proceso': 'var(--warning)',
  'Pagado': 'var(--success)',
  'Completado': 'var(--text-muted)',
};

const iniciales = (n: string) => n.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
const hora = (s: string | null) => s ? new Date(s).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' }) : '—';

export default function PipelineKanban({ onSeleccionar }: { onSeleccionar?: (id: string) => void }) {
  const [contactos, setContactos] = useState<ContactoCard[]>([]);
  const [cargando, setCargando] = useState(true);
  const [arrastrado, setArrastrado] = useState<string | null>(null);
  const [sobreEtapa, setSobreEtapa] = useState<Etapa | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    const r = await fetch('/api/crm/contactos').then((x) => x.json());
    setContactos(Array.isArray(r) ? r : []);
    setCargando(false);
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const mover = async (contactoId: string, etapa: Etapa) => {
    // Update optimista
    setContactos((cs) => cs.map((c) => c.id === contactoId ? { ...c, etapa } : c));
    await fetch(`/api/crm/contactos/${contactoId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ etapa }),
    }).catch(() => cargar());
  };

  const onDragStart = (id: string) => (e: React.DragEvent) => {
    setArrastrado(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  };
  const onDragOver = (etapa: Etapa) => (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setSobreEtapa(etapa);
  };
  const onDrop = (etapa: Etapa) => (e: React.DragEvent) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain') || arrastrado;
    if (id) mover(id, etapa);
    setArrastrado(null);
    setSobreEtapa(null);
  };
  const onDragEnd = () => { setArrastrado(null); setSobreEtapa(null); };

  if (cargando) {
    return (
      <div className="grid grid-cols-5 gap-3 p-6">
        {ETAPAS.map((e) => <div key={e} className="dv-skeleton h-64 w-full" />)}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto p-4">
      <div className="grid grid-cols-5 gap-3 min-w-[1000px]">
        {ETAPAS.map((etapa) => {
          const cards = contactos.filter((c) => c.etapa === etapa);
          const total = cards.length;
          return (
            <div
              key={etapa}
              onDragOver={onDragOver(etapa)}
              onDragLeave={() => setSobreEtapa(null)}
              onDrop={onDrop(etapa)}
              className="rounded-xl flex flex-col transition-colors"
              style={{
                background: sobreEtapa === etapa ? 'var(--accent-soft)' : 'var(--surface-muted)',
                border: '1px solid var(--border)',
                minHeight: 320,
              }}
            >
              <div className="px-3 py-2.5 border-b flex items-center justify-between"
                style={{ borderColor: 'var(--border)' }}>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ background: COLOR_ETAPA[etapa] }} />
                  <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{etapa}</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: 'var(--surface)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                  {total}
                </span>
              </div>
              <div className="p-2 space-y-2 flex-1 overflow-y-auto">
                {cards.map((c) => (
                  <div
                    key={c.id}
                    draggable
                    onDragStart={onDragStart(c.id)}
                    onDragEnd={onDragEnd}
                    onClick={() => onSeleccionar?.(c.id)}
                    className="dv-card p-2.5 cursor-grab active:cursor-grabbing transition-transform hover:translate-y-[-1px]"
                    style={{ opacity: arrastrado === c.id ? 0.5 : 1 }}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                        style={{ background: 'var(--brand)', color: 'white' }}>
                        {iniciales(c.nombre)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{c.nombre}</p>
                        <p className="text-[10px] truncate" style={{ color: 'var(--text-muted)' }}>{c.telefono}</p>
                      </div>
                      {c.no_leidos > 0 && (
                        <span className="text-[9px] font-bold rounded-full px-1.5 py-0.5 text-white" style={{ background: 'var(--success)' }}>
                          {c.no_leidos}
                        </span>
                      )}
                    </div>
                    {c.ultimo_mensaje && (
                      <p className="text-[11px] mt-1.5 line-clamp-2 leading-snug" style={{ color: 'var(--text-secondary)' }}>
                        {c.ultimo_mensaje}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-1.5">
                      <div className="flex gap-1 flex-wrap">
                        {c.etiquetas.slice(0, 2).map((t) => (
                          <span key={t} className="dv-badge dv-badge-muted !text-[9px] !px-1.5">{t}</span>
                        ))}
                      </div>
                      <span className="text-[9px]" style={{ color: 'var(--text-muted)' }}>{hora(c.ultimo_at)}</span>
                    </div>
                  </div>
                ))}
                {cards.length === 0 && (
                  <p className="text-[10px] text-center py-6" style={{ color: 'var(--text-muted)' }}>
                    Arrastra aquí
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-[10px] mt-3 px-2" style={{ color: 'var(--text-muted)' }}>
        💡 Arrastra una tarjeta para mover el contacto entre etapas del pipeline.
      </p>
    </div>
  );
}

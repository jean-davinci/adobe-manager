'use client';

import { useEffect, useState, useCallback } from 'react';

type Estado = 'RECIBIDO' | 'EN_PROCESO' | 'COMPLETADO';
type Documento = {
  id: string;
  cliente_nombre: string;
  cliente_email: string | null;
  cliente_telefono: string | null;
  nombre_archivo: string;
  tipo_servicio: string;
  estado: Estado;
  porcentaje_ia: number | null;
  porcentaje_similitud: number | null;
  porcentaje_original: number | null;
  url_informe: string | null;
  drive_informe_url: string | null;
  created_at: string;
  procesado_en: string | null;
};

const ESTADOS: Record<Estado, { label: string; badge: string }> = {
  RECIBIDO: { label: 'Recibido', badge: 'dv-badge-warning' },
  EN_PROCESO: { label: 'En proceso', badge: 'dv-badge-brand' },
  COMPLETADO: { label: 'Completado', badge: 'dv-badge-success' },
};

const SERVICIO: Record<string, string> = {
  IA: 'Detección IA', SIMILITUD: 'Similitud', AMBOS: 'IA + Similitud', TURNITIN_OFICIAL: 'Turnitin Oficial',
};

function PctRing({ valor, label, color }: { valor: number; label: string; color: string }) {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(100, Math.max(0, valor));
  return (
    <div className="text-center min-w-[80px]">
      <svg width="72" height="72" viewBox="0 0 72 72">
        <circle cx="36" cy="36" r={r} fill="none" stroke="var(--border)" strokeWidth="5" />
        <circle
          cx="36" cy="36" r={r} fill="none" stroke={color} strokeWidth="5"
          strokeDasharray={circ}
          strokeDashoffset={circ - (circ * pct) / 100}
          strokeLinecap="round"
          transform="rotate(-90 36 36)"
          style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(0.22, 1, 0.36, 1)' }}
        />
        <text x="36" y="41" textAnchor="middle" fill="var(--text-primary)" fontSize="14" fontWeight="700">
          {pct}%
        </text>
      </svg>
      <div className="text-[10px] mt-1" style={{ color: 'var(--text-secondary)' }}>{label}</div>
    </div>
  );
}

const PASOS = [
  'Generando informe PDF…',
  'Subiendo a Google Drive…',
  'Enviando email al cliente…',
  'Enviando WhatsApp…',
];

function ModalProcesar({ doc, onClose, onSuccess }: {
  doc: Documento; onClose: () => void; onSuccess: () => void;
}) {
  const [pctIA, setPctIA] = useState(doc.porcentaje_ia ?? 0);
  const [pctSim, setPctSim] = useState(doc.porcentaje_similitud ?? 0);
  const [notas, setNotas] = useState('');
  const [step, setStep] = useState<'form' | 'generating' | 'done' | 'error'>('form');
  const [stepIdx, setStepIdx] = useState(0);
  const [resultado, setResultado] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const generar = async () => {
    setStep('generating');
    setStepIdx(0);

    // Animación de pasos en paralelo con la petición real
    const timer = setInterval(() => setStepIdx((i) => Math.min(i + 1, PASOS.length - 1)), 850);
    try {
      const res = await fetch('/api/informes/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentoId: doc.id, porcentajeIA: pctIA, porcentajeSimilitud: pctSim, notas }),
      });
      const data = await res.json();
      clearInterval(timer);
      if (!data.success) throw new Error(data.error ?? 'Error al generar');
      setResultado(data);
      setStepIdx(PASOS.length);
      setStep('done');
    } catch (e: any) {
      clearInterval(timer);
      setErrorMsg(e.message);
      setStep('error');
    }
  };

  const orig = Math.max(0, 100 - pctIA - pctSim);

  return (
    <div className="dv-modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget && step === 'form') onClose(); }}>
      <div className="dv-modal max-w-lg p-7">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="dv-eyebrow mb-1" style={{ color: 'var(--accent-hover)' }}>Procesar documento</p>
            <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>{doc.cliente_nombre}</h2>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{doc.nombre_archivo}</p>
          </div>
          {step === 'form' && (
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors hover:bg-white/[0.06]"
              style={{ color: 'var(--text-muted)' }}>✕</button>
          )}
        </div>

        {step === 'form' && (
          <>
            <div className="mb-5">
              <label className="dv-label flex justify-between">
                <span>DETECCIÓN IA</span><span className="font-bold" style={{ color: '#2186F5' }}>{pctIA}%</span>
              </label>
              <input type="range" min={0} max={100} value={pctIA} onChange={(e) => setPctIA(+e.target.value)}
                className="w-full" style={{ accentColor: '#2186F5' }} />
            </div>
            <div className="mb-5">
              <label className="dv-label flex justify-between">
                <span>SIMILITUD TURNITIN</span><span className="font-bold" style={{ color: '#1E3A5F' }}>{pctSim}%</span>
              </label>
              <input type="range" min={0} max={100} value={pctSim} onChange={(e) => setPctSim(+e.target.value)}
                className="w-full" style={{ accentColor: '#1E3A5F' }} />
            </div>

            <div className="flex justify-center gap-6 py-4 mb-5 border-y" style={{ borderColor: 'var(--border)' }}>
              <PctRing valor={pctIA} label="IA" color="#2186F5" />
              <PctRing valor={pctSim} label="Similitud" color="#1E3A5F" />
              <PctRing valor={orig} label="Original" color="#10B981" />
            </div>

            <div className="mb-6">
              <label className="dv-label">Notas del operador (opcional)</label>
              <textarea value={notas} onChange={(e) => setNotas(e.target.value)} rows={3}
                placeholder="Observaciones adicionales para el cliente…"
                className="dv-input resize-y" />
            </div>

            <button onClick={generar} className="dv-btn-primary w-full !py-3.5">
              Generar informe automáticamente →
            </button>
            <p className="text-[11px] text-center mt-3" style={{ color: 'var(--text-muted)' }}>
              PDF con marca Davinci → Drive → email → WhatsApp, en un solo paso.
            </p>
          </>
        )}

        {step === 'generating' && (
          <div className="text-center py-6">
            <div className="w-14 h-14 rounded-full mx-auto mb-6 animate-spin"
              style={{ border: '3px solid var(--border)', borderTopColor: 'var(--brand)' }} />
            <p className="font-semibold mb-5" style={{ color: 'var(--text-primary)' }}>Procesando…</p>
            <div className="max-w-xs mx-auto text-left">
              {PASOS.map((p, i) => (
                <div key={p} className="flex items-center gap-2.5 py-2 text-sm transition-colors"
                  style={{ color: i < stepIdx ? 'var(--success)' : i === stepIdx ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                  <span className="w-5 text-center">{i < stepIdx ? '✓' : i === stepIdx ? '⟳' : '○'}</span>
                  {p}
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 'done' && (
          <div className="text-center py-6 dv-animate-scale">
            <div className="w-16 h-16 rounded-full mx-auto mb-5 flex items-center justify-center text-3xl"
              style={{ background: 'var(--success-soft)' }}>✅</div>
            <p className="font-bold text-lg mb-1" style={{ color: 'var(--success)' }}>Informe generado y entregado</p>
            <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
              {resultado?.emailEnviado ? 'Email enviado' : 'Email no enviado'} ·{' '}
              {resultado?.whatsappEnviado ? 'WhatsApp enviado' : 'WhatsApp no enviado'}
              {(resultado?.mock?.email || resultado?.mock?.whatsapp) && ' (modo mock)'}
            </p>
            <div className="flex justify-center gap-3 mt-5">
              <a href={resultado?.urlInforme} target="_blank" className="dv-btn-ghost">Ver PDF</a>
              <button onClick={() => { onClose(); onSuccess(); }} className="dv-btn-primary">Volver al panel</button>
            </div>
          </div>
        )}

        {step === 'error' && (
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-full mx-auto mb-5 flex items-center justify-center text-3xl"
              style={{ background: 'var(--danger-soft)' }}>⚠️</div>
            <p className="font-bold mb-2" style={{ color: 'var(--danger)' }}>No se pudo generar</p>
            <p className="text-sm mb-5" style={{ color: 'var(--text-secondary)' }}>{errorMsg}</p>
            <button onClick={() => setStep('form')} className="dv-btn-primary">Reintentar</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function InformesClient() {
  const [docs, setDocs] = useState<Documento[]>([]);
  const [cargando, setCargando] = useState(true);
  const [activo, setActivo] = useState<Documento | null>(null);
  const [filtro, setFiltro] = useState<'TODOS' | Estado>('TODOS');

  const cargar = useCallback(async () => {
    setCargando(true);
    const r = await fetch('/api/documentos').then((x) => x.json());
    setDocs(Array.isArray(r) ? r : []);
    setCargando(false);
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const visibles = filtro === 'TODOS' ? docs : docs.filter((d) => d.estado === filtro);
  const conteo = (e: Estado) => docs.filter((d) => d.estado === e).length;

  return (
    <div className="space-y-6">
      {/* Flujo explicado */}
      <div className="dv-card p-5 dv-animate-up">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
          {['Cliente sube documento', 'Operador ingresa % IA y similitud', 'PDF con marca Davinci', 'Drive + email + WhatsApp', 'Cliente lo ve en su portal'].map((paso, i, arr) => (
            <span key={paso} className="flex items-center gap-2">
              <span className="dv-badge dv-badge-brand">{i + 1}</span>
              {paso}
              {i < arr.length - 1 && <span style={{ color: 'var(--brand)' }}>→</span>}
            </span>
          ))}
        </div>
      </div>

      {/* Stats clicables */}
      <div className="grid grid-cols-3 gap-3">
        {(['RECIBIDO', 'EN_PROCESO', 'COMPLETADO'] as Estado[]).map((e, i) => (
          <button key={e} onClick={() => setFiltro(filtro === e ? 'TODOS' : e)}
            className={`dv-card dv-hover-lift p-4 text-left dv-animate-up dv-delay-${i + 1} ${filtro === e ? 'ring-2 ring-[var(--brand)]' : ''}`}>
            <p className="dv-eyebrow mb-1">{ESTADOS[e].label}</p>
            <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{conteo(e)}</p>
          </button>
        ))}
      </div>

      {/* Tabla */}
      <div className="dv-card overflow-hidden dv-animate-up dv-delay-2">
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Documentos</h2>
          <button onClick={cargar} className="dv-btn-ghost !py-1.5 text-xs">↻ Actualizar</button>
        </div>

        {cargando ? (
          <div className="p-4 space-y-3">
            {[0, 1, 2].map((i) => <div key={i} className="dv-skeleton h-12 w-full" />)}
          </div>
        ) : visibles.length === 0 ? (
          <div className="py-14 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
            {filtro === 'TODOS' ? 'No hay documentos aún. Súbelos desde el módulo Turnitin.' : 'Nada en este estado.'}
          </div>
        ) : (
          <table className="dv-table">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Archivo</th>
                <th>Servicio</th>
                <th>Estado</th>
                <th>Resultados</th>
                <th style={{ textAlign: 'right' }}>Informe</th>
              </tr>
            </thead>
            <tbody>
              {visibles.map((d) => (
                <tr key={d.id}>
                  <td>
                    <div className="font-medium">{d.cliente_nombre}</div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{d.cliente_email ?? '—'}</div>
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>{d.nombre_archivo}</td>
                  <td><span className="dv-badge dv-badge-muted">{SERVICIO[d.tipo_servicio] ?? d.tipo_servicio}</span></td>
                  <td><span className={`dv-badge ${ESTADOS[d.estado].badge}`}>{ESTADOS[d.estado].label}</span></td>
                  <td>
                    {d.porcentaje_ia != null || d.porcentaje_similitud != null ? (
                      <div className="flex gap-2 text-xs font-semibold">
                        <span style={{ color: '#2186F5' }}>IA {d.porcentaje_ia ?? 0}%</span>
                        <span style={{ color: '#2186F5' }}>Sim {d.porcentaje_similitud ?? 0}%</span>
                        <span style={{ color: 'var(--success)' }}>Orig {d.porcentaje_original ?? 0}%</span>
                      </div>
                    ) : (
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>—</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {d.estado === 'COMPLETADO' && d.url_informe ? (
                      <div className="flex items-center gap-3 justify-end">
                        <a href={d.url_informe} target="_blank" className="text-xs font-medium hover:underline" style={{ color: 'var(--success)' }}>
                          📄 PDF
                        </a>
                        {d.drive_informe_url && (
                          <a href={d.drive_informe_url} target="_blank" className="text-xs hover:underline" style={{ color: 'var(--accent-hover)' }}>
                            Drive ↗
                          </a>
                        )}
                        <button onClick={() => setActivo(d)} className="text-xs hover:underline" style={{ color: 'var(--text-muted)' }}>
                          Regenerar
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => setActivo(d)} className="dv-btn-primary !py-1.5 !px-4 text-xs">
                        Procesar →
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {activo && (
        <ModalProcesar doc={activo} onClose={() => setActivo(null)} onSuccess={cargar} />
      )}
    </div>
  );
}

'use client';

import { useState, useRef, useCallback } from 'react';
import type { PedidoTurnitin } from '@/lib/portal-types';

const ESTADO_INFO: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  pendiente:  { label: 'En cola',      color: 'var(--warning)',  bg: 'var(--warning-soft)',  icon: '⏳' },
  procesando: { label: 'Procesando',   color: 'var(--brand)',    bg: 'rgba(26,43,74,0.08)', icon: '⚙️' },
  completado: { label: 'Completado',   color: 'var(--success)',  bg: 'var(--success-soft)',  icon: '✅' },
  error:      { label: 'Error',        color: 'var(--danger)',   bg: 'var(--danger-soft)',   icon: '❌' },
};

export default function TurnitinUpload({
  saldoInicial,
  pedidosIniciales,
}: {
  saldoInicial: number;
  pedidosIniciales: PedidoTurnitin[];
}) {
  const [saldo, setSaldo] = useState(saldoInicial);
  const [pedidos, setPedidos] = useState<PedidoTurnitin[]>(pedidosIniciales);
  const [drag, setDrag] = useState(false);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progreso, setProgreso] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const TIPOS_ACEPTADOS = ['application/pdf', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  const MAX_MB = 50;

  const validar = (f: File) => {
    if (!TIPOS_ACEPTADOS.includes(f.type)) return 'Solo se aceptan archivos PDF, DOC o DOCX.';
    if (f.size > MAX_MB * 1024 * 1024) return `El archivo supera ${MAX_MB} MB.`;
    return null;
  };

  const seleccionar = (f: File | null) => {
    if (!f) return;
    const err = validar(f);
    if (err) { setError(err); return; }
    setArchivo(f);
    setError(null);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDrag(false);
    seleccionar(e.dataTransfer.files[0] ?? null);
  }, []);

  const enviar = async () => {
    if (!archivo || saldo < 1) return;
    setSubiendo(true);
    setProgreso(10);
    setError(null);

    try {
      // 1. Subir archivo
      const fd = new FormData();
      fd.append('doc', archivo);
      setProgreso(30);
      const upRes = await fetch('/api/portal/upload', { method: 'POST', body: fd });
      if (!upRes.ok) {
        const d = await upRes.json();
        throw new Error(d.error ?? 'Error al subir el archivo.');
      }
      const { url } = await upRes.json();
      setProgreso(70);

      // 2. Crear pedido
      const pedRes = await fetch('/api/portal/pedidos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombreArchivo: archivo.name, archivoUrl: url }),
      });
      if (!pedRes.ok) {
        const d = await pedRes.json();
        throw new Error(d.error ?? 'Error al registrar el pedido.');
      }
      const { pedido, saldo: nuevoSaldo } = await pedRes.json();
      setProgreso(100);

      setPedidos((prev) => [pedido, ...prev]);
      setSaldo(nuevoSaldo);
      setArchivo(null);
      if (inputRef.current) inputRef.current.value = '';
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubiendo(false);
      setTimeout(() => setProgreso(0), 600);
    }
  };

  return (
    <div className="space-y-6">
      {/* Saldo */}
      <div
        className="flex items-center gap-3 p-4 rounded-2xl"
        style={{ background: saldo > 0 ? 'rgba(34,197,94,0.06)' : 'rgba(239,68,68,0.06)',
                  border: `1px solid ${saldo > 0 ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}` }}
      >
        <span className="text-2xl">{saldo > 0 ? '💳' : '❌'}</span>
        <div className="flex-1">
          <p className="font-semibold text-sm" style={{ color: 'var(--text)' }}>
            {saldo} crédito{saldo !== 1 ? 's' : ''} disponible{saldo !== 1 ? 's' : ''}
          </p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Cada documento usa 1 crédito · Recibes el informe PDF oficial
          </p>
        </div>
        {saldo === 0 && (
          <a
            href="/portal/creditos"
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-white flex-shrink-0"
            style={{ background: 'var(--brand)' }}
          >
            Comprar créditos
          </a>
        )}
      </div>

      {/* Zona de upload */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className="rounded-2xl border-2 border-dashed p-10 text-center cursor-pointer transition-all"
        style={{
          borderColor: drag ? 'var(--brand)' : archivo ? 'var(--success)' : 'var(--border)',
          background: drag ? 'rgba(26,43,74,0.04)' : archivo ? 'rgba(34,197,94,0.04)' : 'var(--surface)',
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.doc,.docx"
          className="hidden"
          onChange={(e) => seleccionar(e.target.files?.[0] ?? null)}
        />

        {archivo ? (
          <div className="space-y-2">
            <span className="text-4xl">📄</span>
            <p className="font-semibold" style={{ color: 'var(--text)' }}>{archivo.name}</p>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {(archivo.size / 1024 / 1024).toFixed(1)} MB · Listo para procesar
            </p>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setArchivo(null); }}
              className="text-xs underline mt-1"
              style={{ color: 'var(--text-muted)' }}
            >
              Cambiar archivo
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <svg className="mx-auto" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-muted)' }}>
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <div>
              <p className="font-semibold" style={{ color: 'var(--text)' }}>
                Arrastra tu documento aquí
              </p>
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                o haz clic para seleccionar · PDF, DOC, DOCX · máx. {MAX_MB} MB
              </p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm px-4 py-3 rounded-xl" style={{ background: 'var(--danger-soft)', color: 'var(--danger)' }}>
          {error}
        </p>
      )}

      {progreso > 0 && progreso < 100 && (
        <div>
          <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
            <span>Subiendo y registrando…</span>
            <span>{progreso}%</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{ width: `${progreso}%`, background: 'var(--brand)' }}
            />
          </div>
        </div>
      )}

      <button
        onClick={enviar}
        disabled={!archivo || saldo < 1 || subiendo}
        className="w-full py-3 rounded-xl font-semibold text-white text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-md hover:-translate-y-0.5"
        style={{ background: 'var(--brand)' }}
      >
        {subiendo ? 'Procesando…' : 'Enviar documento (–1 crédito)'}
      </button>

      {/* Lista de pedidos */}
      {pedidos.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>
            Mis documentos
          </h2>
          <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
            {pedidos.map((p, i) => {
              const info = ESTADO_INFO[p.estado] ?? ESTADO_INFO.pendiente;
              return (
                <div
                  key={p.id}
                  className="flex items-center gap-4 px-5 py-4"
                  style={{
                    background: 'var(--surface)',
                    borderTop: i > 0 ? '1px solid var(--border)' : undefined,
                  }}
                >
                  <span className="text-xl flex-shrink-0">{info.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>
                      {p.nombre_archivo}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {new Date(p.created_at).toLocaleDateString('es-PE', {
                        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {p.estado === 'completado' && p.similitud_pct !== null && (
                      <span
                        className="text-xs font-bold px-2 py-1 rounded-full"
                        style={{
                          background: p.similitud_pct <= 15 ? 'var(--success-soft)' : 'var(--warning-soft)',
                          color: p.similitud_pct <= 15 ? 'var(--success)' : 'var(--warning)',
                        }}
                      >
                        {p.similitud_pct}%
                      </span>
                    )}
                    {p.ia_pct !== null && (
                      <span className="text-xs px-2 py-1 rounded-full" style={{ background: 'var(--surface-2)', color: 'var(--text-muted)' }}>
                        IA: {p.ia_pct}%
                      </span>
                    )}
                    <span
                      className="text-xs px-2.5 py-1 rounded-full font-medium"
                      style={{ background: info.bg, color: info.color }}
                    >
                      {info.label}
                    </span>
                    {p.reporte_url && (
                      <a
                        href={p.reporte_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                        style={{ background: 'var(--brand)', color: 'white' }}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                        Informe
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

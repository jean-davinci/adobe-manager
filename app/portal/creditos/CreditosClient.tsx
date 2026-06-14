'use client';

import { useState, useRef } from 'react';
import type { CompraCreditos } from '@/lib/portal-types';
import { PAQUETES } from '@/lib/portal-config';

const YAPE_NUMERO = process.env.NEXT_PUBLIC_YAPE_NUMERO ?? '987654321';

const ESTADO_BADGE: Record<string, { label: string; color: string; bg: string }> = {
  pendiente:   { label: 'En revisión', color: 'var(--warning)',  bg: 'var(--warning-soft)'  },
  confirmado:  { label: 'Confirmado',  color: 'var(--success)',  bg: 'var(--success-soft)'  },
  rechazado:   { label: 'Rechazado',   color: 'var(--danger)',   bg: 'var(--danger-soft)'   },
};

export default function CreditosClient({
  saldoInicial,
  comprasIniciales,
}: {
  saldoInicial: number;
  comprasIniciales: CompraCreditos[];
}) {
  const [saldo, setSaldo] = useState(saldoInicial);
  const [compras, setCompras] = useState(comprasIniciales);
  const [paquete, setPaquete] = useState<string>('estandar');
  const [referencia, setReferencia] = useState('');
  const [voucher, setVoucher] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [exito, setExito] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const voucherRef = useRef<HTMLInputElement>(null);

  const paqueteInfo = PAQUETES[paquete];

  const seleccionarVoucher = (f: File | null) => {
    if (!f) return;
    setVoucher(f);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(f);
  };

  const enviar = async () => {
    if (!paquete) return;
    setEnviando(true);
    setError(null);

    try {
      let imagenUrl: string | null = null;
      if (voucher) {
        const fd = new FormData();
        fd.append('media', voucher);
        const r = await fetch('/api/crm/media', { method: 'POST', body: fd });
        if (r.ok) {
          const d = await r.json();
          imagenUrl = d.url ?? null;
        }
      }

      const res = await fetch('/api/portal/creditos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paquete, referencia: referencia.trim() || null, imagenUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Error al enviar la solicitud.');

      setCompras((prev) => [data.compra, ...prev]);
      setExito(true);
      setReferencia('');
      setVoucher(null);
      setPreview(null);
      if (voucherRef.current) voucherRef.current.value = '';
    } catch (err: any) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Saldo actual */}
      <div
        className="flex items-center gap-4 p-5 rounded-2xl"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
          style={{ background: 'rgba(255,193,7,0.1)' }}
        >
          💳
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider mb-0.5" style={{ color: 'var(--text-muted)' }}>Créditos disponibles</p>
          <p className="text-3xl font-bold" style={{ color: 'var(--text)' }}>{saldo}</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>1 crédito = 1 informe Turnitin</p>
        </div>
      </div>

      {/* Paquetes */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>
          Elige un paquete
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {Object.entries(PAQUETES).map(([key, p]) => (
            <button
              key={key}
              type="button"
              onClick={() => setPaquete(key)}
              className="rounded-2xl p-4 text-left transition-all hover:shadow-sm"
              style={{
                background: 'var(--surface)',
                border: `2px solid ${paquete === key ? 'var(--brand)' : 'var(--border)'}`,
                transform: paquete === key ? 'scale(1.02)' : undefined,
              }}
            >
              <p className="font-bold text-lg mb-0.5" style={{ color: 'var(--text)' }}>
                {p.cantidad} crédito{p.cantidad !== 1 ? 's' : ''}
              </p>
              <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>{p.label}</p>
              <p className="text-xl font-bold" style={{ color: 'var(--brand)' }}>S/. {p.monto}</p>
              {p.ahorro && (
                <p className="text-xs mt-1 font-medium" style={{ color: 'var(--success)' }}>
                  Ahorras S/. {p.ahorro}
                </p>
              )}
              {!p.ahorro && (
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                  S/. {(p.monto / p.cantidad).toFixed(0)} por crédito
                </p>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Instrucciones de pago */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>
          Paga por Yape
        </h2>
        <div
          className="rounded-2xl p-5 space-y-4"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          {/* Monto resumen */}
          <div
            className="flex items-center justify-between p-3 rounded-xl"
            style={{ background: 'var(--surface-2)' }}
          >
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {paqueteInfo?.label} — {paqueteInfo?.cantidad} crédito{paqueteInfo?.cantidad !== 1 ? 's' : ''}
            </span>
            <span className="font-bold text-lg" style={{ color: 'var(--text)' }}>
              S/. {paqueteInfo?.monto}
            </span>
          </div>

          <div className="flex gap-3 items-start">
            {/* QR placeholder */}
            <div
              className="w-24 h-24 rounded-xl flex items-center justify-center flex-shrink-0 text-4xl"
              style={{ background: 'var(--surface-2)', border: '1px dashed var(--border)' }}
            >
              📲
            </div>
            <div className="space-y-1.5">
              <p className="text-sm" style={{ color: 'var(--text)' }}>
                Yapea <strong>S/. {paqueteInfo?.monto}</strong> al número:
              </p>
              <p
                className="text-xl font-bold font-mono"
                style={{ color: 'var(--brand)' }}
              >
                {YAPE_NUMERO}
              </p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Davinci Labs · {paqueteInfo?.label}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Formulario de confirmación */}
      {exito ? (
        <div
          className="rounded-2xl p-6 text-center"
          style={{ background: 'var(--success-soft)', border: '1px solid rgba(34,197,94,0.3)' }}
        >
          <p className="text-3xl mb-2">🎉</p>
          <p className="font-semibold" style={{ color: 'var(--success)' }}>¡Solicitud enviada!</p>
          <p className="text-sm mt-1" style={{ color: 'var(--success)' }}>
            Revisaremos tu comprobante y acreditaremos los créditos en breve (máx. 30 min).
          </p>
          <button
            onClick={() => setExito(false)}
            className="mt-4 text-sm underline"
            style={{ color: 'var(--success)' }}
          >
            Enviar otra solicitud
          </button>
        </div>
      ) : (
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>
            Confirmar pago
          </h2>
          <div
            className="rounded-2xl p-5 space-y-4"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <div>
              <label className="dv-label">Número de operación Yape (opcional)</label>
              <input
                type="text"
                value={referencia}
                onChange={(e) => setReferencia(e.target.value)}
                placeholder="Ej: 123456789"
                className="dv-input"
              />
            </div>

            <div>
              <label className="dv-label">Foto del comprobante Yape</label>
              <div
                className="mt-1 rounded-xl border-2 border-dashed p-4 text-center cursor-pointer transition-colors"
                style={{ borderColor: voucher ? 'var(--success)' : 'var(--border)' }}
                onClick={() => voucherRef.current?.click()}
              >
                <input
                  ref={voucherRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => seleccionarVoucher(e.target.files?.[0] ?? null)}
                />
                {preview ? (
                  <div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={preview} alt="voucher" className="max-h-32 mx-auto rounded-lg object-contain" />
                    <p className="text-xs mt-2" style={{ color: 'var(--success)' }}>Comprobante adjunto ✓</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>📸 Toca para adjuntar captura del Yape</p>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Recomendado para validación rápida</p>
                  </div>
                )}
              </div>
            </div>

            {error && (
              <p className="text-sm px-3 py-2 rounded-lg" style={{ background: 'var(--danger-soft)', color: 'var(--danger)' }}>
                {error}
              </p>
            )}

            <button
              onClick={enviar}
              disabled={enviando}
              className="w-full py-3 rounded-xl font-semibold text-white text-sm transition-all disabled:opacity-50 hover:shadow-md hover:-translate-y-0.5"
              style={{ background: 'var(--brand)' }}
            >
              {enviando ? 'Enviando solicitud…' : `Confirmar pago de S/. ${paqueteInfo?.monto}`}
            </button>
            <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
              Verificamos tu pago en máx. 30 minutos · Horario: 8am–10pm
            </p>
          </div>
        </div>
      )}

      {/* Historial */}
      {compras.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>
            Historial de compras
          </h2>
          <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
            {compras.map((c, i) => {
              const badge = ESTADO_BADGE[c.estado] ?? ESTADO_BADGE.pendiente;
              const p = PAQUETES[c.paquete];
              return (
                <div
                  key={c.id}
                  className="flex items-center gap-3 px-5 py-4"
                  style={{
                    background: 'var(--surface)',
                    borderTop: i > 0 ? '1px solid var(--border)' : undefined,
                  }}
                >
                  <span className="text-xl flex-shrink-0">💳</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                      {p?.label ?? c.paquete} — {c.cantidad} crédito{Number(c.cantidad) !== 1 ? 's' : ''}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {new Date(c.created_at).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                    {c.notas && (
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{c.notas}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>S/. {c.monto}</span>
                    <span
                      className="text-xs px-2 py-1 rounded-full font-medium"
                      style={{ background: badge.bg, color: badge.color }}
                    >
                      {badge.label}
                    </span>
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

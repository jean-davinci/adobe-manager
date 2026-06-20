'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';

type Status = {
  connected: boolean;
  hasQr: boolean;
  phone?: string;
  name?: string;
  error?: string;
};

export default function WaSetupClient({
  statusInicial,
  qrInicial,
}: {
  statusInicial: Status;
  qrInicial: string | null;
}) {
  const [status, setStatus] = useState(statusInicial);
  const [qr, setQr] = useState<string | null>(qrInicial);
  const [cargando, setCargando] = useState(false);

  const refrescar = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/whatsapp/status');
      if (!res.ok) return;
      const d = await res.json();
      setStatus(d.status);
      setQr(d.qr ?? null);
    } catch { /* silencioso */ }
  }, []);

  // Polling mientras hay QR pendiente o está desconectado
  useEffect(() => {
    if (status.connected) return;
    const id = setInterval(refrescar, 4000);
    return () => clearInterval(id);
  }, [status.connected, refrescar]);

  const desconectar = async () => {
    setCargando(true);
    try {
      await fetch('/api/admin/whatsapp/logout', { method: 'POST' });
      await refrescar();
    } finally {
      setCargando(false);
    }
  };

  if (status.connected) {
    return (
      <div
        className="rounded-2xl p-5 space-y-4"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
            style={{ background: 'rgba(34,197,94,0.1)' }}
          >
            ✅
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm" style={{ color: 'var(--text)' }}>
              {status.name ?? 'WhatsApp vinculado'}
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              +{status.phone} · Conectado y recibiendo mensajes
            </p>
          </div>
          <span
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ background: 'var(--success)' }}
          />
        </div>

        <div className="pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
          <button
            onClick={desconectar}
            disabled={cargando}
            className="text-xs px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
            style={{ background: 'var(--danger-soft)', color: 'var(--danger)' }}
          >
            {cargando ? 'Desconectando…' : 'Desvincular número'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl p-5 space-y-5"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <div>
        <h2 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
          Escanea el código QR
        </h2>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
          Abre WhatsApp en tu teléfono → Dispositivos vinculados → Vincular un dispositivo
        </p>
      </div>

      {qr ? (
        <div className="flex flex-col items-center gap-3">
          <div className="p-3 rounded-2xl" style={{ background: 'white' }}>
            <Image src={qr} alt="QR WhatsApp" width={220} height={220} unoptimized />
          </div>
          <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
            El QR expira en ~60 segundos · Se regenera automáticamente
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 py-8">
          <div className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin"
            style={{ borderColor: `var(--brand) transparent var(--brand) var(--brand)` }} />
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {status.error
              ? `Error: ${status.error}`
              : 'Iniciando WhatsApp Web…'}
          </p>
        </div>
      )}

      {status.error && (
        <div
          className="text-xs px-3 py-2 rounded-lg"
          style={{ background: 'var(--danger-soft)', color: 'var(--danger)' }}
        >
          {status.error}
        </div>
      )}
    </div>
  );
}

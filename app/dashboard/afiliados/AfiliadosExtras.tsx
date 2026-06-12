'use client';

import { useState } from 'react';

type GmailData = {
  mock: boolean;
  codigos: { from: string; subject: string; date: string; code: string | null; snippet: string }[];
  informes: { from: string; subject: string; date: string; cliente: string; adjunto: string }[];
};

export default function AfiliadosExtras() {
  const [gmail, setGmail] = useState<GmailData | null>(null);
  const [abierto, setAbierto] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [notif, setNotif] = useState<string>('');

  const toggleGmail = async () => {
    if (abierto) { setAbierto(false); return; }
    setAbierto(true);
    if (!gmail) {
      setCargando(true);
      const d = await fetch('/api/afiliados/gmail').then((x) => x.json());
      setGmail(d);
      setCargando(false);
    }
  };

  const notificar = async () => {
    setNotif('Enviando…');
    const r = await fetch('/api/afiliados/notificar-vencimientos?dias=15', { method: 'POST' }).then((x) => x.json());
    setNotif(`${r.enviados}/${r.total} notificados${r.mock ? ' (mock)' : ''}`);
    setTimeout(() => setNotif(''), 4000);
  };

  const hora = (s: string) => new Date(s).toLocaleString('es-PE', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' });

  return (
    <div className="max-w-7xl mx-auto px-6 pt-6">
      <div className="flex items-center gap-2 flex-wrap dv-animate-up">
        <button onClick={toggleGmail}
          className="px-3 py-1.5 text-sm border rounded-lg transition-colors hover:border-[var(--accent)] hover:text-[var(--accent-hover)]"
          style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)', background: 'var(--surface)' }}>
          📬 Bandeja Gmail {abierto ? '▲' : '▼'}
        </button>
        <button onClick={notificar}
          className="px-3 py-1.5 text-sm border rounded-lg transition-colors hover:border-[var(--accent)] hover:text-[var(--accent-hover)]"
          style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)', background: 'var(--surface)' }}>
          🔔 Notificar vencimientos
        </button>
        {notif && <span className="text-xs font-medium dv-animate-in" style={{ color: 'var(--success)' }}>{notif}</span>}
      </div>

      {abierto && (
        <div className="mt-3 dv-card p-4 grid grid-cols-1 md:grid-cols-2 gap-4 dv-animate-scale">
          <div>
            <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              🔑 Códigos de acceso {gmail?.mock && <span className="dv-badge dv-badge-warning ml-1">mock</span>}
            </h3>
            {cargando ? (
              <div className="space-y-2">
                <div className="dv-skeleton h-12 w-full" />
                <div className="dv-skeleton h-12 w-full" />
              </div>
            ) : (
              <div className="space-y-2">
                {gmail?.codigos.map((c, i) => (
                  <div key={i} className="flex items-center justify-between dv-card-muted p-2.5">
                    <div className="min-w-0">
                      <p className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>{c.subject}</p>
                      <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{hora(c.date)}</p>
                    </div>
                    {c.code && <span className="font-mono font-bold text-lg ml-2" style={{ color: 'var(--accent-hover)' }}>{c.code}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div>
            <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>🤖 Informes de IA recibidos</h3>
            {cargando ? (
              <div className="space-y-2">
                <div className="dv-skeleton h-12 w-full" />
                <div className="dv-skeleton h-12 w-full" />
              </div>
            ) : (
              <div className="space-y-2">
                {gmail?.informes.map((inf, i) => (
                  <div key={i} className="dv-card-muted p-2.5">
                    <p className="text-xs font-medium truncate" style={{ color: 'var(--text-secondary)' }}>{inf.subject}</p>
                    <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{inf.cliente} · 📎 {inf.adjunto} · {hora(inf.date)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

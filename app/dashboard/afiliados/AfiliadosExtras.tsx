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
      <div className="flex items-center gap-2 flex-wrap">
        <button onClick={toggleGmail}
          className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-100 bg-white">
          📬 Bandeja Gmail {abierto ? '▲' : '▼'}
        </button>
        <button onClick={notificar}
          className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-100 bg-white">
          🔔 Notificar vencimientos
        </button>
        {notif && <span className="text-xs text-green-600 font-medium">{notif}</span>}
      </div>

      {abierto && (
        <div className="mt-3 bg-white rounded-2xl border border-gray-100 p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">
              🔑 Códigos de acceso {gmail?.mock && <span className="text-xs text-amber-500 font-normal">(mock)</span>}
            </h3>
            {cargando ? <p className="text-xs text-gray-400">Cargando…</p> : (
              <div className="space-y-2">
                {gmail?.codigos.map((c, i) => (
                  <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg p-2.5">
                    <div className="min-w-0">
                      <p className="text-xs text-gray-500 truncate">{c.subject}</p>
                      <p className="text-[11px] text-gray-400">{hora(c.date)}</p>
                    </div>
                    {c.code && <span className="font-mono font-bold text-blue-600 text-lg ml-2">{c.code}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">🤖 Informes de IA recibidos</h3>
            {cargando ? <p className="text-xs text-gray-400">Cargando…</p> : (
              <div className="space-y-2">
                {gmail?.informes.map((inf, i) => (
                  <div key={i} className="bg-gray-50 rounded-lg p-2.5">
                    <p className="text-xs font-medium text-gray-700 truncate">{inf.subject}</p>
                    <p className="text-[11px] text-gray-400">{inf.cliente} · 📎 {inf.adjunto} · {hora(inf.date)}</p>
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

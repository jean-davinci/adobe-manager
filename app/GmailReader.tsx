'use client';
import { useState } from 'react';

const GOOGLE_CLIENT_ID = '60853712493-afbo7ksrugoaiglgdh4bm5gimu17ht5g.apps.googleusercontent.com';
const SCOPES = 'https://www.googleapis.com/auth/gmail.readonly';

export default function GmailReader({ emailAdobe }: { emailAdobe: string }) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [emails, setEmails] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = () => {
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${GOOGLE_CLIENT_ID}` +
      `&redirect_uri=${encodeURIComponent(window.location.origin + '/api/auth/callback/google')}` +
      `&response_type=token` +
      `&scope=${encodeURIComponent(SCOPES)}` +
      `&prompt=select_account` +
      `&login_hint=${encodeURIComponent(emailAdobe)}`;

    const popup = window.open(authUrl, 'google-auth', 'width=500,height=600,scrollbars=yes');

    const interval = setInterval(() => {
      try {
        if (popup?.location?.hash) {
          const hash = popup.location.hash.substring(1);
          const params = new URLSearchParams(hash);
          const token = params.get('access_token');
          if (token) {
            setAccessToken(token);
            popup.close();
            clearInterval(interval);
            fetchEmails(token);
          }
        }
      } catch (e) {}

      if (popup?.closed) clearInterval(interval);
    }, 500);
  };

  const fetchEmails = async (token: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/gmail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access_token: token }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setEmails(data.emails || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-gray-100 overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-gray-700">📬 Lector de Gmail</p>
          <p className="text-xs text-gray-400">{emailAdobe}</p>
        </div>
        {!accessToken ? (
          <button onClick={handleLogin}
            className="px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg hover:bg-gray-700 transition-colors font-medium">
            Conectar Gmail
          </button>
        ) : (
          <button onClick={() => fetchEmails(accessToken)} disabled={loading}
            className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
            {loading ? 'Buscando...' : '🔄 Actualizar'}
          </button>
        )}
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-xs text-red-600">{error}</div>
      )}

      {!accessToken && (
        <div className="p-6 text-center">
          <p className="text-sm text-gray-500 mb-1">Conecta el Gmail de esta cuenta Adobe</p>
          <p className="text-xs text-gray-400">para ver los códigos de verificación automáticamente</p>
        </div>
      )}

      {accessToken && loading && (
        <div className="p-6 text-center">
          <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-gray-500">Buscando emails de Adobe...</p>
        </div>
      )}

      {accessToken && !loading && emails.length === 0 && (
        <div className="p-6 text-center">
          <p className="text-sm text-gray-500">No se encontraron emails de Adobe recientes</p>
          <p className="text-xs text-gray-400 mt-1">Los códigos de verificación aparecerán aquí</p>
        </div>
      )}

      {emails.length > 0 && (
        <div className="divide-y divide-gray-50">
          {emails.map((email, i) => (
            <div key={i} className="p-4">
              {email.code && (
                <div className="flex items-center justify-between mb-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
                  <div>
                    <p className="text-xs text-blue-500 font-medium mb-1">🔑 Código de verificación</p>
                    <p className="text-2xl font-bold text-blue-700 font-mono tracking-widest">{email.code}</p>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(email.code);
                      alert('✅ Código copiado: ' + email.code);
                    }}
                    className="px-3 py-2 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors font-medium">
                    Copiar
                  </button>
                </div>
              )}
              <p className="text-xs font-medium text-gray-700 mb-0.5">{email.subject}</p>
              <p className="text-xs text-gray-400">{email.from}</p>
              <p className="text-xs text-gray-300 mt-0.5">{new Date(email.date).toLocaleString('es-PE')}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

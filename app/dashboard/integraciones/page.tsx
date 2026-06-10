import Link from 'next/link';
import { requireRole } from '@/lib/dal';
import LogoutButton from '@/app/components/LogoutButton';
import { estadoIntegraciones, modoGlobalMock } from '@/lib/integraciones';

export const metadata = { title: 'Integraciones — Davinci Labs' };

const GUIAS: Record<string, string> = {
  gmail: 'Google Cloud Console → OAuth2 (scopes gmail.readonly). Genera el refresh token en OAuth Playground.',
  drive: 'Mismo OAuth de Google (scope drive.file). Crea una carpeta en Drive y pega su ID en GOOGLE_DRIVE_FOLDER_ID.',
  whatsapp: 'Meta for Developers → WhatsApp → API Setup. Copia el token permanente y el Phone Number ID.',
  email: 'resend.com → API Keys. Verifica tu dominio remitente.',
  scrapers: 'Credenciales de iVerificate y Canvas en .env. Requiere "npx playwright install chromium".',
};

export default async function IntegracionesPage() {
  await requireRole('ADMIN');
  const integraciones = estadoIntegraciones();
  const mockGlobal = modoGlobalMock();
  const activas = integraciones.filter((i) => i.activo).length;

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-gray-400 hover:text-gray-700 text-sm">← Panel</Link>
            <div className="h-4 w-px bg-gray-200" />
            <h1 className="text-base font-semibold text-gray-900">🔌 Integraciones</h1>
          </div>
          <LogoutButton />
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-5">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">{activas} de {integraciones.length} integraciones conectadas</p>
        </div>

        {mockGlobal && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            ⚠️ <strong>MOCK_MODE=true</strong> está forzando el modo simulado en todas las integraciones.
            Para activar las reales, pon <code className="bg-amber-100 px-1 rounded">MOCK_MODE=false</code> en <code className="bg-amber-100 px-1 rounded">.env.local</code> y reinicia el servidor.
          </div>
        )}

        <div className="space-y-3">
          {integraciones.map((i) => (
            <div key={i.clave} className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-semibold text-gray-900">{i.nombre}</h2>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${i.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {i.activo ? '● Conectado' : '○ Mock'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{i.descripcion}</p>
                </div>
              </div>

              {!i.activo && (
                <div className="mt-3 border-t border-gray-50 pt-3">
                  {i.faltan.length > 0 && (
                    <p className="text-xs text-gray-500 mb-1">
                      Faltan: {i.faltan.map((f) => <code key={f} className="bg-gray-100 px-1 rounded mr-1">{f}</code>)}
                    </p>
                  )}
                  <p className="text-xs text-gray-400">{GUIAS[i.clave]}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        <p className="text-xs text-gray-400">
          Guía completa de credenciales en <code className="bg-gray-100 px-1 rounded">docs/INTEGRACIONES.md</code>.
        </p>
      </div>
    </main>
  );
}

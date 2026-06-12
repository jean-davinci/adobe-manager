import { requireRole } from '@/lib/dal';
import ModuleHeader from '@/app/components/ModuleHeader';
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
    <main className="min-h-screen" style={{ background: 'var(--background)' }}>
      <ModuleHeader
        eyebrow="Sistema"
        titulo="Integraciones"
        descripcion={`${activas} de ${integraciones.length} conexiones activas`}
        icono={
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 2v6M15 2v6M9 22v-3M15 22v-3" /><rect x="5" y="8" width="14" height="11" rx="2" />
          </svg>
        }
      />

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-5">
        {mockGlobal && (
          <div className="dv-card p-4 text-sm dv-animate-up" style={{ background: 'var(--warning-soft)', borderColor: 'var(--warning)', color: 'var(--warning)' }}>
            ⚠️ <strong>MOCK_MODE=true</strong> está forzando el modo simulado en todas las integraciones.
            Para activar las reales, pon <code className="px-1 rounded bg-black/30">MOCK_MODE=false</code> en <code className="px-1 rounded bg-black/30">.env.local</code> y reinicia el servidor.
          </div>
        )}

        <div className="space-y-3">
          {integraciones.map((i, idx) => (
            <div key={i.clave} className={`dv-card dv-hover-lift p-5 dv-animate-up dv-delay-${Math.min(idx + 1, 6)}`}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{i.nombre}</h2>
                    <span className={`dv-badge ${i.activo ? 'dv-badge-success' : 'dv-badge-muted'}`}>
                      {i.activo ? '● Conectado' : '○ Mock'}
                    </span>
                  </div>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{i.descripcion}</p>
                </div>
              </div>

              {!i.activo && (
                <div className="mt-3 border-t pt-3" style={{ borderColor: 'var(--border)' }}>
                  {i.faltan.length > 0 && (
                    <p className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>
                      Faltan: {i.faltan.map((f) => (
                        <code key={f} className="px-1 rounded mr-1" style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)' }}>{f}</code>
                      ))}
                    </p>
                  )}
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{GUIAS[i.clave]}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Guía completa de credenciales en <code className="px-1 rounded" style={{ background: 'var(--surface-muted)' }}>docs/INTEGRACIONES.md</code>.
        </p>
      </div>
    </main>
  );
}

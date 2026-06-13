import Image from 'next/image';
import { requireRole } from '@/lib/dal';
import { getCurrentUser } from '@/lib/dal';
import { getClientePorEmail } from '@/lib/clientes';
import { listarDocumentos } from '@/lib/documentos';
import LogoutButton from '@/app/components/LogoutButton';
import CodigoAcceso from './CodigoAcceso';

export const metadata = { title: 'Mi acceso — Davinci Labs' };

const ESTADO_DOC: Record<string, { label: string; badge: string; paso: number }> = {
  RECIBIDO: { label: 'Recibido', badge: 'dv-badge-warning', paso: 1 },
  EN_PROCESO: { label: 'En proceso', badge: 'dv-badge-brand', paso: 2 },
  COMPLETADO: { label: 'Completado', badge: 'dv-badge-success', paso: 3 },
};

function PasosEstado({ paso }: { paso: number }) {
  return (
    <div className="flex items-center gap-1" title={`Paso ${paso} de 3`}>
      {[1, 2, 3].map((p) => (
        <span
          key={p}
          className="h-1 w-5 rounded-full transition-colors"
          style={{ background: p <= paso ? 'var(--accent)' : 'var(--border)' }}
        />
      ))}
    </div>
  );
}

export default async function MiAccesoPage() {
  const session = await requireRole('CLIENT');
  const user = await getCurrentUser();
  const email = user?.email ?? '';

  const [acceso, documentos] = await Promise.all([
    getClientePorEmail(email),
    listarDocumentos({ email }),
  ]);

  const venc = acceso?.fecha_renovacion_proxima
    ? new Date(acceso.fecha_renovacion_proxima).toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' })
    : null;
  const activo = acceso?.estado === 'ACTIVO';

  return (
    <main className="min-h-screen" style={{ background: 'var(--background)' }}>
      {/* Cabecera de marca */}
      <header className="dv-grad-navy text-white relative overflow-hidden">
        <svg className="absolute -right-12 -top-20 opacity-[0.07] pointer-events-none" width="300" height="300" viewBox="0 0 300 300" fill="none">
          <circle cx="150" cy="150" r="140" stroke="#4EA1FF" strokeWidth="1.5" />
          <circle cx="150" cy="150" r="105" stroke="#4EA1FF" strokeWidth="1" />
          <rect x="50" y="50" width="200" height="200" stroke="#4EA1FF" strokeWidth="0.75" />
        </svg>
        <div className="max-w-2xl mx-auto px-6 pt-8 pb-16 relative">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3 dv-animate-up">
              <div className="w-9 h-9 relative rounded-lg ring-1 ring-white/15">
                <Image src="/logo-icon.svg" alt="Davinci Labs" fill sizes="36px" className="object-contain rounded-lg" priority />
              </div>
              <div className="leading-tight">
                <p className="font-serif text-base font-semibold">Davinci</p>
                <p className="text-[9px] tracking-[0.2em] uppercase text-[#4EA1FF]">Labs</p>
              </div>
            </div>
            <LogoutButton className="text-xs text-white/50 hover:text-white transition-colors" />
          </div>
          <h1 className="font-serif text-[26px] font-semibold mt-6 dv-animate-up dv-delay-1">
            Hola, {session.nombre.split(' ')[0]}
          </h1>
          <p className="text-sm text-white/60 mt-1 dv-animate-up dv-delay-2">
            Aquí están tus accesos y documentos.
          </p>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 pb-10 space-y-6 -mt-8 relative">
        {/* Código de acceso Adobe */}
        <section className="dv-animate-up dv-delay-2">
          {acceso ? (
            <div
              className="dv-card p-5 shadow-sm"
              style={!activo ? { borderColor: 'var(--danger)', background: 'var(--danger-soft)' } : undefined}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="dv-eyebrow">Tu acceso Adobe Creative Cloud</span>
                </div>
                <span className={`dv-badge ${activo ? 'dv-badge-success' : 'dv-badge-danger'}`}>
                  ● {activo ? 'Activo' : acceso.estado}
                </span>
              </div>
              <CodigoAcceso
                email={acceso.email_adobe ?? ''}
                password={acceso['contraseña_adobe_encriptada'] ?? ''}
              />
              <div className="flex items-center justify-between mt-4 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Ingresa en{' '}
                  <a href="https://account.adobe.com" target="_blank" className="font-medium hover:underline" style={{ color: 'var(--accent-hover)' }}>
                    account.adobe.com
                  </a>{' '}
                  con estas credenciales.
                </p>
                {venc && <span className="text-xs shrink-0 ml-3" style={{ color: 'var(--text-muted)' }}>Vence: {venc}</span>}
              </div>
            </div>
          ) : (
            <div className="dv-card p-5 text-sm" style={{ color: 'var(--text-secondary)' }}>
              No tienes una suscripción Adobe activa registrada con {email}.
            </div>
          )}
        </section>

        {/* Documentos */}
        <section className="dv-animate-up dv-delay-3">
          <h2 className="font-serif text-base font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
            Mis documentos
          </h2>
          {documentos.length === 0 ? (
            <div className="dv-card p-5 text-sm" style={{ color: 'var(--text-secondary)' }}>
              Aún no tienes documentos enviados.
            </div>
          ) : (
            <div className="space-y-2">
              {documentos.map((d, i) => {
                const e = ESTADO_DOC[d.estado] ?? ESTADO_DOC.RECIBIDO;
                return (
                  <div key={d.id} className={`dv-card dv-hover-lift p-4 flex items-center justify-between gap-3 dv-animate-up dv-delay-${Math.min(i + 3, 6)}`}>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{d.nombre_archivo}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          {d.tipo_servicio} · {new Date(d.created_at).toLocaleDateString('es-PE')}
                        </p>
                        <PasosEstado paso={e.paso} />
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`dv-badge ${e.badge}`}>{e.label}</span>
                      {d.reporte_ia_url && (
                        <a href={d.reporte_ia_url} target="_blank" className="text-xs hover:underline font-medium" style={{ color: 'var(--brand)' }}>🤖 IA ↗</a>
                      )}
                      {d.reporte_similitud_url && (
                        <a href={d.reporte_similitud_url} target="_blank" className="text-xs hover:underline font-medium" style={{ color: 'var(--accent-hover)' }}>📊 Similitud ↗</a>
                      )}
                      {d.url_informe && (
                        <a href={d.url_informe} target="_blank" className="text-xs hover:underline font-medium" style={{ color: 'var(--success)' }}>Ver informe ↗</a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <p className="text-center text-[11px] pt-2" style={{ color: 'var(--text-muted)' }}>
          © {new Date().getFullYear()} Davinci Labs · ¿Dudas? Escríbenos por WhatsApp.
        </p>
      </div>
    </main>
  );
}

import { requireRole } from '@/lib/dal';
import { tieneAcceso, getCuentaAdobe } from '@/lib/portal';
import Link from 'next/link';

export const metadata = { title: 'Adobe Creative Cloud · Portal — Davinci Labs' };

export default async function AdobePortalPage() {
  const session = await requireRole('CLIENT');
  const [acceso, cuenta] = await Promise.all([
    tieneAcceso(session.userId, 'adobe'),
    getCuentaAdobe(session.userId),
  ]);

  const hoy = new Date();
  const vence = cuenta?.fecha_vencimiento ? new Date(cuenta.fecha_vencimiento) : null;
  const diasRestantes = vence ? Math.ceil((vence.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24)) : null;
  const vigente = diasRestantes === null ? false : diasRestantes > 0;

  return (
    <div className="p-6 lg:p-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm mb-1" style={{ color: 'var(--text-muted)' }}>
          <Link href="/portal" style={{ color: 'var(--text-muted)' }}>Portal</Link>
          <span>/</span>
          <span>Adobe</span>
        </div>
        <h1 className="text-2xl font-serif font-bold" style={{ color: 'var(--text)' }}>
          Adobe Creative Cloud
        </h1>
      </div>

      {!acceso ? (
        <div className="rounded-2xl p-10 text-center" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <p className="text-4xl mb-4">🔒</p>
          <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--text)' }}>
            Servicio Adobe no activado
          </h2>
          <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>
            Contáctanos por WhatsApp para adquirir una cuenta Adobe Creative Cloud.
          </p>
          <a
            href="https://wa.me/51987654321?text=Hola,%20quiero%20activar%20Adobe%20Creative%20Cloud%20en%20mi%20cuenta%20Davinci"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white"
            style={{ background: '#25d366' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M11.5 2C6.261 2 2 6.261 2 11.5S6.261 21 11.5 21c1.963 0 3.793-.57 5.332-1.553L21 21l-1.553-4.168A9.442 9.442 0 0 0 21 11.5C21 6.261 16.739 2 11.5 2zm0 17.143A7.643 7.643 0 1 1 11.5 3.857a7.643 7.643 0 0 1 0 15.286z"/></svg>
            Contactar por WhatsApp
          </a>
        </div>
      ) : !cuenta ? (
        <div className="rounded-2xl p-8 text-center" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <p className="text-3xl mb-3">⏳</p>
          <h2 className="font-semibold mb-1" style={{ color: 'var(--text)' }}>Cuenta en proceso de asignación</h2>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Tu acceso ha sido aprobado. El equipo asignará tu cuenta Adobe en breve.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Estado */}
          <div
            className="flex items-center gap-4 p-5 rounded-2xl"
            style={{
              background: vigente ? 'var(--success-soft)' : 'var(--danger-soft)',
              border: `1px solid ${vigente ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'}`,
            }}
          >
            <span className="text-3xl">{vigente ? '✅' : '⚠️'}</span>
            <div>
              <p className="font-semibold" style={{ color: vigente ? 'var(--success)' : 'var(--danger)' }}>
                {vigente ? 'Cuenta activa' : 'Cuenta vencida'}
              </p>
              {diasRestantes !== null && (
                <p className="text-sm mt-0.5" style={{ color: vigente ? 'var(--success)' : 'var(--danger)' }}>
                  {vigente ? `Vence en ${diasRestantes} días` : `Venció hace ${Math.abs(diasRestantes)} días`}
                </p>
              )}
            </div>
          </div>

          {/* Datos de la cuenta */}
          <div
            className="rounded-2xl p-6 space-y-4"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <div className="flex items-center gap-3 pb-4" style={{ borderBottom: '1px solid var(--border)' }}>
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                style={{ background: 'rgba(255,0,0,0.06)' }}
              >
                🎨
              </div>
              <div>
                <h2 className="font-bold text-lg" style={{ color: 'var(--text)' }}>{cuenta.plan}</h2>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Adobe Creative Cloud</p>
              </div>
            </div>

            {[
              { label: 'Email de acceso', value: cuenta.email_adobe, mono: true },
              { label: 'Plan', value: cuenta.plan },
              {
                label: 'Fecha de inicio',
                value: cuenta.fecha_inicio
                  ? new Date(cuenta.fecha_inicio).toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' })
                  : '—',
              },
              {
                label: 'Vencimiento',
                value: vence
                  ? vence.toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' })
                  : '—',
              },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between py-1">
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{row.label}</span>
                <span
                  className={`text-sm font-medium ${row.mono ? 'font-mono' : ''}`}
                  style={{ color: 'var(--text)' }}
                >
                  {row.value}
                </span>
              </div>
            ))}

            {cuenta.notas && (
              <div className="pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Notas</p>
                <p className="text-sm" style={{ color: 'var(--text)' }}>{cuenta.notas}</p>
              </div>
            )}
          </div>

          {/* Instrucciones */}
          <div
            className="rounded-2xl p-5"
            style={{ background: 'rgba(26,43,74,0.04)', border: '1px solid var(--border)' }}
          >
            <h3 className="font-semibold text-sm mb-3" style={{ color: 'var(--text)' }}>Cómo acceder</h3>
            <ol className="space-y-2 text-sm" style={{ color: 'var(--text-muted)' }}>
              <li className="flex gap-2"><span className="font-bold" style={{ color: 'var(--brand)' }}>1.</span> Ve a <a href="https://account.adobe.com" target="_blank" rel="noopener noreferrer" className="underline" style={{ color: 'var(--brand)' }}>account.adobe.com</a></li>
              <li className="flex gap-2"><span className="font-bold" style={{ color: 'var(--brand)' }}>2.</span> Inicia sesión con el email indicado arriba</li>
              <li className="flex gap-2"><span className="font-bold" style={{ color: 'var(--brand)' }}>3.</span> Si es tu primer acceso, revisa tu correo para la invitación</li>
            </ol>
          </div>

          <a
            href="https://wa.me/51987654321?text=Hola,%20tengo%20una%20pregunta%20sobre%20mi%20cuenta%20Adobe"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-medium"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
          >
            ¿Problemas? Contáctanos por WhatsApp
          </a>
        </div>
      )}
    </div>
  );
}

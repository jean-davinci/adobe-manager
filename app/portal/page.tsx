import Link from 'next/link';
import { requireRole } from '@/lib/dal';
import { getSaldo, listarPedidos, listarAccesoServicios } from '@/lib/portal';

const ESTADO_BADGE: Record<string, { label: string; color: string; bg: string }> = {
  pendiente:   { label: 'Pendiente',   color: 'var(--warning)',     bg: 'var(--warning-soft)' },
  procesando:  { label: 'Procesando',  color: 'var(--brand)',       bg: 'rgba(26,43,74,0.08)' },
  completado:  { label: 'Completado',  color: 'var(--success)',     bg: 'var(--success-soft)' },
  error:       { label: 'Error',       color: 'var(--danger)',      bg: 'var(--danger-soft)' },
};

export default async function PortalPage() {
  const session = await requireRole('CLIENT');
  const [saldo, pedidos, accesos] = await Promise.all([
    getSaldo(session.userId),
    listarPedidos(session.userId),
    listarAccesoServicios(session.userId),
  ]);

  const recientes = pedidos.slice(0, 5);
  const tieneTurnitin = accesos.some((a) => a.servicio === 'turnitin' && a.activo);
  const tieneAdobe = accesos.some((a) => a.servicio === 'adobe' && a.activo);
  const completados = pedidos.filter((p) => p.estado === 'completado').length;
  const pendientes = pedidos.filter((p) => ['pendiente', 'procesando'].includes(p.estado)).length;

  const hora = new Date().getHours();
  const saludo = hora < 12 ? 'Buenos días' : hora < 18 ? 'Buenas tardes' : 'Buenas noches';

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <p className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>{saludo}</p>
        <h1 className="text-2xl font-serif font-bold" style={{ color: 'var(--text)' }}>
          {session.nombre.split(' ')[0]} 👋
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          Bienvenido a tu portal de Davinci Labs
        </p>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {[
          { label: 'Créditos disponibles', value: saldo, icon: '💳', color: 'var(--warning)' },
          { label: 'Documentos enviados', value: pedidos.length, icon: '📄', color: 'var(--brand)' },
          { label: 'Completados', value: completados, icon: '✅', color: 'var(--success)' },
          { label: 'En proceso', value: pendientes, icon: '⚙️', color: 'var(--accent)' },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-xl p-4"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <p className="text-2xl mb-1">{s.icon}</p>
            <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Servicios */}
      <h2 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>
        Mis servicios
      </h2>
      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        {/* Turnitin card */}
        <Link
          href={tieneTurnitin ? '/portal/turnitin' : '/portal/creditos'}
          className="group rounded-2xl p-6 transition-all hover:shadow-md hover:-translate-y-0.5"
          style={{ background: 'var(--surface)', border: `2px solid ${tieneTurnitin ? 'var(--brand)' : 'var(--border)'}` }}
        >
          <div className="flex items-start justify-between mb-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
              style={{ background: tieneTurnitin ? 'rgba(26,43,74,0.08)' : 'var(--surface-2)' }}
            >
              📊
            </div>
            <span
              className="text-xs px-2 py-1 rounded-full font-medium"
              style={{
                background: tieneTurnitin ? 'var(--success-soft)' : 'var(--surface-2)',
                color: tieneTurnitin ? 'var(--success)' : 'var(--text-muted)',
              }}
            >
              {tieneTurnitin ? 'Activo' : 'Sin acceso'}
            </span>
          </div>
          <h3 className="font-semibold text-base mb-1" style={{ color: 'var(--text)' }}>Turnitin</h3>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {tieneTurnitin
              ? 'Sube tu documento y recibe el informe con baja similitud.'
              : 'Contacta al equipo para activar este servicio.'}
          </p>
          {tieneTurnitin && (
            <div className="flex items-center gap-1 mt-3 text-xs font-medium" style={{ color: 'var(--brand)' }}>
              Subir documento
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
            </div>
          )}
        </Link>

        {/* Adobe card */}
        <Link
          href="/portal/adobe"
          className="group rounded-2xl p-6 transition-all hover:shadow-md hover:-translate-y-0.5"
          style={{ background: 'var(--surface)', border: `2px solid ${tieneAdobe ? '#FF0000' : 'var(--border)'}` }}
        >
          <div className="flex items-start justify-between mb-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
              style={{ background: tieneAdobe ? 'rgba(255,0,0,0.06)' : 'var(--surface-2)' }}
            >
              🎨
            </div>
            <span
              className="text-xs px-2 py-1 rounded-full font-medium"
              style={{
                background: tieneAdobe ? 'rgba(255,0,0,0.08)' : 'var(--surface-2)',
                color: tieneAdobe ? '#cc0000' : 'var(--text-muted)',
              }}
            >
              {tieneAdobe ? 'Activo' : 'Sin acceso'}
            </span>
          </div>
          <h3 className="font-semibold text-base mb-1" style={{ color: 'var(--text)' }}>Adobe Creative Cloud</h3>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {tieneAdobe
              ? 'Accede a los datos de tu cuenta Adobe asignada.'
              : 'Contacta al equipo para activar tu cuenta Adobe.'}
          </p>
          {tieneAdobe && (
            <div className="flex items-center gap-1 mt-3 text-xs font-medium" style={{ color: '#cc0000' }}>
              Ver mi cuenta
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
            </div>
          )}
        </Link>
      </div>

      {/* Créditos CTA si saldo bajo */}
      {saldo === 0 && (
        <div
          className="rounded-2xl p-5 mb-8 flex items-center gap-4"
          style={{ background: 'rgba(255,193,7,0.08)', border: '1px solid rgba(255,193,7,0.3)' }}
        >
          <span className="text-3xl flex-shrink-0">💳</span>
          <div className="flex-1">
            <p className="font-semibold text-sm" style={{ color: 'var(--text)' }}>Sin créditos disponibles</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Compra créditos para enviar documentos a procesar.
            </p>
          </div>
          <Link
            href="/portal/creditos"
            className="px-4 py-2 rounded-xl text-sm font-medium text-white flex-shrink-0"
            style={{ background: 'var(--brand)' }}
          >
            Comprar
          </Link>
        </div>
      )}

      {/* Pedidos recientes */}
      {recientes.length > 0 && (
        <>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Documentos recientes
            </h2>
            <Link href="/portal/turnitin" className="text-xs font-medium" style={{ color: 'var(--brand)' }}>
              Ver todos
            </Link>
          </div>
          <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
            {recientes.map((p, i) => {
              const badge = ESTADO_BADGE[p.estado] ?? ESTADO_BADGE.pendiente;
              return (
                <div
                  key={p.id}
                  className="flex items-center gap-3 px-5 py-3.5"
                  style={{
                    background: 'var(--surface)',
                    borderTop: i > 0 ? '1px solid var(--border)' : undefined,
                  }}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
                    style={{ background: 'var(--surface-2)' }}
                  >
                    📄
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>
                      {p.nombre_archivo}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {new Date(p.created_at).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {p.estado === 'completado' && p.similitud_pct !== null && (
                      <span
                        className="text-xs font-bold px-2 py-0.5 rounded-full"
                        style={{
                          background: p.similitud_pct <= 15 ? 'var(--success-soft)' : 'var(--warning-soft)',
                          color: p.similitud_pct <= 15 ? 'var(--success)' : 'var(--warning)',
                        }}
                      >
                        {p.similitud_pct}% similitud
                      </span>
                    )}
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ background: badge.bg, color: badge.color }}
                    >
                      {badge.label}
                    </span>
                    {p.reporte_url && (
                      <a
                        href={p.reporte_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-medium underline"
                        style={{ color: 'var(--brand)' }}
                      >
                        Descargar
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {recientes.length === 0 && (
        <div
          className="rounded-2xl p-10 text-center"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <p className="text-3xl mb-3">📭</p>
          <p className="font-medium" style={{ color: 'var(--text)' }}>Aún no has subido documentos</p>
          <p className="text-sm mt-1 mb-4" style={{ color: 'var(--text-muted)' }}>
            Sube tu tesis o trabajo para recibir el informe Turnitin.
          </p>
          <Link
            href={tieneTurnitin ? '/portal/turnitin' : '/portal/creditos'}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white"
            style={{ background: 'var(--brand)' }}
          >
            {tieneTurnitin ? 'Subir mi primer documento' : 'Comprar créditos'}
          </Link>
        </div>
      )}
    </div>
  );
}

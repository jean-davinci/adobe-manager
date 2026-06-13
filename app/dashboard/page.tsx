import Link from 'next/link';
import { requireRole } from '@/lib/dal';
import { listarClientes } from '@/lib/clientes';
import { listarDocumentos } from '@/lib/documentos';
import { listarContactos } from '@/lib/crm';
import { resumenDashboard } from '@/lib/finanzas';

export const metadata = { title: 'Panel — Davinci Labs' };

const soles = (n: number) =>
  'S/. ' + Number(n).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const ICONOS: Record<string, React.ReactNode> = {
  adobe: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M9 8h6M9 12h6M9 16h4" />
    </svg>
  ),
  turnitin: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6M9 13h6M9 17h4" />
    </svg>
  ),
  crm: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8z" />
    </svg>
  ),
  finanzas: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  ),
  servicios: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" />
    </svg>
  ),
  integraciones: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 2v6M15 2v6M9 22v-3M15 22v-3" /><rect x="5" y="8" width="14" height="11" rx="2" />
    </svg>
  ),
};

// Si la DB no responde, el panel degrada con elegancia (sin métricas).
const intenta = <T,>(p: Promise<T>): Promise<T | null> => p.catch(() => null);

export default async function DashboardPage() {
  const session = await requireRole('ADMIN', 'OPERATOR');

  const [clientes, docs, contactos, resumen] = await Promise.all([
    intenta(listarClientes()),
    intenta(listarDocumentos()),
    intenta(listarContactos()),
    intenta(resumenDashboard()),
  ]);

  const hoy = new Date();
  const activos = clientes?.filter((c) => c.estado === 'ACTIVO').length ?? null;
  const porVencer =
    clientes?.filter((c) => {
      if (c.estado !== 'ACTIVO' || !c.fecha_renovacion_proxima) return false;
      const dias = (new Date(c.fecha_renovacion_proxima).getTime() - hoy.getTime()) / 86400000;
      return dias >= 0 && dias <= 15;
    }).length ?? 0;
  const enProceso = docs?.filter((d) => d.estado === 'EN_PROCESO').length ?? null;
  const recibidos = docs?.filter((d) => d.estado === 'RECIBIDO').length ?? 0;
  const noLeidos = contactos?.reduce((a, c) => a + (c.no_leidos ?? 0), 0) ?? null;
  const neto = resumen?.mesActual?.neto ?? null;

  const hora = hoy.getHours();
  const saludo = hora < 12 ? 'Buenos días' : hora < 19 ? 'Buenas tardes' : 'Buenas noches';
  const fecha = hoy.toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const KPIS = [
    { label: 'Afiliados activos', valor: activos ?? '—', sub: porVencer > 0 ? `${porVencer} por vencer en 15 días` : 'Sin vencimientos próximos', alerta: porVencer > 0, href: '/dashboard/afiliados' },
    { label: 'Documentos en proceso', valor: enProceso ?? '—', sub: recibidos > 0 ? `${recibidos} recibidos en cola` : 'Cola al día', alerta: recibidos > 0, href: '/dashboard/documentos' },
    { label: 'Mensajes sin leer', valor: noLeidos ?? '—', sub: 'CRM WhatsApp', alerta: (noLeidos ?? 0) > 0, href: '/dashboard/crm' },
    { label: 'Margen neto del mes', valor: neto == null ? '—' : soles(neto), sub: 'Ingresos − egresos', alerta: (neto ?? 0) < 0, href: '/dashboard/finanzas' },
  ];

  const MODULOS = [
    { href: '/dashboard/afiliados', icono: 'adobe', label: 'Adobe / Afiliados', desc: 'Cuentas Creative Cloud, códigos de acceso y renovaciones.', dato: activos != null ? `${activos} activos` : null },
    { href: '/dashboard/documentos', icono: 'turnitin', label: 'Turnitin / Documentos', desc: 'Recepción, procesamiento IA + similitud e informes.', dato: docs ? `${docs.length} documentos` : null },
    { href: '/dashboard/crm', icono: 'crm', label: 'CRM WhatsApp', desc: 'Conversaciones, etiquetas, respuestas rápidas y notas.', dato: contactos ? `${contactos.length} contactos` : null },
    { href: '/dashboard/finanzas', icono: 'finanzas', label: 'Finanzas', desc: 'Ingresos, egresos, proveedores y reportes exportables.', dato: neto != null ? `${soles(neto)} neto` : null },
    { href: '/servicios', icono: 'servicios', label: 'Centro de Servicios', desc: 'Turnitin, reducción IA, asesorías y tesis.', dato: null },
    { href: '/dashboard/integraciones', icono: 'integraciones', label: 'Integraciones', desc: 'Gmail, Drive, WhatsApp y scrapers.', dato: null, adminOnly: true },
  ].filter((m) => !m.adminOnly || session.rol === 'ADMIN');

  return (
    <main className="min-h-screen" style={{ background: 'var(--background)' }}>
      {/* Hero de bienvenida */}
      <div className="dv-grad-navy text-white relative overflow-hidden">
        {/* Ornamento: círculos concéntricos estilo Vitruvio */}
        <svg className="absolute -right-16 -top-24 opacity-[0.07] pointer-events-none" width="380" height="380" viewBox="0 0 380 380" fill="none">
          <circle cx="190" cy="190" r="180" stroke="#4EA1FF" strokeWidth="1.5" />
          <circle cx="190" cy="190" r="140" stroke="#4EA1FF" strokeWidth="1" />
          <circle cx="190" cy="190" r="100" stroke="#4EA1FF" strokeWidth="0.75" />
          <rect x="63" y="63" width="254" height="254" stroke="#4EA1FF" strokeWidth="0.75" />
        </svg>
        <div className="max-w-7xl mx-auto px-6 pt-9 pb-24 relative">
          <p className="dv-eyebrow !text-[#4EA1FF] dv-animate-in">{fecha}</p>
          <h1 className="font-serif text-[28px] font-semibold mt-1 dv-animate-up">
            {saludo}, {session.nombre.split(' ')[0]}
          </h1>
          <p className="text-sm text-white/60 mt-1 dv-animate-up dv-delay-1">
            Este es el estado de Davinci Labs hoy.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 -mt-16 relative">
          {KPIS.map((k, i) => (
            <Link
              key={k.label}
              href={k.href}
              className={`dv-card dv-hover-lift p-5 block dv-animate-up dv-delay-${i + 1}`}
            >
              <p className="dv-eyebrow mb-2">{k.label}</p>
              <p className="text-2xl font-bold font-serif" style={{ color: 'var(--text-primary)' }}>
                {k.valor}
              </p>
              <p className="text-xs mt-1.5" style={{ color: k.alerta ? 'var(--warning)' : 'var(--text-muted)' }}>
                {k.alerta && '● '}{k.sub}
              </p>
            </Link>
          ))}
        </div>

        {/* Módulos */}
        <section>
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="font-serif text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Módulos</h2>
            <span className="dv-eyebrow">{session.rol === 'ADMIN' ? 'Administrador' : 'Operador'}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {MODULOS.map((m, i) => (
              <Link
                key={m.href}
                href={m.href}
                className={`dv-card dv-hover-lift p-5 group block dv-animate-up dv-delay-${Math.min(i + 2, 6)}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="dv-icon-tile transition-colors" style={{ background: 'var(--brand-soft)', color: 'var(--brand)' }}>
                    {ICONOS[m.icono]}
                  </div>
                  <span
                    className="text-lg transition-transform duration-200 group-hover:translate-x-1"
                    style={{ color: 'var(--accent)' }}
                  >
                    →
                  </span>
                </div>
                <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{m.label}</h3>
                <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{m.desc}</p>
                {m.dato && (
                  <span className="dv-badge dv-badge-accent mt-3">{m.dato}</span>
                )}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

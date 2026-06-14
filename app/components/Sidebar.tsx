'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { logout } from '@/app/actions/auth';

export type SesionUI = { nombre: string; rol: 'ADMIN' | 'OPERATOR' | 'CLIENT' } | null;

type NavItem = {
  href: string;
  label: string;
  sublabel: string;
  adminOnly?: boolean;
  icon: React.ReactNode;
};

const ic = (paths: React.ReactNode) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    {paths}
  </svg>
);

const NAV_PRINCIPAL: NavItem[] = [
  {
    href: '/dashboard',
    label: 'Panel general',
    sublabel: 'Vista de inicio',
    icon: ic(<><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></>),
  },
];

const NAV_MODULOS: NavItem[] = [
  {
    href: '/dashboard/afiliados',
    label: 'Adobe',
    sublabel: 'Afiliados Creative Cloud',
    icon: ic(<><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M9 8h6M9 12h6M9 16h4" /></>),
  },
  {
    href: '/dashboard/documentos',
    label: 'Turnitin',
    sublabel: 'Documentos e informes',
    icon: ic(<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6M9 13h6M9 17h4" /></>),
  },
  {
    href: '/dashboard/informes',
    label: 'Informes',
    sublabel: 'Generación automática',
    icon: ic(<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /><path d="m9 15 2 2 4-4" /></>),
  },
  {
    href: '/dashboard/crm',
    label: 'CRM WhatsApp',
    sublabel: 'Conversaciones',
    icon: ic(<><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8z" /></>),
  },
  {
    href: '/dashboard/finanzas',
    label: 'Finanzas',
    sublabel: 'Ingresos y egresos',
    icon: ic(<><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></>),
  },
  {
    href: '/dashboard/asesorias',
    label: 'Asesorías',
    sublabel: 'Agenda y reservas',
    icon: ic(<><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /><path d="m9 16 2 2 4-4" /></>),
  },
  {
    href: '/servicios',
    label: 'Servicios',
    sublabel: 'Centro académico',
    icon: ic(<><path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" /></>),
  },
];

const NAV_PORTAL: NavItem[] = [
  {
    href: '/dashboard/portal',
    label: 'Portal Clientes',
    sublabel: 'Pedidos · Pagos · Accesos',
    icon: ic(<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>),
  },
];

const NAV_SISTEMA: NavItem[] = [
  {
    href: '/dashboard/integraciones',
    label: 'Integraciones',
    sublabel: 'Gmail · Drive · WhatsApp',
    adminOnly: true,
    icon: ic(<><path d="M9 2v6M15 2v6M9 22v-3M15 22v-3" /><rect x="5" y="8" width="14" height="11" rx="2" /></>),
  },
];

function NavLink({ item, active, collapsed }: { item: NavItem; active: boolean; collapsed: boolean }) {
  return (
    <Link
      href={item.href}
      title={collapsed ? item.label : undefined}
      className={`group relative flex items-center gap-3 ${
        collapsed ? 'justify-center px-2' : 'px-3'
      } py-2.5 rounded-lg text-sm transition-all duration-150 ${
        active
          ? 'bg-white/[0.08] text-white'
          : 'text-white/60 hover:text-white hover:bg-white/[0.04] hover:translate-x-0.5'
      }`}
    >
      {active && (
        <span
          className="absolute left-0 top-2 bottom-2 w-[2.5px] rounded-full"
          style={{ background: '#4EA1FF' }}
        />
      )}
      <span className={`flex-shrink-0 transition-colors ${active ? 'text-[#4EA1FF]' : 'group-hover:text-[#4EA1FF]/80'}`}>
        {item.icon}
      </span>
      {!collapsed && (
        <div className="flex flex-col leading-tight overflow-hidden">
          <span className={`whitespace-nowrap ${active ? 'font-medium' : ''}`}>{item.label}</span>
          <span className="text-[11px] text-white/35 whitespace-nowrap">{item.sublabel}</span>
        </div>
      )}
    </Link>
  );
}

export default function Sidebar({ sesion }: { sesion: SesionUI }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    if (saved !== null) setCollapsed(saved === 'true');
    setMounted(true);
  }, []);

  const toggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem('sidebar-collapsed', String(next));
  };

  // Evitar flash en primer render
  if (!mounted) {
    return <aside className="w-64 h-screen sticky top-0 dv-grad-navy" />;
  }

  const esAdmin = sesion?.rol === 'ADMIN';
  const esActivo = (href: string) =>
    href === '/'
      ? pathname === '/'
      : href === '/dashboard'
        ? pathname === '/dashboard'
        : pathname.startsWith(href);

  const iniciales = (sesion?.nombre ?? '?')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const seccion = (titulo: string, items: NavItem[]) => {
    const visibles = items.filter((i) => !i.adminOnly || esAdmin);
    if (visibles.length === 0) return null;
    return (
      <div>
        {!collapsed && (
          <div className="px-2 pt-4 pb-1.5">
            <span className="text-[10px] tracking-[0.15em] uppercase text-white/35 font-semibold">{titulo}</span>
          </div>
        )}
        {collapsed && <div className="mx-2 my-3 border-t border-white/[0.08]" />}
        <div className="space-y-0.5">
          {visibles.map((item) => (
            <NavLink key={item.href} item={item} active={esActivo(item.href)} collapsed={collapsed} />
          ))}
        </div>
      </div>
    );
  };

  return (
    <aside
      className={`${
        collapsed ? 'w-16' : 'w-64'
      } h-screen sticky top-0 flex flex-col dv-grad-navy text-white transition-[width] duration-200 ease-out z-30`}
      style={{ boxShadow: 'inset -1px 0 0 rgba(255,255,255,0.06)' }}
    >
      {/* Logo + nombre */}
      <Link
        href="/dashboard"
        className={`flex items-center gap-3 ${collapsed ? 'justify-center px-2' : 'px-4'} py-5 hover:bg-white/[0.04] transition-colors`}
      >
        <div className="flex-shrink-0 w-8 h-8 relative rounded-md shadow-[0_2px_10px_rgba(78,161,255,0.35)] ring-1 ring-white/15">
          <Image src="/logo-icon.svg" alt="Davinci Labs" fill sizes="32px" className="object-contain rounded-md" priority />
        </div>
        {!collapsed && (
          <div className="flex flex-col leading-tight overflow-hidden">
            <span className="font-serif text-[17px] font-semibold tracking-tight whitespace-nowrap">Davinci</span>
            <span className="text-[10px] tracking-[0.18em] uppercase text-[#4EA1FF]/80 whitespace-nowrap">Labs</span>
          </div>
        )}
      </Link>

      <div className="mx-4 border-t border-white/[0.08]" />

      {/* Navegación */}
      <nav className={`flex-1 ${collapsed ? 'px-2' : 'px-3'} pb-4 overflow-y-auto overflow-x-hidden`}>
        {seccion('Principal', NAV_PRINCIPAL)}
        {seccion('Módulos', NAV_MODULOS)}
        {seccion('Portal', NAV_PORTAL)}
        {seccion('Sistema', NAV_SISTEMA)}
      </nav>

      {/* Usuario + acciones */}
      <div className="px-3 py-3 border-t border-white/[0.08] space-y-1">
        {sesion && (
          <div className={`flex items-center gap-2.5 ${collapsed ? 'justify-center px-0' : 'px-2'} py-2`}>
            <div
              className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold bg-white/[0.08] text-[#4EA1FF] border border-white/10"
              title={collapsed ? `${sesion.nombre} · ${sesion.rol}` : undefined}
            >
              {iniciales}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0 leading-tight">
                <p className="text-[13px] font-medium text-white/90 truncate">{sesion.nombre}</p>
                <p className="text-[10px] tracking-wide uppercase text-white/40">
                  {sesion.rol === 'ADMIN' ? 'Administrador' : sesion.rol === 'OPERATOR' ? 'Operador' : 'Cliente'}
                </p>
              </div>
            )}
            {!collapsed && (
              <form action={logout}>
                <button
                  type="submit"
                  title="Cerrar sesión"
                  className="w-7 h-7 flex items-center justify-center rounded-md text-white/40 hover:text-red-300 hover:bg-white/[0.06] transition-colors"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
                  </svg>
                </button>
              </form>
            )}
          </div>
        )}
        <button
          onClick={toggle}
          title={collapsed ? 'Expandir' : 'Colapsar'}
          className={`w-full flex items-center gap-3 ${
            collapsed ? 'justify-center px-2' : 'px-3'
          } py-2 rounded-lg text-sm text-white/50 hover:text-white hover:bg-white/[0.04] transition-colors`}
        >
          <svg
            width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round"
            className={`flex-shrink-0 transition-transform duration-200 ${collapsed ? 'rotate-180' : ''}`}
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
          {!collapsed && <span className="text-[13px]">Colapsar</span>}
        </button>
      </div>
    </aside>
  );
}

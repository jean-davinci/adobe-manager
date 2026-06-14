'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { logout } from '@/app/actions/auth';

const ic = (paths: React.ReactNode) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    {paths}
  </svg>
);

const NAV = [
  {
    href: '/portal',
    label: 'Inicio',
    sublabel: 'Mi panel',
    icon: ic(<><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></>),
  },
  {
    href: '/portal/turnitin',
    label: 'Turnitin',
    sublabel: 'Subir documentos',
    icon: ic(<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6M9 13h6M9 17h4" /></>),
  },
  {
    href: '/portal/adobe',
    label: 'Adobe',
    sublabel: 'Mi cuenta Creative Cloud',
    icon: ic(<><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M9 8h6M9 12h6M9 16h4" /></>),
  },
  {
    href: '/portal/creditos',
    label: 'Mis créditos',
    sublabel: 'Comprar y ver historial',
    icon: ic(<><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></>),
  },
];

export default function PortalSidebar({ nombre, saldo }: { nombre: string; saldo: number }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const iniciales = nombre.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
  const esActivo = (href: string) =>
    href === '/portal' ? pathname === '/portal' : pathname.startsWith(href);

  return (
    <>
      {/* Mobile header */}
      <header
        className="lg:hidden flex items-center justify-between px-4 py-3 sticky top-0 z-40"
        style={{ background: 'var(--brand)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}
      >
        <Link href="/portal" className="flex items-center gap-2.5 text-white">
          <div className="w-7 h-7 relative rounded-md ring-1 ring-white/20">
            <Image src="/logo-icon.svg" alt="Davinci" fill sizes="28px" className="object-contain rounded-md" />
          </div>
          <span className="font-serif font-semibold text-base tracking-tight">Davinci Labs</span>
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-xs text-white/80 bg-white/10 px-2 py-1 rounded-full">
            {saldo} crédito{saldo !== 1 ? 's' : ''}
          </span>
          <button
            onClick={() => setOpen(!open)}
            className="w-8 h-8 flex items-center justify-center text-white rounded-md hover:bg-white/10"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {open ? <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></> : <><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" /></>}
            </svg>
          </button>
        </div>
      </header>

      {/* Mobile nav drawer */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 z-30 pt-14"
          onClick={() => setOpen(false)}
        >
          <nav
            className="absolute top-0 right-0 w-64 h-full p-4 space-y-1 shadow-2xl"
            style={{ background: 'var(--brand)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  esActivo(item.href) ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white hover:bg-white/05'
                }`}
              >
                <span className={esActivo(item.href) ? 'text-white' : 'text-white/50'}>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
            <div className="pt-4 border-t border-white/10">
              <form action={logout}>
                <button type="submit" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/60 hover:text-red-300 w-full">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></svg>
                  Cerrar sesión
                </button>
              </form>
            </div>
          </nav>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside
        className="hidden lg:flex flex-col w-60 h-screen sticky top-0 flex-shrink-0"
        style={{ background: 'var(--brand)', boxShadow: 'inset -1px 0 0 rgba(255,255,255,0.08)' }}
      >
        {/* Logo */}
        <Link
          href="/portal"
          className="flex items-center gap-3 px-5 py-5 hover:bg-white/[0.04] transition-colors"
        >
          <div className="w-8 h-8 relative rounded-md shadow-[0_2px_10px_rgba(0,0,0,0.3)] ring-1 ring-white/15 flex-shrink-0">
            <Image src="/logo-icon.svg" alt="Davinci Labs" fill sizes="32px" className="object-contain rounded-md" />
          </div>
          <div className="leading-tight">
            <p className="font-serif text-[17px] font-semibold tracking-tight text-white">Davinci</p>
            <p className="text-[10px] tracking-[0.18em] uppercase text-white/60">Labs · Portal</p>
          </div>
        </Link>

        <div className="mx-4 border-t border-white/10" />

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV.map((item) => {
            const active = esActivo(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                  active
                    ? 'bg-white/10 text-white'
                    : 'text-white/55 hover:text-white hover:bg-white/[0.05] hover:translate-x-0.5'
                }`}
              >
                {active && (
                  <span className="absolute left-0 top-2 bottom-2 w-[2.5px] rounded-full bg-white/80" />
                )}
                <span className={`flex-shrink-0 ${active ? 'text-white' : 'text-white/50 group-hover:text-white/80'}`}>
                  {item.icon}
                </span>
                <div className="leading-tight">
                  <p className={active ? 'font-medium' : ''}>{item.label}</p>
                  <p className="text-[11px] text-white/35">{item.sublabel}</p>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* User footer */}
        <div className="px-3 py-3 border-t border-white/10">
          {/* Saldo */}
          <div className="flex items-center gap-2 px-3 py-2 mb-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-yellow-300 flex-shrink-0">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
            <span className="text-xs text-white/70 flex-1">Créditos disponibles</span>
            <span className="text-sm font-bold text-yellow-300">{saldo}</span>
          </div>

          {/* User info */}
          <div className="flex items-center gap-2.5 px-2 py-2">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold bg-white/10 text-white/80 border border-white/15 flex-shrink-0">
              {iniciales}
            </div>
            <div className="flex-1 min-w-0 leading-tight">
              <p className="text-[12px] font-medium text-white/85 truncate">{nombre}</p>
              <p className="text-[10px] text-white/40 tracking-wide uppercase">Cliente</p>
            </div>
            <form action={logout}>
              <button
                type="submit"
                title="Cerrar sesión"
                className="w-7 h-7 flex items-center justify-center rounded-md text-white/35 hover:text-red-300 hover:bg-white/[0.06] transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></svg>
              </button>
            </form>
          </div>
        </div>
      </aside>
    </>
  );
}

'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

const NAV = [
  {
    href: '/',
    label: 'Adobe',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M9 8h6M9 12h6M9 16h4" />
      </svg>
    ),
  },
  {
    href: '/servicios',
    label: 'Servicios',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 7h-9M14 17H5M17 17a2 2 0 1 0 4 0 2 2 0 0 0-4 0M3 7a2 2 0 1 0 4 0 2 2 0 0 0-4 0" />
      </svg>
    ),
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Recordar estado entre recargas
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

  // Evitar parpadeo en primer render
  if (!mounted) {
    return <aside className="w-60 h-screen sticky top-0 bg-white border-r border-gray-100" />;
  }

  return (
    <aside
      className={`${collapsed ? 'w-16' : 'w-60'} h-screen sticky top-0 flex flex-col bg-white border-r border-gray-100 transition-[width] duration-200 ease-out`}
    >
      {/* Logo */}
      <Link
        href="/"
        className="flex items-center gap-2.5 px-4 py-4 border-b border-gray-100 hover:bg-gray-50 transition-colors"
      >
        <div className="flex-shrink-0 w-7 h-7 relative">
          <Image src="/logo-icon.svg" alt="Davinci" fill sizes="28px" className="object-contain" priority />
        </div>
        {!collapsed && (
          <span className="text-[17px] font-semibold text-[#1e3a5f] tracking-tight whitespace-nowrap">
            Davinci
          </span>
        )}
      </Link>

      {/* Navegacion */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-hidden">
        {NAV.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                active
                  ? 'bg-gray-100 text-gray-900 font-medium'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              {!collapsed && <span className="whitespace-nowrap">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer: boton colapsar */}
      <div className="border-t border-gray-100 px-2 py-2">
        <button
          onClick={toggle}
          title={collapsed ? 'Expandir' : 'Colapsar'}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`flex-shrink-0 transition-transform duration-200 ${
              collapsed ? 'rotate-180' : ''
            }`}
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
          {!collapsed && <span>Colapsar</span>}
        </button>
      </div>
    </aside>
  );
}
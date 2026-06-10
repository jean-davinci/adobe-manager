'use client';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '';
  // Rutas que NO usan el sidebar legacy (Adobe/Servicios): la landing pública,
  // el login y las zonas con su propia cabecera (dashboard, portal del cliente).
  const sinSidebar =
    pathname.startsWith('/excelencia') ||
    pathname === '/login' ||
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/mi-acceso') ||
    pathname.startsWith('/portal');

  if (sinSidebar) {
    return <main className="min-h-screen">{children}</main>;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 min-w-0 min-h-screen overflow-x-hidden">{children}</main>
    </div>
  );
}

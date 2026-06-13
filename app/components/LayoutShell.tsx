'use client';
import { usePathname } from 'next/navigation';
import Sidebar, { type SesionUI } from './Sidebar';

export default function LayoutShell({
  children,
  sesion,
}: {
  children: React.ReactNode;
  sesion: SesionUI;
}) {
  const pathname = usePathname() ?? '';
  // Rutas sin sidebar: landing pública ('/'), login y portal del cliente.
  const sinSidebar =
    pathname === '/' ||
    pathname.startsWith('/excelencia') ||
    pathname === '/login' ||
    pathname.startsWith('/mi-acceso') ||
    pathname.startsWith('/portal') ||
    sesion?.rol === 'CLIENT' ||
    !sesion;

  if (sinSidebar) {
    return <main className="min-h-screen">{children}</main>;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar sesion={sesion} />
      <main className="flex-1 min-w-0 min-h-screen overflow-x-hidden">{children}</main>
    </div>
  );
}

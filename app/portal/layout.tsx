import { requireRole } from '@/lib/dal';
import { getSaldo } from '@/lib/portal';
import PortalSidebar from './PortalSidebar';

export const metadata = { title: 'Portal — Davinci Labs' };

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await requireRole('CLIENT');
  const saldo = await getSaldo(session.userId);

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--surface-2)' }}>
      <PortalSidebar nombre={session.nombre} saldo={saldo} />
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}

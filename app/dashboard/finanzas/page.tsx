import { requireRole } from '@/lib/dal';
import ModuleHeader from '@/app/components/ModuleHeader';
import FinanzasClient from './FinanzasClient';

export const metadata = { title: 'Finanzas — Davinci Labs' };

export default async function FinanzasPage() {
  await requireRole('ADMIN', 'OPERATOR');

  return (
    <main className="min-h-screen" style={{ background: 'var(--background)' }}>
      <ModuleHeader
        eyebrow="Finanzas"
        titulo="Ingresos y egresos"
        descripcion="Movimientos, proveedores y reportes exportables"
        icono={
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
        }
      />
      <div className="max-w-7xl mx-auto px-6 py-8">
        <FinanzasClient />
      </div>
    </main>
  );
}

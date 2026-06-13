import { requireRole } from '@/lib/dal';
import ModuleHeader from '@/app/components/ModuleHeader';
import AsesoriasClient from './AsesoriasClient';

export const metadata = { title: 'Asesorías — Davinci Labs' };

export default async function AsesoriasPage() {
  await requireRole('ADMIN', 'OPERATOR');

  return (
    <main className="min-h-screen" style={{ background: 'var(--background)' }}>
      <ModuleHeader
        eyebrow="Agenda"
        titulo="Asesorías académicas"
        descripcion="Reservas, Google Calendar y recordatorios automáticos por WhatsApp"
        icono={
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <path d="M16 2v4M8 2v4M3 10h18" />
            <path d="m9 16 2 2 4-4" />
          </svg>
        }
      />
      <div className="max-w-5xl mx-auto px-6 py-8">
        <AsesoriasClient />
      </div>
    </main>
  );
}

import { requireRole } from '@/lib/dal';
import ModuleHeader from '@/app/components/ModuleHeader';
import InformesClient from './InformesClient';

export const metadata = { title: 'Informes automáticos — Davinci Labs' };

export default async function InformesPage() {
  await requireRole('ADMIN', 'OPERATOR');

  return (
    <main className="min-h-screen" style={{ background: 'var(--background)' }}>
      <ModuleHeader
        eyebrow="Automatización"
        titulo="Informes automáticos"
        descripcion="Genera el PDF, lo sube a Drive y notifica al cliente por email y WhatsApp"
        icono={
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <path d="M14 2v6h6" />
            <path d="m9 15 2 2 4-4" />
          </svg>
        }
      />
      <div className="max-w-7xl mx-auto px-6 py-8">
        <InformesClient />
      </div>
    </main>
  );
}

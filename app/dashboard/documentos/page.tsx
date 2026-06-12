import { requireRole } from '@/lib/dal';
import ModuleHeader from '@/app/components/ModuleHeader';
import DocumentosClient from './DocumentosClient';

export const metadata = { title: 'Turnitin / Documentos — Davinci Labs' };

export default async function DocumentosPage() {
  await requireRole('ADMIN', 'OPERATOR');

  return (
    <main className="min-h-screen" style={{ background: 'var(--background)' }}>
      <ModuleHeader
        eyebrow="Turnitin"
        titulo="Procesamiento de documentos"
        descripcion="Recepción, detección IA, similitud e informes finales"
        icono={
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6M9 13h6M9 17h4" />
          </svg>
        }
      />
      <div className="max-w-7xl mx-auto px-6 py-8">
        <DocumentosClient />
      </div>
    </main>
  );
}

import { requireRole } from '@/lib/dal';
import ModuleHeader from '@/app/components/ModuleHeader';
import CrmClient from './CrmClient';

export const metadata = { title: 'CRM WhatsApp — Davinci Labs' };

export default async function CrmPage() {
  await requireRole('ADMIN', 'OPERATOR');

  return (
    <main className="h-screen flex flex-col" style={{ background: 'var(--background)' }}>
      <div className="shrink-0">
        <ModuleHeader
          eyebrow="CRM"
          titulo="Conversaciones WhatsApp"
          descripcion="Contactos, etiquetas, respuestas rápidas y notas internas"
          icono={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8z" />
            </svg>
          }
        />
      </div>
      <div className="flex-1 min-h-0">
        <CrmClient />
      </div>
    </main>
  );
}

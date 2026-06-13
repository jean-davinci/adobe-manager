import { requireRole } from '@/lib/dal';
import AdobeManager from './AdobeManager';
import AfiliadosExtras from './AfiliadosExtras';

export const metadata = { title: 'Afiliados — Davinci Labs' };

// Panel de afiliados (operador/admin) protegido por rol: gestor Adobe
// + bandeja Gmail + notificaciones de vencimiento.
export default async function AfiliadosPage() {
  await requireRole('ADMIN', 'OPERATOR');
  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <AfiliadosExtras />
      <AdobeManager />
    </div>
  );
}

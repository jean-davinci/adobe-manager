import { requireRole } from '@/lib/dal';
import Home from '@/app/page';
import AfiliadosExtras from './AfiliadosExtras';

export const metadata = { title: 'Afiliados — Davinci Labs' };

// Panel de afiliados (operador/admin) protegido por rol. Reutiliza el gestor
// Adobe existente y le añade la bandeja Gmail + notificaciones de vencimiento.
export default async function AfiliadosPage() {
  await requireRole('ADMIN', 'OPERATOR');
  return (
    <div className="bg-gray-50 min-h-screen">
      <AfiliadosExtras />
      <Home />
    </div>
  );
}

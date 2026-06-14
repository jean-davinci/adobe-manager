import Link from 'next/link';
import { requireRole } from '@/lib/dal';
import { getSaldo, listarCompras } from '@/lib/portal';
import CreditosClient from './CreditosClient';

export const metadata = { title: 'Mis créditos · Portal — Davinci Labs' };

export default async function CreditosPage() {
  const session = await requireRole('CLIENT');
  const [saldo, compras] = await Promise.all([
    getSaldo(session.userId),
    listarCompras(session.userId),
  ]);

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm mb-1" style={{ color: 'var(--text-muted)' }}>
          <Link href="/portal" style={{ color: 'var(--text-muted)' }}>Portal</Link>
          <span>/</span>
          <span>Mis créditos</span>
        </div>
        <h1 className="text-2xl font-serif font-bold" style={{ color: 'var(--text)' }}>
          Comprar créditos
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          Cada crédito te permite procesar un documento con Turnitin y recibir el informe oficial
        </p>
      </div>

      <CreditosClient saldoInicial={saldo} comprasIniciales={compras} />
    </div>
  );
}

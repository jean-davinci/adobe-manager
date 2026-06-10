import Link from 'next/link';
import { requireRole } from '@/lib/dal';
import LogoutButton from '@/app/components/LogoutButton';
import FinanzasClient from './FinanzasClient';

export const metadata = { title: 'Finanzas — Davinci Labs' };

export default async function FinanzasPage() {
  await requireRole('ADMIN', 'OPERATOR');

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-gray-400 hover:text-gray-700 text-sm">← Panel</Link>
            <div className="h-4 w-px bg-gray-200" />
            <h1 className="text-base font-semibold text-gray-900">💰 Finanzas</h1>
          </div>
          <LogoutButton />
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <FinanzasClient />
      </div>
    </main>
  );
}

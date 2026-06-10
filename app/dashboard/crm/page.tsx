import Link from 'next/link';
import { requireRole } from '@/lib/dal';
import LogoutButton from '@/app/components/LogoutButton';
import CrmClient from './CrmClient';

export const metadata = { title: 'CRM WhatsApp — Davinci Labs' };

export default async function CrmPage() {
  await requireRole('ADMIN', 'OPERATOR');

  return (
    <main className="h-screen flex flex-col bg-gray-50">
      <header className="bg-white border-b border-gray-100 shrink-0">
        <div className="px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-gray-400 hover:text-gray-700 text-sm">← Panel</Link>
            <div className="h-4 w-px bg-gray-200" />
            <h1 className="text-base font-semibold text-gray-900">💬 CRM WhatsApp</h1>
          </div>
          <LogoutButton />
        </div>
      </header>
      <div className="flex-1 min-h-0">
        <CrmClient />
      </div>
    </main>
  );
}

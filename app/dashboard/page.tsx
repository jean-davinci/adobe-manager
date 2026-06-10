import Link from 'next/link';
import { requireRole } from '@/lib/dal';
import LogoutButton from '@/app/components/LogoutButton';

export const metadata = { title: 'Dashboard — Davinci Labs' };

const MODULOS = [
  { href: '/dashboard/afiliados', label: 'Adobe / Afiliados', desc: 'Gestión de cuentas y afiliados', emoji: '🎨' },
  { href: '/dashboard/documentos', label: 'Turnitin / Documentos', desc: 'Procesamiento de documentos', emoji: '📄' },
  { href: '/dashboard/crm', label: 'CRM WhatsApp', desc: 'Conversaciones y contactos', emoji: '💬' },
  { href: '/dashboard/finanzas', label: 'Finanzas', desc: 'Ingresos y egresos', emoji: '💰' },
  { href: '/dashboard/integraciones', label: 'Integraciones', desc: 'Gmail, Drive, WhatsApp, Email', emoji: '🔌' },
];

export default async function DashboardPage() {
  const session = await requireRole('ADMIN', 'OPERATOR');

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-base font-semibold text-gray-900">Panel de gestión</h1>
            <p className="text-xs text-gray-400">
              {session.nombre} · {session.rol}
            </p>
          </div>
          <LogoutButton />
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {MODULOS.map((m) => (
            <Link
              key={m.href}
              href={m.href}
              className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md hover:border-gray-200 transition-all"
            >
              <div className="text-2xl mb-3">{m.emoji}</div>
              <h2 className="text-sm font-semibold text-gray-900">{m.label}</h2>
              <p className="text-xs text-gray-400 mt-1">{m.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}

import Image from 'next/image';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/dal';
import LoginForm from './LoginForm';

export const metadata = { title: 'Iniciar sesión — Davinci Labs' };

export default async function LoginPage() {
  // Si ya hay sesión, fuera de aquí.
  const session = await getSession();
  if (session?.userId) {
    redirect(session.rol === 'CLIENT' ? '/mi-acceso' : '/dashboard');
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 relative mb-3">
            <Image src="/logo-icon.svg" alt="Davinci Labs" fill sizes="48px" className="object-contain" priority />
          </div>
          <h1 className="text-xl font-semibold text-[#1e3a5f]">Davinci Labs</h1>
          <p className="text-sm text-gray-400 mt-1">Plataforma de gestión interna</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <LoginForm />
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          ¿Problemas para entrar? Contacta a un administrador.
        </p>
      </div>
    </main>
  );
}

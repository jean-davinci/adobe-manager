import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/dal';
import LoginForm from './LoginForm';

export const metadata = { title: 'Iniciar sesión — Davinci Labs' };

export default async function LoginPage() {
  // Si ya hay sesión, fuera de aquí.
  const session = await getSession();
  if (session?.userId) {
    redirect(session.rol === 'CLIENT' ? '/portal' : '/dashboard');
  }

  return (
    <main className="min-h-screen flex" style={{ background: 'var(--background)' }}>
      {/* Panel de marca */}
      <section className="hidden lg:flex flex-col justify-between w-[44%] dv-grad-navy text-white p-10 relative overflow-hidden">
        {/* Ornamento vitruviano */}
        <svg className="absolute -left-32 -bottom-40 opacity-[0.08] pointer-events-none" width="520" height="520" viewBox="0 0 520 520" fill="none">
          <circle cx="260" cy="260" r="250" stroke="#4EA1FF" strokeWidth="1.5" />
          <circle cx="260" cy="260" r="195" stroke="#4EA1FF" strokeWidth="1" />
          <circle cx="260" cy="260" r="140" stroke="#4EA1FF" strokeWidth="0.75" />
          <rect x="84" y="84" width="352" height="352" stroke="#4EA1FF" strokeWidth="0.75" />
          <path d="M260 10v500M10 260h500" stroke="#4EA1FF" strokeWidth="0.5" />
        </svg>

        <div className="relative dv-animate-up">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 relative rounded-lg shadow-[0_2px_12px_rgba(78,161,255,0.4)] ring-1 ring-white/15">
              <Image src="/logo-icon.svg" alt="Davinci Labs" fill sizes="40px" className="object-contain rounded-lg" priority />
            </div>
            <div className="leading-tight">
              <p className="font-serif text-lg font-semibold">Davinci</p>
              <p className="text-[10px] tracking-[0.2em] uppercase text-[#4EA1FF]">Labs</p>
            </div>
          </div>
        </div>

        <div className="relative dv-animate-up dv-delay-2">
          <p className="dv-eyebrow !text-[#4EA1FF] mb-3">Plataforma de gestión interna</p>
          <h1 className="font-serif text-[34px] leading-[1.15] font-semibold">
            El arte y la ciencia,
            <br />
            en un solo lugar.
          </h1>
          <p className="text-sm text-white/55 mt-4 max-w-sm leading-relaxed">
            Afiliados Adobe, procesamiento Turnitin, CRM con WhatsApp y control
            financiero. Todo bajo un mismo acceso, con roles.
          </p>
        </div>

        <p className="relative text-[11px] text-white/35 dv-animate-in dv-delay-4">
          © {new Date().getFullYear()} Davinci Labs · Lima, Perú
        </p>
      </section>

      {/* Formulario */}
      <section className="flex-1 flex items-center justify-center px-4 py-10 relative">
        {/* Botón volver al inicio */}
        <div className="absolute top-5 right-5">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors hover:bg-black/[0.05]"
            style={{ color: 'var(--text-muted)', border: '1px solid var(--border)' }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
            Volver al inicio
          </Link>
        </div>

        <div className="w-full max-w-sm">
          {/* Marca compacta para pantallas pequeñas */}
          <div className="lg:hidden flex flex-col items-center mb-8 dv-animate-up">
            <div className="w-12 h-12 relative mb-3">
              <Image src="/logo-icon.svg" alt="Davinci Labs" fill sizes="48px" className="object-contain rounded-xl" priority />
            </div>
            <h1 className="font-serif text-xl font-semibold" style={{ color: 'var(--brand)' }}>Davinci Labs</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Portal de clientes</p>
          </div>

          <div className="dv-animate-up dv-delay-1">
            <h2 className="font-serif text-[26px] font-semibold hidden lg:block" style={{ color: 'var(--text-primary)' }}>
              Bienvenido de nuevo
            </h2>
            <p className="text-sm mt-1 mb-7 hidden lg:block" style={{ color: 'var(--text-secondary)' }}>
              Ingresa con tu cuenta para continuar.
            </p>
          </div>

          <div className="dv-card shadow-sm p-6 dv-animate-up dv-delay-2">
            <LoginForm />
          </div>

          {/* Crear cuenta */}
          <div
            className="mt-4 p-4 rounded-xl text-center dv-animate-in dv-delay-3"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
              ¿Eres cliente nuevo?
            </p>
            <Link
              href="/registro"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white transition-all hover:shadow-md hover:-translate-y-0.5"
              style={{ background: 'var(--brand)' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" />
              </svg>
              Crear cuenta gratis
            </Link>
          </div>

          <p className="text-center text-xs mt-4 dv-animate-in dv-delay-4" style={{ color: 'var(--text-muted)' }}>
            ¿Problemas para entrar?{' '}
            <a
              href="https://wa.me/51987654321"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
              style={{ color: 'var(--brand)' }}
            >
              Contáctanos
            </a>
          </p>
        </div>
      </section>
    </main>
  );
}

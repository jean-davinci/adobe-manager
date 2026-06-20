import Image from 'next/image';
import Link from 'next/link';
import RegistroForm from './RegistroForm';

export const metadata = {
  title: 'Crear cuenta — Davinci Labs',
  description: 'Regístrate para acceder al portal de Davinci Labs y gestionar tus servicios de Turnitin y Adobe.',
};

const BENEFICIOS = [
  { icon: '📄', text: 'Pasada de Turnitin en minutos' },
  { icon: '🎓', text: 'Informe oficial con baja similitud' },
  { icon: '💳', text: 'Compra créditos y úsalos cuando quieras' },
  { icon: '🔒', text: 'Total confidencialidad de tu documento' },
  { icon: '📱', text: 'Seguimiento en tiempo real' },
];

export default function RegistroPage() {
  return (
    <div className="min-h-screen flex" style={{ background: 'var(--surface-2)' }}>
      {/* Panel izquierdo — visual/info */}
      <div
        className="hidden lg:flex flex-col justify-between w-[420px] flex-shrink-0 p-10 text-white"
        style={{ background: 'var(--brand)' }}
      >
        <div>
          <Link href="/" className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 relative rounded-xl shadow-lg ring-1 ring-white/20">
              <Image src="/logo-icon.svg" alt="Davinci Labs" fill sizes="40px" className="object-contain rounded-xl" />
            </div>
            <div className="leading-tight">
              <p className="font-serif text-xl font-semibold tracking-tight">Davinci</p>
              <p className="text-[11px] tracking-[0.18em] uppercase text-white/70">Labs</p>
            </div>
          </Link>

          <h2 className="text-3xl font-serif font-bold leading-snug mb-4">
            Procesa tu Turnitin<br />sin intermediarios
          </h2>
          <p className="text-white/75 text-sm leading-relaxed mb-8">
            Crea tu cuenta, compra créditos y sube tu documento. Recibirás el informe oficial con similitud reducida.
          </p>

          <div className="space-y-3">
            {BENEFICIOS.map((b) => (
              <div key={b.text} className="flex items-center gap-3">
                <span className="text-xl flex-shrink-0">{b.icon}</span>
                <span className="text-sm text-white/85">{b.text}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-white/40">© {new Date().getFullYear()} Davinci Labs. Todos los derechos reservados.</p>
      </div>

      {/* Panel derecho — formulario */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex lg:hidden justify-center mb-8">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-9 h-9 relative rounded-lg ring-1 ring-white/20">
                <Image src="/logo-icon.svg" alt="Davinci Labs" fill sizes="36px" className="object-contain rounded-lg" />
              </div>
              <span className="font-serif text-lg font-semibold" style={{ color: 'var(--text)' }}>Davinci Labs</span>
            </Link>
          </div>

          <div
            className="p-8 rounded-2xl shadow-sm"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <div className="mb-6">
              <h1 className="text-xl font-serif font-bold" style={{ color: 'var(--text)' }}>
                Crear cuenta
              </h1>
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                Accede al portal de autoservicio de Davinci Labs
              </p>
            </div>

            <RegistroForm />
          </div>
        </div>
      </div>
    </div>
  );
}

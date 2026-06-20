import { requireRole } from '@/lib/dal';
import { getSaldo, listarPedidos, tieneAcceso } from '@/lib/portal';
import Link from 'next/link';
import TurnitinUpload from './TurnitinUpload';

export const metadata = { title: 'Turnitin · Portal — Davinci Labs' };

export default async function TurnitinPage() {
  const session = await requireRole('CLIENT');
  const [saldo, pedidos, acceso] = await Promise.all([
    getSaldo(session.userId),
    listarPedidos(session.userId),
    tieneAcceso(session.userId, 'turnitin'),
  ]);

  if (!acceso) {
    return (
      <div className="p-6 lg:p-8 max-w-2xl mx-auto">
        <div className="rounded-2xl p-10 text-center" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <p className="text-4xl mb-4">🔒</p>
          <h1 className="text-xl font-serif font-bold mb-2" style={{ color: 'var(--text)' }}>
            Servicio Turnitin no activado
          </h1>
          <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>
            Tu cuenta aún no tiene acceso al servicio de Turnitin. Contáctanos por WhatsApp para activarlo.
          </p>
          <a
            href="https://wa.me/51987654321?text=Hola,%20quiero%20activar%20el%20servicio%20Turnitin%20en%20mi%20cuenta"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white"
            style={{ background: '#25d366' }}
          >
            Contactar por WhatsApp
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm mb-1" style={{ color: 'var(--text-muted)' }}>
          <Link href="/portal" style={{ color: 'var(--text-muted)' }}>Portal</Link>
          <span>/</span>
          <span>Turnitin</span>
        </div>
        <h1 className="text-2xl font-serif font-bold" style={{ color: 'var(--text)' }}>
          Informe Turnitin
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          Sube tu documento y recibirás el informe oficial con similitud reducida
        </p>
      </div>

      {/* Cómo funciona */}
      <div
        className="grid sm:grid-cols-3 gap-3 mb-6 p-4 rounded-2xl"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        {[
          { num: '1', text: 'Sube tu PDF o Word', icon: '📤' },
          { num: '2', text: 'Procesamos con Turnitin', icon: '⚙️' },
          { num: '3', text: 'Descarga tu informe', icon: '📊' },
        ].map((s) => (
          <div key={s.num} className="flex items-center gap-3">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 text-white"
              style={{ background: 'var(--brand)' }}
            >
              {s.num}
            </div>
            <span className="text-sm" style={{ color: 'var(--text)' }}>
              {s.icon} {s.text}
            </span>
          </div>
        ))}
      </div>

      <TurnitinUpload saldoInicial={saldo} pedidosIniciales={pedidos} />
    </div>
  );
}

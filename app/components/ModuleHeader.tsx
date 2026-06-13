import Link from 'next/link';

// Cabecera estándar de módulo: eyebrow + título serif + acciones.
// El logout vive en el sidebar, así que aquí solo va contexto del módulo.
export default function ModuleHeader({
  eyebrow,
  titulo,
  descripcion,
  icono,
  acciones,
}: {
  eyebrow: string;
  titulo: string;
  descripcion?: React.ReactNode;
  icono?: React.ReactNode;
  acciones?: React.ReactNode;
}) {
  return (
    <div className="bg-surface border-b sticky top-0 z-20" style={{ borderColor: 'var(--border)' }}>
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 min-w-0">
          {icono && (
            <div className="dv-icon-tile" style={{ background: 'var(--brand)', color: 'var(--accent)' }}>
              {icono}
            </div>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Link href="/dashboard" className="dv-eyebrow hover:text-[var(--accent-hover)] transition-colors">
                Panel
              </Link>
              <span className="dv-eyebrow">·</span>
              <span className="dv-eyebrow" style={{ color: 'var(--accent-hover)' }}>{eyebrow}</span>
            </div>
            <h1 className="font-serif text-[21px] font-semibold leading-tight truncate" style={{ color: 'var(--text-primary)' }}>
              {titulo}
            </h1>
            {descripcion && (
              <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-secondary)' }}>{descripcion}</p>
            )}
          </div>
        </div>
        {acciones && <div className="flex items-center gap-2 shrink-0">{acciones}</div>}
      </div>
    </div>
  );
}

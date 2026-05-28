'use client';
import { useState, useMemo } from 'react';
import { MESES, type Foto } from './data';

const COLORS = {
  bg: '#1a1d35',
  bgElevated: '#23274a',
  bgSoft: '#2b3055',
  border: 'rgba(184,230,184,0.12)',
  greenLight: '#c8ecc8',
  greenLightSoft: '#b8e6b8',
  greenSage: '#6e9b6e',
  greenSageDark: '#4a6b4a',
};

export default function ExcelenciaPage() {
  const [mesSlug, setMesSlug] = useState(MESES[0].slug);
  const [fotoActiva, setFotoActiva] = useState<Foto | null>(null);

  const mes = useMemo(() => MESES.find(m => m.slug === mesSlug) ?? MESES[0], [mesSlug]);
  const totalFotos = useMemo(() => mes.dias.reduce((a, d) => a + d.fotos.length, 0), [mes]);
  const totalColaboradores = useMemo(() => {
    const set = new Set<string>();
    mes.dias.forEach(d => d.fotos.forEach(f => set.add(f.colaborador)));
    return set.size;
  }, [mes]);

  return (
    <div
      className="font-rubik min-h-screen text-white"
      style={{ backgroundColor: COLORS.bg }}
    >
      {/* HERO */}
      <header className="relative overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at top left, rgba(184,230,184,0.10) 0%, transparent 55%), radial-gradient(ellipse at bottom right, rgba(110,155,110,0.12) 0%, transparent 60%)',
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, rgba(200,236,200,0.6) 1px, transparent 0)',
            backgroundSize: '32px 32px',
          }}
        />

        <div className="relative max-w-7xl mx-auto px-6 pt-20 pb-16 sm:pt-28 sm:pb-24">
          <div
            className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] mb-8"
            style={{ color: COLORS.greenLight, opacity: 0.75 }}
          >
            <span
              className="w-8 h-px"
              style={{ background: COLORS.greenLightSoft, opacity: 0.5 }}
            />
            Davinci Labs · Álbum {mes.nombre} {mes.anio}
          </div>

          <h1 className="text-5xl sm:text-7xl lg:text-8xl leading-[0.95] tracking-tight font-extrabold">
            Excelencia
            <br />
            <span
              className="font-light italic"
              style={{ color: COLORS.greenLightSoft }}
            >
              que nos mueve
            </span>
          </h1>

          <p className="mt-8 max-w-xl text-base sm:text-lg leading-relaxed text-white/65">
            {mes.lema}. Un recorrido por los momentos en los que nuestros colaboradores demostraron
            que el trabajo bien hecho también se celebra.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-6 text-sm">
            <Metric value={totalFotos} label="Momentos" />
            <Divider />
            <Metric value={totalColaboradores} label="Colaboradores" />
            <Divider />
            <Metric value={mes.dias.length} label="Días" />
          </div>
        </div>
      </header>

      {/* SELECTOR DE MES */}
      <nav
        className="sticky top-0 z-30 backdrop-blur-xl border-y"
        style={{
          backgroundColor: 'rgba(26,29,53,0.82)',
          borderColor: COLORS.border,
        }}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-3 overflow-x-auto">
          <span className="text-xs uppercase tracking-widest text-white/40 mr-2 shrink-0">
            Mes
          </span>
          {MESES.map(m => {
            const activo = m.slug === mesSlug;
            return (
              <button
                key={m.slug}
                onClick={() => setMesSlug(m.slug)}
                className="shrink-0 px-5 py-2 rounded-full text-sm font-medium transition-all"
                style={
                  activo
                    ? { backgroundColor: COLORS.greenLight, color: COLORS.bg }
                    : {
                        backgroundColor: 'transparent',
                        color: 'rgba(255,255,255,0.65)',
                        border: `1px solid ${COLORS.border}`,
                      }
                }
              >
                {m.nombre} <span className="opacity-60">{m.anio}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* CONTENIDO POR DÍA */}
      <section className="max-w-7xl mx-auto px-6 py-16 sm:py-24 space-y-24">
        {mes.dias.map((dia, idx) => (
          <article key={dia.fecha}>
            <div
              className="flex items-end justify-between gap-6 mb-10 pb-6 border-b"
              style={{ borderColor: COLORS.border }}
            >
              <div className="flex items-end gap-6">
                <p
                  className="text-6xl sm:text-7xl leading-none font-extrabold"
                  style={{ color: COLORS.greenLightSoft }}
                >
                  {String(dia.dia).padStart(2, '0')}
                </p>
                <div className="pb-2">
                  <p className="text-xs uppercase tracking-[0.3em] text-white/40">
                    {dia.diaSemana}
                  </p>
                  <p className="text-lg text-white/80 mt-1 font-light italic">
                    {mes.nombre} de {mes.anio}
                  </p>
                </div>
              </div>
              <p className="text-xs uppercase tracking-widest text-white/30 hidden sm:block">
                Día {idx + 1} de {mes.dias.length}
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
              {dia.fotos.map((foto, i) => (
                <button
                  key={foto.id}
                  onClick={() => setFotoActiva(foto)}
                  className={`group relative overflow-hidden rounded-2xl ${
                    i % 5 === 0 ? 'sm:row-span-2 sm:col-span-1 aspect-[3/8]' : 'aspect-[3/4]'
                  }`}
                  style={{ backgroundColor: COLORS.bgElevated }}
                >
                  <img
                    src={foto.src}
                    alt={foto.colaborador}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    loading="lazy"
                  />
                  <div
                    className="absolute inset-0"
                    style={{
                      background:
                        'linear-gradient(to top, rgba(26,29,53,0.95) 0%, rgba(26,29,53,0.3) 45%, transparent 75%)',
                    }}
                  />
                  <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
                    <p
                      className="text-[10px] uppercase tracking-[0.25em] mb-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 font-medium"
                      style={{ color: COLORS.greenLight }}
                    >
                      Colaborador
                    </p>
                    <p className="text-lg sm:text-xl text-white leading-tight font-semibold">
                      {foto.colaborador}
                    </p>
                  </div>
                  <div
                    className="absolute inset-0 rounded-2xl ring-0 group-hover:ring-2 transition-all duration-300"
                    style={{ boxShadow: `inset 0 0 0 0 ${COLORS.greenLightSoft}` }}
                  />
                </button>
              ))}
            </div>
          </article>
        ))}
      </section>

      {/* FOOTER */}
      <footer
        className="border-t mt-16"
        style={{ borderColor: COLORS.border }}
      >
        <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-2xl text-white font-bold">Davinci Labs</p>
            <p
              className="text-xs uppercase tracking-widest mt-1"
              style={{ color: COLORS.greenLightSoft, opacity: 0.7 }}
            >
              Excelencia que nos mueve
            </p>
          </div>
          <p className="text-xs text-white/30">
            © {new Date().getFullYear()} Todos los momentos pertenecen a su equipo.
          </p>
        </div>
      </footer>

      {/* LIGHTBOX */}
      {fotoActiva && (
        <div
          className="fixed inset-0 z-50 backdrop-blur-sm flex items-center justify-center p-4 sm:p-10"
          style={{ backgroundColor: 'rgba(15,17,32,0.96)' }}
          onClick={() => setFotoActiva(null)}
        >
          <button
            className="absolute top-6 right-6 w-10 h-10 rounded-full flex items-center justify-center transition-colors"
            style={{
              border: `1px solid ${COLORS.border}`,
              color: 'rgba(255,255,255,0.7)',
            }}
            onClick={() => setFotoActiva(null)}
            aria-label="Cerrar"
          >
            ✕
          </button>
          <div
            className="relative max-w-4xl w-full max-h-[85vh] flex flex-col items-center gap-6"
            onClick={e => e.stopPropagation()}
          >
            <img
              src={fotoActiva.src}
              alt={fotoActiva.colaborador}
              className="max-h-[75vh] w-auto rounded-2xl shadow-2xl object-contain"
            />
            <div className="text-center">
              <p
                className="text-xs uppercase tracking-[0.3em] mb-2 font-medium"
                style={{ color: COLORS.greenLight }}
              >
                Colaborador
              </p>
              <p className="text-3xl sm:text-4xl text-white font-bold">
                {fotoActiva.colaborador}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Metric({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <p className="text-3xl text-white font-bold">{value}</p>
      <p className="text-xs uppercase tracking-widest text-white/40 mt-1">{label}</p>
    </div>
  );
}

function Divider() {
  return <div className="w-px h-10 bg-white/10" />;
}

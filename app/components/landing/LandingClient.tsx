'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';

type Stats = { documentos: number; clientes: number; anios: number; tasa: number };

/* ─── Hook: reveal al entrar en viewport ──────────────────────────── */
function useReveal<T extends HTMLElement>(threshold = 0.12) {
  const ref = useRef<T>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.unobserve(el); } },
      { threshold, rootMargin: '0px 0px -60px 0px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

const rev = (visible: boolean, delay = 0): React.CSSProperties => ({
  opacity: visible ? 1 : 0,
  transform: visible ? 'translateY(0)' : 'translateY(28px)',
  transition: `opacity 0.65s cubic-bezier(0.22,1,0.36,1) ${delay}s, transform 0.65s cubic-bezier(0.22,1,0.36,1) ${delay}s`,
});

/* ─── Partículas del hero ──────────────────────────────────────────── */
function Particles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let w = 0, h = 0, raf = 0;
    const mouse = { x: -9999, y: -9999 };
    type P = { x: number; y: number; vx: number; vy: number };
    let parts: P[] = [];
    const init = () => {
      w = canvas.width = canvas.offsetWidth;
      h = canvas.height = canvas.offsetHeight;
      parts = Array.from({ length: w < 768 ? 35 : 70 }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4,
      }));
    };
    const tick = () => {
      ctx.clearRect(0, 0, w, h);
      for (const p of parts) {
        const dx = p.x - mouse.x, dy = p.y - mouse.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 100 && dist > 0) { p.x += (dx / dist) * 0.5; p.y += (dy / dist) * 0.5; }
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(78, 161, 255, 0.45)';
        ctx.fill();
      }
      for (let i = 0; i < parts.length; i++) {
        for (let j = i + 1; j < parts.length; j++) {
          const d = Math.hypot(parts[i].x - parts[j].x, parts[i].y - parts[j].y);
          if (d < 110) {
            ctx.beginPath();
            ctx.moveTo(parts[i].x, parts[i].y);
            ctx.lineTo(parts[j].x, parts[j].y);
            ctx.strokeStyle = `rgba(78, 161, 255, ${0.15 * (1 - d / 110)})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }
      raf = requestAnimationFrame(tick);
    };
    const onMouse = (e: MouseEvent) => { const r = canvas.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; };
    init(); tick();
    window.addEventListener('resize', init);
    canvas.parentElement?.addEventListener('mousemove', onMouse);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', init); canvas.parentElement?.removeEventListener('mousemove', onMouse); };
  }, []);
  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" aria-hidden />;
}

/* ─── Counter animado ─────────────────────────────────────────────── */
function Counter({ hasta, sufijo = '', visible }: { hasta: number; sufijo?: string; visible: boolean }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!visible) return;
    const dur = 1800;
    const t0 = performance.now();
    let raf = 0;
    const step = (t: number) => {
      const p = Math.min(1, (t - t0) / dur);
      setN(Math.round(hasta * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [visible, hasta]);
  return <>{n.toLocaleString('es-PE')}{sufijo}</>;
}

/* ─── TiltCard ────────────────────────────────────────────────────── */
function TiltCard({ children, className = '', style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  const onMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(700px) rotateY(${px * 7}deg) rotateX(${-py * 7}deg) scale(1.02)`;
  };
  const onLeave = () => { if (ref.current) ref.current.style.transform = 'perspective(700px) rotateY(0) rotateX(0) scale(1)'; };
  return (
    <div ref={ref} onMouseMove={onMove} onMouseLeave={onLeave} className={className}
      style={{ transition: 'transform 0.18s ease', willChange: 'transform', ...style }}>
      {children}
    </div>
  );
}

/* ─── Mock del informe Turnitin ───────────────────────────────────── */
function TurnitinCard() {
  const [pct, setPct] = useState(0);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setShow(true);
      let val = 0;
      const step = setInterval(() => {
        val += 1;
        setPct(val);
        if (val >= 3) clearInterval(step);
      }, 40);
      return () => clearInterval(step);
    }, 600);
    return () => clearTimeout(t);
  }, []);

  const bar = (label: string, pctVal: number, color: string) => (
    <div className="flex items-center gap-3 text-[13px]">
      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
      <span className="flex-1" style={{ color: '#5A6B7F' }}>{label}</span>
      <div className="w-24 h-1.5 rounded-full overflow-hidden shrink-0" style={{ background: '#E2E8F0' }}>
        <div className="h-full rounded-full transition-all duration-1000"
          style={{ width: show ? `${pctVal * 33}%` : '0%', background: color }} />
      </div>
      <span className="w-6 text-right font-medium" style={{ color: '#16293F' }}>{pctVal}%</span>
    </div>
  );

  return (
    <div className="relative w-full max-w-sm mx-auto">
      {/* Sombra decorativa */}
      <div className="absolute -inset-4 rounded-3xl opacity-30 blur-2xl"
        style={{ background: 'linear-gradient(135deg, #4EA1FF 0%, #1E3A5F 100%)' }} />

      <div className="relative rounded-2xl overflow-hidden shadow-2xl border"
        style={{ background: '#FFFFFF', borderColor: '#E2E8F0' }}>

        {/* Barra top tipo Turnitin */}
        <div className="px-5 py-3 flex items-center gap-2.5 border-b" style={{ background: '#1E3A5F', borderColor: '#2A4F7F' }}>
          <div className="w-6 h-6 rounded-md flex items-center justify-center text-[11px] font-black text-white"
            style={{ background: '#4EA1FF' }}>T</div>
          <div>
            <p className="text-[11px] font-semibold text-white leading-none">Turnitin</p>
            <p className="text-[9px] text-white/50 leading-none mt-0.5">Similarity Report</p>
          </div>
          <span className="ml-auto text-[9px] px-2 py-0.5 rounded-full font-semibold"
            style={{ background: 'rgba(14,159,110,0.25)', color: '#0E9F6E' }}>● Verificado</span>
        </div>

        <div className="p-5 space-y-5">
          {/* Archivo */}
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl" style={{ background: '#F7FAFC' }}>
            <span className="text-lg">📄</span>
            <div className="min-w-0">
              <p className="text-xs font-medium truncate" style={{ color: '#16293F' }}>Mi_Tesis_Final_v3.docx</p>
              <p className="text-[10px]" style={{ color: '#8A98A8' }}>Subido · {new Date().toLocaleDateString('es-PE')}</p>
            </div>
          </div>

          {/* Porcentaje principal */}
          <div className="text-center py-3">
            <div className="relative inline-flex items-center justify-center">
              <svg width="120" height="120" viewBox="0 0 120 120" aria-hidden>
                <circle cx="60" cy="60" r="52" fill="none" stroke="#E2E8F0" strokeWidth="10" />
                <circle cx="60" cy="60" r="52" fill="none" stroke="#0E9F6E" strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 52}`}
                  strokeDashoffset={show ? `${2 * Math.PI * 52 * (1 - pct / 100)}` : `${2 * Math.PI * 52}`}
                  style={{ transform: 'rotate(-90deg)', transformOrigin: '60px 60px', transition: 'stroke-dashoffset 2s ease' }} />
              </svg>
              <div className="absolute text-center">
                <p className="text-3xl font-black leading-none" style={{ color: '#0E9F6E' }}>{pct}%</p>
                <p className="text-[10px] font-medium mt-0.5" style={{ color: '#8A98A8' }}>Similitud</p>
              </div>
            </div>
          </div>

          {/* Desglose */}
          <div className="space-y-2.5">
            {bar('Fuentes de internet', 2, '#4EA1FF')}
            {bar('Publicaciones', 1, '#F59E0B')}
            {bar('Trabajos de alumnos', 0, '#6366F1')}
          </div>

          {/* Separador */}
          <div className="border-t" style={{ borderColor: '#E2E8F0' }} />

          {/* IA detection */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm">🤖</span>
              <p className="text-xs font-medium" style={{ color: '#16293F' }}>Detección de IA</p>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full"
              style={{ background: '#E3F5EE', color: '#0E9F6E' }}>0% IA</span>
          </div>

          {/* Checks */}
          <div className="space-y-1.5">
            {['Informe PDF generado', 'Marca oficial Turnitin', 'Entregado en minutos'].map((t) => (
              <div key={t} className="flex items-center gap-2">
                <span className="text-xs" style={{ color: '#0E9F6E' }}>✓</span>
                <p className="text-xs" style={{ color: '#5A6B7F' }}>{t}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── FAQ Accordion ───────────────────────────────────────────────── */
const FAQS = [
  {
    q: '¿Qué es el porcentaje de similitud en Turnitin?',
    a: 'El porcentaje de similitud indica cuánto texto de tu trabajo coincide con otras fuentes (internet, publicaciones, otros trabajos académicos). Un porcentaje bajo (menos del 20%) generalmente indica buena originalidad. Nosotros te entregamos el informe con la puntuación oficial y te ayudamos a reducirla si es necesario.',
  },
  {
    q: '¿Cuánto tiempo tarda en llegar mi informe Turnitin?',
    a: 'En la mayoría de casos, el informe llega en 5 a 30 minutos una vez que enviamos tu documento. En horas pico puede tardar hasta 1 hora. Te notificamos por WhatsApp y correo en cuanto esté listo.',
  },
  {
    q: '¿Pueden bajar mi porcentaje de similitud en Turnitin?',
    a: 'Sí. Nuestro equipo revisa las fuentes detectadas y trabaja en la paráfrasis correcta de los fragmentos observados, manteniendo el sentido académico del texto. Logramos reducir la similitud significativamente en la mayoría de casos.',
  },
  {
    q: '¿El servicio usa el Turnitin oficial?',
    a: 'Sí. Trabajamos con cuentas de Turnitin Instructor licenciadas, por lo que el informe que recibes es oficial y reconocido por universidades peruanas.',
  },
  {
    q: '¿Funciona para tesis, ensayos y trabajos de curso?',
    a: 'Absolutamente. Procesamos cualquier tipo de documento académico: tesis, artículos, ensayos, trabajos universitarios, monografías, proyectos de investigación y más.',
  },
  {
    q: '¿Cómo envío mi documento?',
    a: 'Puedes enviarnos tu archivo directamente por WhatsApp, por nuestra plataforma online, o por correo electrónico. Aceptamos .docx, .pdf, .txt y otros formatos comunes.',
  },
];

function SectionFAQ() {
  const { ref, visible } = useReveal<HTMLDivElement>();
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div ref={ref} className="max-w-3xl mx-auto px-6">
      <div className="text-center mb-10" style={rev(visible)}>
        <p className="dv-eyebrow mb-2" style={{ color: 'var(--accent-hover)' }}>Preguntas frecuentes</p>
        <h2 className="text-3xl font-semibold" style={{ color: 'var(--text-primary)' }}>Todo sobre el informe Turnitin</h2>
        <p className="text-sm mt-3" style={{ color: 'var(--text-secondary)' }}>
          Las dudas más comunes sobre la pasada de Turnitin y cómo funciona nuestro servicio
        </p>
      </div>
      <div className="space-y-3">
        {FAQS.map((faq, i) => (
          <div key={i} className="dv-card overflow-hidden" style={rev(visible, 0.05 * i)}>
            <button
              onClick={() => setOpen(open === i ? null : i)}
              className="w-full text-left px-5 py-4 flex items-start justify-between gap-3 hover:bg-[var(--surface-muted)] transition-colors"
            >
              <span className="text-sm font-semibold leading-relaxed" style={{ color: 'var(--text-primary)' }}>{faq.q}</span>
              <span className="text-lg shrink-0 mt-0.5 transition-transform duration-200"
                style={{ color: 'var(--accent-hover)', transform: open === i ? 'rotate(45deg)' : 'none' }}>+</span>
            </button>
            <div style={{
              maxHeight: open === i ? '300px' : '0',
              overflow: 'hidden',
              transition: 'max-height 0.35s ease',
            }}>
              <p className="px-5 pb-4 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{faq.a}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Widget de reserva ───────────────────────────────────────────── */
function BookingWidget() {
  const hoy = new Date().toLocaleDateString('en-CA');
  const [fecha, setFecha] = useState(hoy);
  const [slots, setSlots] = useState<{ hora: string; disponible: boolean }[]>([]);
  const [hora, setHora] = useState('');
  const [cargando, setCargando] = useState(false);
  const [form, setForm] = useState({ nombre: '', telefono: '', email: '' });
  const [estado, setEstado] = useState<'idle' | 'enviando' | 'ok' | 'error'>('idle');
  const [mensaje, setMensaje] = useState('');

  const cargarSlots = useCallback(async (f: string) => {
    setCargando(true); setHora('');
    try {
      const r = await fetch(`/api/asesorias/disponibilidad?fecha=${f}`).then((x) => x.json());
      setSlots(r.slots ?? []);
    } catch { setSlots([]); }
    finally { setCargando(false); }
  }, []);

  useEffect(() => { cargarSlots(fecha); }, [fecha, cargarSlots]);

  const reservar = async () => {
    if (!form.nombre.trim() || !hora) return;
    setEstado('enviando');
    try {
      const res = await fetch('/api/asesorias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, fecha, hora }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setEstado('ok');
    } catch (e: any) {
      setMensaje(e.message);
      setEstado('error');
      setTimeout(() => setEstado('idle'), 3500);
    }
  };

  if (estado === 'ok') return (
    <div className="dv-card p-8 text-center dv-animate-scale">
      <div className="text-5xl mb-4">🗓️</div>
      <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>¡Asesoría reservada!</h3>
      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
        Te esperamos el {new Date(fecha + 'T12:00:00').toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' })} a las {hora}.
        {form.email && ' Te llegará la invitación por correo.'}
        {form.telefono && ' Te recordaremos por WhatsApp 1 hora antes.'}
      </p>
    </div>
  );

  return (
    <div className="dv-card p-6 md:p-8">
      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <p className="dv-eyebrow mb-3">1 · Elige fecha y hora</p>
          <input type="date" value={fecha} min={hoy} onChange={(e) => setFecha(e.target.value)} className="dv-input mb-4" />
          {cargando ? (
            <div className="grid grid-cols-3 gap-2">{[...Array(6)].map((_, i) => <div key={i} className="dv-skeleton h-9" />)}</div>
          ) : slots.length === 0 ? (
            <p className="text-sm py-4" style={{ color: 'var(--text-muted)' }}>Ese día no hay atención. Atendemos de lunes a viernes.</p>
          ) : (
            <div className="grid grid-cols-3 gap-2 max-h-56 overflow-y-auto pr-1">
              {slots.map((s) => (
                <button key={s.hora} disabled={!s.disponible} onClick={() => setHora(s.hora)}
                  className="py-2 rounded-lg text-sm font-medium border transition-all disabled:opacity-30 disabled:line-through"
                  style={hora === s.hora ? { background: 'var(--brand)', borderColor: 'var(--brand)', color: 'white' } : { borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                  {s.hora}
                </button>
              ))}
            </div>
          )}
        </div>
        <div>
          <p className="dv-eyebrow mb-3">2 · Tus datos</p>
          <div className="space-y-3">
            <input placeholder="Tu nombre *" value={form.nombre} onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))} className="dv-input" />
            <input placeholder="WhatsApp (+51 …)" value={form.telefono} onChange={(e) => setForm((f) => ({ ...f, telefono: e.target.value }))} className="dv-input" />
            <input type="email" placeholder="Email (recibirás la invitación)" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className="dv-input" />
          </div>
          {estado === 'error' && <p className="text-xs mt-3 dv-animate-in" style={{ color: 'var(--danger)' }}>{mensaje}</p>}
          <button onClick={reservar} disabled={estado === 'enviando' || !form.nombre.trim() || !hora || (!form.telefono && !form.email)}
            className="dv-btn-primary w-full mt-5 !py-3 disabled:opacity-40">
            {estado === 'enviando' ? 'Reservando…' : hora ? `Reservar ${hora} →` : 'Elige un horario'}
          </button>
          <p className="text-[11px] mt-3 text-center" style={{ color: 'var(--text-muted)' }}>Sesiones de 1 hora · S/. 50 · Lun–Vie 9:00–20:00</p>
        </div>
      </div>
    </div>
  );
}

/* ─── Datos de secciones ──────────────────────────────────────────── */
const PASOS = [
  { n: '01', icono: '📤', titulo: 'Envías tu documento', desc: 'Por WhatsApp, correo o nuestra plataforma. Aceptamos .docx y .pdf.' },
  { n: '02', icono: '⚙️', titulo: 'Procesamos con Turnitin', desc: 'Subimos tu archivo a Turnitin Instructor oficial y esperamos el análisis.' },
  { n: '03', icono: '📊', titulo: 'Revisamos la similitud', desc: 'Si el porcentaje es alto, trabajamos en reducirlo a un nivel aceptable.' },
  { n: '04', icono: '✅', titulo: 'Recibes el informe PDF', desc: 'El informe oficial llega a tu WhatsApp y correo en minutos.' },
];

const BENEFICIOS = [
  {
    icono: '🎓',
    titulo: 'Turnitin Instructor oficial',
    desc: 'Usamos cuentas licenciadas de Turnitin Instructor. El informe que recibes es el mismo que reconocen las universidades peruanas.',
  },
  {
    icono: '⚡',
    titulo: 'Resultados en minutos',
    desc: 'Sin esperas de días. La mayoría de informes están listos en 5–30 minutos. Te avisamos por WhatsApp al instante.',
  },
  {
    icono: '📉',
    titulo: 'Reducción de similitud',
    desc: 'Si tu porcentaje está alto, nuestro equipo lo trabaja para bajarlo a un rango aceptable manteniendo tu redacción académica.',
  },
  {
    icono: '🤖',
    titulo: 'Detección de IA incluida',
    desc: 'Turnitin ahora detecta contenido generado por ChatGPT y otras IA. Te mostramos ese porcentaje y cómo manejarlo.',
  },
  {
    icono: '🔒',
    titulo: 'Total confidencialidad',
    desc: 'Tu documento es procesado y eliminado. Nunca almacenamos ni compartimos tus archivos académicos con terceros.',
  },
  {
    icono: '💬',
    titulo: 'Atención por WhatsApp',
    desc: 'Un asesor real responde tus dudas antes, durante y después del proceso. Sin bots, sin esperas interminables.',
  },
];

const TESTIMONIOS = [
  { nombre: 'Gabriela M.', uni: 'UNMSM · Derecho', texto: 'Tenía 34% de similitud en mi tesis. Davinci Labs lo bajó a 9% en pocas horas. Increíble servicio, super profesionales.', avatar: 'GM' },
  { nombre: 'Carlos R.', uni: 'UPN · Administración', texto: 'El informe Turnitin llegó a mi correo en 20 minutos. Nunca había visto algo tan rápido. Lo recomiendo 100%.', avatar: 'CR' },
  { nombre: 'Luciana P.', uni: 'UPAO · Psicología', texto: 'Me preocupaba el porcentaje de IA porque usé ChatGPT para ideas. Davinci me ayudó a reformular todo. Gracias!', avatar: 'LP' },
  { nombre: 'Diego F.', uni: 'PUCP · Ingeniería', texto: 'Usé el servicio para tres trabajos de maestría. Siempre puntual, profesional y con el porcentaje que necesitaba.', avatar: 'DF' },
];

/* ─── Sección testimonios ─────────────────────────────────────────── */
function SectionTestimonios() {
  const { ref, visible } = useReveal<HTMLDivElement>();
  const [idx, setIdx] = useState(0);
  const [pausa, setPausa] = useState(false);
  useEffect(() => {
    if (pausa) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % TESTIMONIOS.length), 4500);
    return () => clearInterval(t);
  }, [pausa]);
  return (
    <div ref={ref} className="max-w-3xl mx-auto px-6 text-center" style={rev(visible)}>
      <p className="dv-eyebrow mb-2" style={{ color: 'var(--accent-hover)' }}>Testimonios reales</p>
      <h2 className="text-3xl font-semibold mb-10" style={{ color: 'var(--text-primary)' }}>Lo que dicen nuestros clientes</h2>
      <div className="relative h-52 md:h-44" onMouseEnter={() => setPausa(true)} onMouseLeave={() => setPausa(false)}>
        {TESTIMONIOS.map((t, i) => (
          <div key={t.nombre} className="absolute inset-0 flex flex-col items-center justify-center px-4"
            style={{ opacity: i === idx ? 1 : 0, transition: 'opacity 0.7s ease', pointerEvents: i === idx ? 'auto' : 'none' }}>
            <div className="flex mb-3 gap-0.5">{[...Array(5)].map((_, s) => <span key={s} className="text-yellow-400 text-sm">★</span>)}</div>
            <p className="text-base italic leading-relaxed mb-5" style={{ color: 'var(--text-primary)' }}>"{t.texto}"</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                style={{ background: 'var(--brand-soft)', color: 'var(--brand)' }}>{t.avatar}</div>
              <div className="text-left">
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{t.nombre}</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{t.uni}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-center gap-2 mt-4">
        {TESTIMONIOS.map((_, i) => (
          <button key={i} onClick={() => setIdx(i)} aria-label={`Testimonio ${i + 1}`}
            className="w-2 h-2 rounded-full transition-all"
            style={{ background: i === idx ? 'var(--brand)' : 'var(--border)', transform: i === idx ? 'scale(1.4)' : 'none' }} />
        ))}
      </div>
    </div>
  );
}

/* ─── Landing completa ────────────────────────────────────────────── */
export default function LandingClient({ stats }: { stats: Stats }) {
  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

  const proceso = useReveal<HTMLDivElement>();
  const beneficios = useReveal<HTMLDivElement>();
  const statsRef = useReveal<HTMLDivElement>();
  const asesoria = useReveal<HTMLDivElement>();

  return (
    <div style={{ background: 'var(--background)' }}>

      {/* JSON-LD para SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'LocalBusiness',
            name: 'Davinci Labs',
            description: 'Servicio de pasada de Turnitin en Perú. Informe con baja similitud, detección de IA y verificación de originalidad.',
            url: 'https://davincilabs.pe',
            areaServed: 'PE',
            serviceType: ['Turnitin Report', 'Plagiarism Detection', 'AI Detection', 'Academic Services'],
          }),
        }}
      />

      {/* ── Nav ──────────────────────────────────────────────── */}
      <nav className="fixed top-0 inset-x-0 z-40 backdrop-blur-md" style={{ background: 'rgba(255,255,255,0.88)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-icon.svg" alt="Davinci Labs" className="w-8 h-8 rounded-md" />
            <div className="leading-tight">
              <span className="font-semibold text-[15px]" style={{ color: 'var(--text-primary)' }}>Davinci</span>
              <span className="block text-[9px] tracking-[0.2em] uppercase" style={{ color: 'var(--accent-hover)' }}>Labs</span>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-7 text-sm" style={{ color: 'var(--text-secondary)' }}>
            <button onClick={() => scrollTo('turnitin')} className="hover:text-[var(--brand)] transition-colors">Turnitin</button>
            <button onClick={() => scrollTo('proceso')} className="hover:text-[var(--brand)] transition-colors">Proceso</button>
            <button onClick={() => scrollTo('faq')} className="hover:text-[var(--brand)] transition-colors">FAQ</button>
            <button onClick={() => scrollTo('asesorias')} className="hover:text-[var(--brand)] transition-colors">Asesorías</button>
          </div>
          <div className="flex items-center gap-3">
            <a href="https://wa.me/51999999999?text=Hola%2C%20quiero%20mi%20informe%20Turnitin"
              target="_blank" rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition-colors hover:opacity-80"
              style={{ borderColor: '#25D366', color: '#25D366', background: 'rgba(37,211,102,0.08)' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              WhatsApp
            </a>
            <Link href="/login" className="dv-btn-primary !py-1.5 text-sm">Plataforma</Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <header className="relative min-h-screen flex items-center overflow-hidden dv-grad-navy pt-16">
        <Particles />
        <div className="relative w-full max-w-6xl mx-auto px-6 py-20 grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* Columna izquierda: copy */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/15 bg-white/8 mb-6 dv-animate-in"
              style={{ background: 'rgba(255,255,255,0.08)' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-[11px] font-medium text-white/70 tracking-wide">Turnitin Instructor · Servicio oficial en Perú</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-[54px] font-bold leading-[1.1] text-white dv-animate-up"
              style={{ letterSpacing: '-0.02em' }}>
              Tu informe
              <span className="block" style={{ background: 'linear-gradient(90deg, #4EA1FF 0%, #A8D2FF 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Turnitin en minutos
              </span>
            </h1>

            <p className="text-white/65 text-base md:text-lg mt-5 leading-relaxed dv-animate-up dv-delay-1">
              Procesamos tu tesis, ensayo o trabajo académico con{' '}
              <strong className="text-white/85 font-medium">Turnitin Instructor oficial</strong> y te entregamos el informe PDF con el porcentaje de similitud reducido.{' '}
              <span className="text-white/55">Sin intermediarios. Sin esperas de días.</span>
            </p>

            {/* Micro stats */}
            <div className="flex flex-wrap gap-4 mt-7 dv-animate-up dv-delay-2">
              {[
                { val: '+' + stats.documentos, label: 'documentos procesados' },
                { val: stats.tasa + '%', label: 'tasa de éxito' },
                { val: '~20 min', label: 'tiempo promedio' },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <p className="text-xl font-bold text-white">{s.val}</p>
                  <p className="text-[10px] text-white/50 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-3 mt-8 dv-animate-up dv-delay-3">
              <a href="https://wa.me/51999999999?text=Hola%2C%20quiero%20mi%20informe%20Turnitin"
                target="_blank" rel="noopener noreferrer"
                className="dv-btn-accent !px-7 !py-3 dv-pulse flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Pedir mi informe
              </a>
              <button onClick={() => scrollTo('proceso')}
                className="!px-7 !py-3 rounded-3xl text-sm font-medium border border-white/20 text-white/80 hover:bg-white/10 transition-colors">
                Ver cómo funciona
              </button>
            </div>
          </div>

          {/* Columna derecha: mock del informe */}
          <div className="dv-animate-up dv-delay-2">
            <TurnitinCard />
          </div>
        </div>

        {/* Flecha bajar */}
        <button onClick={() => scrollTo('trust')} aria-label="Bajar"
          className="absolute bottom-8 left-1/2 -translate-x-1/2 dv-bounce text-white/40">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M19 12l-7 7-7-7" />
          </svg>
        </button>
      </header>

      {/* ── Trust strip ──────────────────────────────────────── */}
      <div id="trust" className="border-b py-4" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
        <div className="max-w-5xl mx-auto px-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-3">
          {[
            { icon: '✓', text: 'Turnitin Instructor oficial' },
            { icon: '⚡', text: 'Resultados en ~20 minutos' },
            { icon: '📉', text: 'Reducimos tu similitud' },
            { icon: '🤖', text: 'Detección de IA incluida' },
            { icon: '🔒', text: 'Documentos confidenciales' },
            { icon: '💬', text: 'Atención por WhatsApp' },
          ].map((t) => (
            <div key={t.text} className="flex items-center gap-2">
              <span className="text-sm" style={{ color: 'var(--success)' }}>{t.icon}</span>
              <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{t.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Sección protagonista Turnitin ────────────────────── */}
      <section id="turnitin" className="py-24">
        <div className="max-w-6xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <p className="dv-eyebrow mb-3" style={{ color: 'var(--accent-hover)' }}>Pasada de Turnitin · Servicio principal</p>
            <h2 className="text-3xl md:text-4xl font-bold leading-tight mb-5" style={{ color: 'var(--text-primary)' }}>
              ¿Necesitas bajar tu porcentaje de similitud en Turnitin?
            </h2>
            <p className="text-base leading-relaxed mb-6" style={{ color: 'var(--text-secondary)' }}>
              Muchas universidades peruanas exigen un máximo del <strong>20–25% de similitud</strong> para aprobar una tesis o trabajo de investigación. Si tu porcentaje está por encima de ese límite, nuestro equipo trabaja tu documento para reducirlo manteniendo la calidad académica.
            </p>
            <p className="text-base leading-relaxed mb-8" style={{ color: 'var(--text-secondary)' }}>
              También incluimos la <strong>detección de contenido generado por IA</strong> (ChatGPT, Copilot, etc.) que Turnitin ahora reporta separadamente — y te ayudamos a manejarlo.
            </p>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Similitud promedio que logramos', valor: '< 15%', color: 'var(--success)' },
                { label: 'IA detectada en promedio', valor: '0%', color: 'var(--brand)' },
                { label: 'Tiempo de entrega', valor: '~20 min', color: 'var(--accent-hover)' },
                { label: 'Tasa de satisfacción', valor: '98%', color: 'var(--warning)' },
              ].map((m) => (
                <div key={m.label} className="dv-card-muted p-4 rounded-xl">
                  <p className="text-2xl font-bold" style={{ color: m.color }}>{m.valor}</p>
                  <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>{m.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right: ¿Qué incluye? */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-6" style={{ color: 'var(--text-primary)' }}>¿Qué incluye la pasada de Turnitin?</h3>
            {[
              { icon: '📊', titulo: 'Informe PDF oficial de Turnitin', desc: 'El mismo documento que presenta a tu universidad, con sello Turnitin Instructor.' },
              { icon: '📉', titulo: 'Reducción del % de similitud', desc: 'Si es necesario, trabajamos el texto para bajar la similitud a los límites exigidos.' },
              { icon: '🤖', titulo: 'Reporte de detección de IA', desc: 'Te mostramos el porcentaje que Turnitin asigna a contenido generado por inteligencia artificial.' },
              { icon: '🔗', titulo: 'Lista de fuentes detectadas', desc: 'Ves exactamente qué párrafos coinciden y con qué fuentes, para que puedas revisarlos.' },
              { icon: '📱', titulo: 'Entrega por WhatsApp y correo', desc: 'El informe llega directo a tu teléfono en formato PDF, listo para adjuntar.' },
            ].map((item, i) => (
              <TiltCard key={item.titulo}>
                <div className="dv-card p-4 flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                    style={{ background: 'var(--brand-soft)' }}>{item.icon}</div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{item.titulo}</p>
                    <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{item.desc}</p>
                  </div>
                </div>
              </TiltCard>
            ))}
          </div>
        </div>
      </section>

      {/* ── Cómo funciona ─────────────────────────────────────── */}
      <section id="proceso" className="py-24" style={{ background: 'var(--surface-muted)' }}>
        <div ref={proceso.ref} className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14" style={rev(proceso.visible)}>
            <p className="dv-eyebrow mb-2" style={{ color: 'var(--accent-hover)' }}>Proceso</p>
            <h2 className="text-3xl font-semibold" style={{ color: 'var(--text-primary)' }}>
              Cómo funciona la pasada de Turnitin
            </h2>
            <p className="text-sm mt-3 max-w-xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
              4 pasos simples. De tu documento al informe oficial en minutos.
            </p>
          </div>
          <div className="relative">
            <svg className="hidden md:block absolute top-7 left-0 w-full" height="2" aria-hidden>
              <line x1="12%" y1="1" x2="88%" y2="1" stroke="var(--brand)" strokeWidth="2"
                strokeDasharray="1000"
                strokeDashoffset={proceso.visible ? 0 : 1000}
                style={{ transition: 'stroke-dashoffset 1.8s ease 0.4s' }} />
            </svg>
            <div className="grid md:grid-cols-4 gap-8">
              {PASOS.map((p, i) => (
                <div key={p.n} className="text-center relative" style={rev(proceso.visible, 0.2 + i * 0.18)}>
                  <div className="w-14 h-14 mx-auto rounded-full flex flex-col items-center justify-center font-bold text-2xl mb-4 relative z-10"
                    style={{ background: 'var(--surface)', border: '2px solid var(--accent)', color: 'var(--brand)', boxShadow: '0 4px 16px rgba(78,161,255,0.15)' }}>
                    {p.icono}
                  </div>
                  <p className="text-[10px] font-bold tracking-widest mb-1" style={{ color: 'var(--accent-hover)' }}>{p.n}</p>
                  <h3 className="text-sm font-semibold mb-1.5" style={{ color: 'var(--text-primary)' }}>{p.titulo}</h3>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{p.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-14 text-center">
            <a href="https://wa.me/51999999999?text=Hola%2C%20quiero%20pasar%20mi%20Turnitin"
              target="_blank" rel="noopener noreferrer"
              className="dv-btn-primary !px-10 !py-3.5 inline-flex items-center gap-2 text-sm">
              Solicitar mi informe ahora →
            </a>
          </div>
        </div>
      </section>

      {/* ── Por qué elegirnos ─────────────────────────────────── */}
      <section className="py-24">
        <div ref={beneficios.ref} className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12" style={rev(beneficios.visible)}>
            <p className="dv-eyebrow mb-2" style={{ color: 'var(--accent-hover)' }}>Ventajas</p>
            <h2 className="text-3xl font-semibold" style={{ color: 'var(--text-primary)' }}>
              Por qué elegir Davinci Labs para tu Turnitin
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {BENEFICIOS.map((b, i) => (
              <div key={b.titulo} style={rev(beneficios.visible, 0.08 + i * 0.07)}>
                <TiltCard className="dv-card p-6 h-full">
                  <div className="text-2xl mb-4">{b.icono}</div>
                  <h3 className="text-base font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>{b.titulo}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{b.desc}</p>
                </TiltCard>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats ─────────────────────────────────────────────── */}
      <section className="py-16" style={{ background: 'var(--surface-muted)' }}>
        <div ref={statsRef.ref} className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { valor: stats.documentos, sufijo: '+', label: 'Informes Turnitin entregados' },
            { valor: stats.clientes, sufijo: '+', label: 'Universitarios satisfechos' },
            { valor: stats.anios, sufijo: '', label: 'Años procesando Turnitin' },
            { valor: stats.tasa, sufijo: '%', label: 'Tasa de éxito comprobada' },
          ].map((it, i) => (
            <div key={it.label} className="dv-card p-6 text-center" style={rev(statsRef.visible, i * 0.1)}>
              <p className="text-3xl md:text-4xl font-bold" style={{ color: 'var(--text-primary)' }}>
                <Counter hasta={it.valor} sufijo={it.sufijo} visible={statsRef.visible} />
              </p>
              <p className="text-xs mt-2" style={{ color: 'var(--text-secondary)' }}>{it.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────── */}
      <section id="faq" className="py-24">
        <SectionFAQ />
      </section>

      {/* ── Testimonios ───────────────────────────────────────── */}
      <section className="py-20" style={{ background: 'var(--surface-muted)' }}>
        <SectionTestimonios />
      </section>

      {/* ── Asesorías ─────────────────────────────────────────── */}
      <section id="asesorias" className="py-24">
        <div ref={asesoria.ref} className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-10" style={rev(asesoria.visible)}>
            <p className="dv-eyebrow mb-2" style={{ color: 'var(--accent-hover)' }}>Asesoría académica</p>
            <h2 className="text-3xl font-semibold" style={{ color: 'var(--text-primary)' }}>
              ¿Quieres asesoría personalizada para tu tesis?
            </h2>
            <p className="text-sm mt-3" style={{ color: 'var(--text-secondary)' }}>
              Además del informe Turnitin, ofrecemos sesiones de asesoría para ayudarte a mejorar tu trabajo académico.
            </p>
          </div>
          <div style={rev(asesoria.visible, 0.15)}>
            <BookingWidget />
          </div>
        </div>
      </section>

      {/* ── CTA final ─────────────────────────────────────────── */}
      <section id="contacto" className="py-28 dv-grad-navy relative overflow-hidden">
        <div className="max-w-3xl mx-auto px-6 text-center relative">
          <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight">
            ¿Listo para pasar tu Turnitin hoy?
          </h2>
          <p className="text-sm mt-4 mb-8 text-white/60 max-w-xl mx-auto leading-relaxed">
            Únete a cientos de universitarios peruanos que confían en Davinci Labs para su informe de similitud Turnitin. Resultados en minutos, garantía de satisfacción.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <a href="https://wa.me/51999999999?text=Hola%20Davinci%20Labs%2C%20quiero%20mi%20informe%20Turnitin"
              target="_blank" rel="noopener noreferrer"
              className="dv-btn-accent !px-8 !py-3.5 flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Escribir por WhatsApp
            </a>
            <Link href="/login" className="!px-8 !py-3.5 rounded-3xl text-sm font-medium border border-white/25 text-white/80 hover:bg-white/10 transition-colors">
              Entrar a la plataforma
            </Link>
          </div>
          <p className="text-white/35 text-[11px] mt-6">
            También por correo: <a href="mailto:davincilabs.peru@gmail.com" className="hover:text-white/60 transition-colors">davincilabs.peru@gmail.com</a>
          </p>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────── */}
      <footer className="py-10 border-t" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-5">
          <div className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-icon.svg" alt="Davinci Labs" className="w-7 h-7 rounded-md" />
            <div>
              <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Davinci Labs</span>
              <span className="text-xs ml-2" style={{ color: 'var(--text-muted)' }}>© {new Date().getFullYear()}</span>
            </div>
          </div>
          <p className="text-[11px] text-center" style={{ color: 'var(--text-muted)' }}>
            Servicio de pasada de Turnitin en Perú · Informe con baja similitud · Detección de IA
          </p>
          <div className="flex items-center gap-6 text-xs" style={{ color: 'var(--text-muted)' }}>
            <a href="mailto:davincilabs.peru@gmail.com" className="hover:text-[var(--brand)] transition-colors">davincilabs.peru@gmail.com</a>
            <Link href="/login" className="hover:text-[var(--brand)] transition-colors">Acceso clientes</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

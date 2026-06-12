'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';

type Stats = { documentos: number; clientes: number; anios: number; tasa: number };

/* ─── Hook: reveal al entrar en viewport ──────────────────────────────── */
function useReveal<T extends HTMLElement>(threshold = 0.15) {
  const ref = useRef<T>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVisible(true);
          obs.unobserve(el);
        }
      },
      { threshold, rootMargin: '0px 0px -80px 0px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

const revealStyle = (visible: boolean, delay = 0): React.CSSProperties => ({
  opacity: visible ? 1 : 0,
  transform: visible ? 'translateY(0)' : 'translateY(30px)',
  transition: `opacity 0.6s cubic-bezier(0.22,1,0.36,1) ${delay}s, transform 0.6s cubic-bezier(0.22,1,0.36,1) ${delay}s`,
});

/* ─── Partículas del hero (canvas puro) ───────────────────────────────── */
function Particles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let w = 0, h = 0, raf = 0;
    const mouse = { x: -9999, y: -9999 };
    type P = { x: number; y: number; vx: number; vy: number };
    let parts: P[] = [];

    const init = () => {
      w = canvas.width = canvas.offsetWidth;
      h = canvas.height = canvas.offsetHeight;
      const n = w < 768 ? 40 : 80;
      parts = Array.from({ length: n }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
      }));
    };

    const tick = () => {
      ctx.clearRect(0, 0, w, h);
      for (const p of parts) {
        // Parallax: alejarse levemente del cursor
        const dx = p.x - mouse.x, dy = p.y - mouse.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 100 && dist > 0) {
          p.x += (dx / dist) * 0.6;
          p.y += (dy / dist) * 0.6;
        }
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.6, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(78, 161, 255, 0.5)';
        ctx.fill();
      }
      // Líneas de conexión
      for (let i = 0; i < parts.length; i++) {
        for (let j = i + 1; j < parts.length; j++) {
          const a = parts[i], b = parts[j];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < 120) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(78, 161, 255, ${0.18 * (1 - d / 120)})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }
      raf = requestAnimationFrame(tick);
    };

    const onMouse = (e: MouseEvent) => {
      const r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
    };

    init();
    tick();
    window.addEventListener('resize', init);
    canvas.parentElement?.addEventListener('mousemove', onMouse);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', init);
      canvas.parentElement?.removeEventListener('mousemove', onMouse);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" aria-hidden />;
}

/* ─── Counter animado ─────────────────────────────────────────────────── */
function Counter({ hasta, sufijo = '', visible }: { hasta: number; sufijo?: string; visible: boolean }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!visible) return;
    const dur = 1600;
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

/* ─── Card con tilt 3D ────────────────────────────────────────────────── */
function TiltCard({ children, className = '', style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  const onMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(700px) rotateY(${px * 8}deg) rotateX(${-py * 8}deg) scale(1.02)`;
  };
  const onLeave = () => {
    const el = ref.current;
    if (el) el.style.transform = 'perspective(700px) rotateY(0) rotateX(0) scale(1)';
  };
  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={className}
      style={{ transition: 'transform 0.18s ease, box-shadow 0.2s ease', willChange: 'transform', ...style }}
    >
      {children}
    </div>
  );
}

/* ─── Widget de reserva de asesorías ──────────────────────────────────── */
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
    setCargando(true);
    setHora('');
    try {
      const r = await fetch(`/api/asesorias/disponibilidad?fecha=${f}`).then((x) => x.json());
      setSlots(r.slots ?? []);
    } catch {
      setSlots([]);
    } finally {
      setCargando(false);
    }
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

  if (estado === 'ok') {
    return (
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
  }

  return (
    <div className="dv-card p-6 md:p-8">
      <div className="grid md:grid-cols-2 gap-8">
        {/* Paso 1: fecha + hora */}
        <div>
          <p className="dv-eyebrow mb-3">1 · Elige fecha y hora</p>
          <input
            type="date" value={fecha} min={hoy}
            onChange={(e) => setFecha(e.target.value)}
            className="dv-input mb-4"
          />
          {cargando ? (
            <div className="grid grid-cols-3 gap-2">
              {[...Array(6)].map((_, i) => <div key={i} className="dv-skeleton h-9" />)}
            </div>
          ) : slots.length === 0 ? (
            <p className="text-sm py-4" style={{ color: 'var(--text-muted)' }}>
              Ese día no hay atención. Atendemos de lunes a viernes.
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-2 max-h-56 overflow-y-auto pr-1">
              {slots.map((s) => (
                <button
                  key={s.hora}
                  disabled={!s.disponible}
                  onClick={() => setHora(s.hora)}
                  className="py-2 rounded-lg text-sm font-medium border transition-all disabled:opacity-30 disabled:line-through"
                  style={hora === s.hora
                    ? { background: 'var(--brand)', borderColor: 'var(--brand)', color: 'white' }
                    : { borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                >
                  {s.hora}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Paso 2: datos */}
        <div>
          <p className="dv-eyebrow mb-3">2 · Tus datos</p>
          <div className="space-y-3">
            <input placeholder="Tu nombre *" value={form.nombre}
              onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))} className="dv-input" />
            <input placeholder="WhatsApp (+51 …)" value={form.telefono}
              onChange={(e) => setForm((f) => ({ ...f, telefono: e.target.value }))} className="dv-input" />
            <input type="email" placeholder="Email (recibirás la invitación)" value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className="dv-input" />
          </div>
          {estado === 'error' && (
            <p className="text-xs mt-3 dv-animate-in" style={{ color: 'var(--danger)' }}>{mensaje}</p>
          )}
          <button
            onClick={reservar}
            disabled={estado === 'enviando' || !form.nombre.trim() || !hora || (!form.telefono && !form.email)}
            className="dv-btn-primary w-full mt-5 !py-3 disabled:opacity-40"
          >
            {estado === 'enviando' ? 'Reservando…' : hora ? `Reservar ${hora} →` : 'Elige un horario'}
          </button>
          <p className="text-[11px] mt-3 text-center" style={{ color: 'var(--text-muted)' }}>
            Sesiones de 1 hora · S/. 50 · Lun–Vie 9:00–20:00
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─── Datos de secciones ──────────────────────────────────────────────── */
const SERVICIOS = [
  { titulo: 'Detección de IA', desc: 'Análisis profundo con iVerificate para identificar contenido generado por IA.', icono: <><rect x="4" y="4" width="16" height="16" rx="3" /><circle cx="9.5" cy="10" r="1" fill="currentColor" /><circle cx="14.5" cy="10" r="1" fill="currentColor" /><path d="M9 15h6" /></> },
  { titulo: 'Similitud Turnitin', desc: 'Verificación de originalidad con la plataforma oficial de Turnitin.', icono: <><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /><path d="M8 11h6" /></> },
  { titulo: 'Informes automáticos', desc: 'Generamos y entregamos tu informe final sin intermediarios, en minutos.', icono: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /><path d="m9 15 2 2 4-4" /></> },
  { titulo: 'Gestión de afiliados', desc: 'Plataforma de acceso para nuestros afiliados con códigos automáticos.', icono: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></> },
  { titulo: 'Asesoría académica', desc: 'Sesiones programadas en horarios clave para guiarte en tu proceso.', icono: <><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /><path d="m9 16 2 2 4-4" /></> },
  { titulo: 'CRM WhatsApp', desc: 'Atención personalizada por WhatsApp con respuestas automatizadas.', icono: <><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8z" /></> },
];

const PASOS = [
  { n: '01', titulo: 'Envías tu documento', desc: 'Upload simple desde la plataforma o por WhatsApp.' },
  { n: '02', titulo: 'Procesamos con IA', desc: 'Análisis de IA y similitud en minutos.' },
  { n: '03', titulo: 'Generamos tu informe', desc: 'PDF automático con la marca Davinci Labs.' },
  { n: '04', titulo: 'Recibes el resultado', desc: 'Por email, WhatsApp y en tu portal.' },
];

const TESTIMONIOS = [
  { nombre: 'María C.', uni: 'USAT', texto: 'Increíble servicio. Mi tesis bajó del 28% al 4% de similitud en un día.', avatar: 'MC' },
  { nombre: 'Carlos R.', uni: 'UPN', texto: 'El informe llegó automáticamente a mi correo. Muy profesional y rápido.', avatar: 'CR' },
  { nombre: 'Luciana P.', uni: 'UPAO', texto: 'Los códigos de acceso llegan solos. No tuve que esperar nada.', avatar: 'LP' },
];

/* ─── Secciones ───────────────────────────────────────────────────────── */
function SectionStats({ stats }: { stats: Stats }) {
  const { ref, visible } = useReveal<HTMLDivElement>();
  const items = [
    { valor: stats.documentos, sufijo: '+', label: 'Documentos procesados' },
    { valor: stats.clientes, sufijo: '+', label: 'Clientes satisfechos' },
    { valor: stats.anios, sufijo: '', label: 'Años de experiencia' },
    { valor: stats.tasa, sufijo: '%', label: 'Tasa de éxito' },
  ];
  return (
    <div ref={ref} className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-4">
      {items.map((it, i) => (
        <div key={it.label} className="dv-card p-6 text-center" style={revealStyle(visible, i * 0.1)}>
          <p className="text-3xl md:text-4xl font-bold" style={{ color: 'var(--text-primary)' }}>
            <Counter hasta={it.valor} sufijo={it.sufijo} visible={visible} />
          </p>
          <p className="text-xs mt-2" style={{ color: 'var(--text-secondary)' }}>{it.label}</p>
        </div>
      ))}
    </div>
  );
}

function SectionServicios() {
  const { ref, visible } = useReveal<HTMLDivElement>();
  return (
    <div ref={ref} className="max-w-6xl mx-auto px-6">
      <div className="text-center mb-12" style={revealStyle(visible)}>
        <p className="dv-eyebrow mb-2" style={{ color: 'var(--accent-hover)' }}>Servicios</p>
        <h2 className="text-3xl font-semibold" style={{ color: 'var(--text-primary)' }}>Todo lo que tu trabajo académico necesita</h2>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {SERVICIOS.map((s, i) => (
          <div key={s.titulo} style={revealStyle(visible, 0.1 + i * 0.08)}>
            <TiltCard className="dv-card p-6 h-full">
              <div className="dv-icon-tile mb-4" style={{ background: 'var(--brand-soft)', color: 'var(--brand)' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">{s.icono}</svg>
              </div>
              <h3 className="text-base font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>{s.titulo}</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{s.desc}</p>
            </TiltCard>
          </div>
        ))}
      </div>
    </div>
  );
}

function SectionProceso() {
  const { ref, visible } = useReveal<HTMLDivElement>();
  return (
    <div ref={ref} className="max-w-5xl mx-auto px-6">
      <div className="text-center mb-12" style={revealStyle(visible)}>
        <p className="dv-eyebrow mb-2" style={{ color: 'var(--accent-hover)' }}>Cómo funciona</p>
        <h2 className="text-3xl font-semibold" style={{ color: 'var(--text-primary)' }}>De tu documento al informe, en 4 pasos</h2>
      </div>
      <div className="relative">
        {/* Línea de progreso que se dibuja */}
        <svg className="hidden md:block absolute top-7 left-0 w-full" height="2" aria-hidden>
          <line
            x1="10%" y1="1" x2="90%" y2="1"
            stroke="var(--brand)" strokeWidth="2" strokeDasharray="1000"
            strokeDashoffset={visible ? 0 : 1000}
            style={{ transition: 'stroke-dashoffset 1.6s ease 0.3s' }}
          />
        </svg>
        <div className="grid md:grid-cols-4 gap-8">
          {PASOS.map((p, i) => (
            <div key={p.n} className="text-center relative" style={revealStyle(visible, 0.2 + i * 0.18)}>
              <div className="w-14 h-14 mx-auto rounded-full flex items-center justify-center font-bold text-sm mb-4 relative z-10"
                style={{ background: 'var(--surface)', border: '2px solid var(--accent)', color: 'var(--brand)' }}>
                {p.n}
              </div>
              <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>{p.titulo}</h3>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{p.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SectionTestimonios() {
  const { ref, visible } = useReveal<HTMLDivElement>();
  const [idx, setIdx] = useState(0);
  const [pausa, setPausa] = useState(false);

  useEffect(() => {
    if (pausa) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % TESTIMONIOS.length), 4000);
    return () => clearInterval(t);
  }, [pausa]);

  return (
    <div ref={ref} className="max-w-3xl mx-auto px-6 text-center" style={revealStyle(visible)}>
      <p className="dv-eyebrow mb-2" style={{ color: 'var(--accent-hover)' }}>Testimonios</p>
      <h2 className="text-3xl font-semibold mb-10" style={{ color: 'var(--text-primary)' }}>Lo que dicen nuestros clientes</h2>
      <div
        className="relative h-48 md:h-40"
        onMouseEnter={() => setPausa(true)}
        onMouseLeave={() => setPausa(false)}
      >
        {TESTIMONIOS.map((t, i) => (
          <div key={t.nombre}
            className="absolute inset-0 flex flex-col items-center justify-center px-4"
            style={{ opacity: i === idx ? 1 : 0, transition: 'opacity 0.7s ease', pointerEvents: i === idx ? 'auto' : 'none' }}>
            <p className="text-lg italic leading-relaxed mb-5" style={{ color: 'var(--text-primary)' }}>
              “{t.texto}”
            </p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ background: 'var(--brand-soft)', color: 'var(--brand)' }}>
                {t.avatar}
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{t.nombre}</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{t.uni} · ⭐⭐⭐⭐⭐</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-center gap-2 mt-6">
        {TESTIMONIOS.map((_, i) => (
          <button key={i} onClick={() => setIdx(i)} aria-label={`Testimonio ${i + 1}`}
            className="w-2 h-2 rounded-full transition-all"
            style={{ background: i === idx ? 'var(--brand)' : 'var(--border)', transform: i === idx ? 'scale(1.4)' : 'none' }} />
        ))}
      </div>
    </div>
  );
}

/* ─── Landing completa ────────────────────────────────────────────────── */
export default function LandingClient({ stats }: { stats: Stats }) {
  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  const asesoria = useReveal<HTMLDivElement>();

  return (
    <div style={{ background: 'var(--background)' }}>
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-40 backdrop-blur-md" style={{ background: 'rgba(255, 255, 255, 0.85)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-icon.svg" alt="Davinci Labs" className="w-8 h-8 rounded-md" />
            </div>
            <div className="leading-tight">
              <span className="font-semibold text-[15px]" style={{ color: 'var(--text-primary)' }}>Davinci</span>
              <span className="block text-[9px] tracking-[0.2em] uppercase" style={{ color: 'var(--accent-hover)' }}>Labs</span>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-7 text-sm" style={{ color: 'var(--text-secondary)' }}>
            <button onClick={() => scrollTo('servicios')} className="hover:text-[var(--brand)] transition-colors">Servicios</button>
            <button onClick={() => scrollTo('proceso')} className="hover:text-[var(--brand)] transition-colors">Proceso</button>
            <button onClick={() => scrollTo('asesorias')} className="hover:text-[var(--brand)] transition-colors">Asesorías</button>
            <button onClick={() => scrollTo('contacto')} className="hover:text-[var(--brand)] transition-colors">Contacto</button>
          </div>
          <Link href="/login" className="dv-btn-ghost !py-1.5 text-sm">Iniciar sesión</Link>
        </div>
      </nav>

      {/* Hero */}
      <header className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden dv-grad-navy">
        <Particles />
        <div className="relative text-center px-6 max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold leading-tight text-white dv-animate-up"
            style={{ letterSpacing: '-0.02em' }}>
            Automatizamos tu
            <span className="block" style={{ background: 'linear-gradient(90deg, #4EA1FF, #A8D2FF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              trabajo académico
            </span>
          </h1>
          <p className="text-base md:text-lg mt-6 text-white/65 dv-animate-up dv-delay-2">
            Procesamiento inteligente de documentos con IA.
            <br className="hidden md:block" /> Resultados precisos. Entrega inmediata.
          </p>
          <div className="flex flex-wrap justify-center gap-3 mt-9 dv-animate-up dv-delay-3">
            <Link href="/login" className="dv-btn-accent !px-8 !py-3 dv-pulse">Empezar ahora</Link>
            <button onClick={() => scrollTo('servicios')} className="!px-8 !py-3 rounded-3xl text-sm font-medium border border-white/25 text-white/85 hover:bg-white/10 transition-colors">Ver servicios</button>
          </div>
        </div>
        <button onClick={() => scrollTo('stats')} aria-label="Bajar"
          className="absolute bottom-8 dv-bounce text-white/50">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M19 12l-7 7-7-7" />
          </svg>
        </button>
      </header>

      {/* Métricas */}
      <section id="stats" className="py-20 -mt-20 relative z-10">
        <SectionStats stats={stats} />
      </section>

      {/* Servicios */}
      <section id="servicios" className="py-20">
        <SectionServicios />
      </section>

      {/* Proceso */}
      <section id="proceso" className="py-20" style={{ background: 'var(--surface-muted)' }}>
        <SectionProceso />
      </section>

      {/* Asesorías */}
      <section id="asesorias" className="py-20">
        <div ref={asesoria.ref} className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-10" style={revealStyle(asesoria.visible)}>
            <p className="dv-eyebrow mb-2" style={{ color: 'var(--accent-hover)' }}>Asesorías académicas</p>
            <h2 className="text-3xl font-semibold" style={{ color: 'var(--text-primary)' }}>Reserva una sesión con nuestro equipo</h2>
            <p className="text-sm mt-3" style={{ color: 'var(--text-secondary)' }}>
              Elige tu horario y recibe la invitación directo en tu calendario.
            </p>
          </div>
          <div style={revealStyle(asesoria.visible, 0.15)}>
            <BookingWidget />
          </div>
        </div>
      </section>

      {/* Testimonios */}
      <section className="py-20" style={{ background: 'var(--surface-muted)' }}>
        <SectionTestimonios />
      </section>

      {/* CTA final */}
      <section id="contacto" className="py-24 dv-grad-navy relative overflow-hidden">
        <div className="max-w-3xl mx-auto px-6 text-center relative">
          <h2 className="text-3xl md:text-4xl font-bold text-white">¿Listo para empezar?</h2>
          <p className="text-sm mt-4 mb-8 text-white/65">
            Únete a los cientos de estudiantes que ya confían en Davinci Labs.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/login" className="dv-btn-accent !px-8 !py-3">Entrar a la plataforma</Link>
            <a href="https://wa.me/51999999999?text=Hola%20Davinci%20Labs%2C%20quiero%20informaci%C3%B3n"
              target="_blank" rel="noopener noreferrer"
              className="!px-8 !py-3 rounded-3xl text-sm font-medium border border-white/25 text-white/85 hover:bg-white/10 transition-colors">
              Escríbenos por WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 border-t" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-icon.svg" alt="Davinci Labs" className="w-7 h-7 rounded-md" />
            <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
              Davinci Labs © {new Date().getFullYear()}
            </span>
          </div>
          <div className="flex items-center gap-6 text-xs" style={{ color: 'var(--text-muted)' }}>
            <a href="mailto:davincilabs.peru@gmail.com" className="hover:text-[var(--brand)] transition-colors">davincilabs.peru@gmail.com</a>
            <Link href="/login" className="hover:text-[var(--brand)] transition-colors">Acceso clientes</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

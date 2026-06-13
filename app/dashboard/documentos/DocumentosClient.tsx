'use client';

import { useEffect, useState, useCallback, useRef } from 'react';

type DocEstado = 'RECIBIDO' | 'EN_PROCESO' | 'COMPLETADO';
type Documento = {
  id: string;
  cliente_nombre: string;
  cliente_email: string | null;
  nombre_archivo: string;
  tipo_servicio: string;
  estado: DocEstado;
  tamano_bytes: number | null;
  url_drive: string | null;
  url_informe: string | null;
  reporte_ia_url: string | null;
  reporte_similitud_url: string | null;
  operador: string | null;
  created_at: string;
};

const ESTADOS: Record<DocEstado, { label: string; badge: string }> = {
  RECIBIDO: { label: 'Recibido', badge: 'dv-badge-warning' },
  EN_PROCESO: { label: 'En proceso', badge: 'dv-badge-brand' },
  COMPLETADO: { label: 'Completado', badge: 'dv-badge-success' },
};
const TIPOS = ['IA', 'SIMILITUD', 'AMBOS', 'TURNITIN_OFICIAL'];

const PANELES = [
  {
    nombre: 'iVerificate',
    detalle: 'Detección de IA',
    url: 'https://iverificate.com/originality/inbox',
    icono: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="4" width="16" height="16" rx="3" /><circle cx="9.5" cy="10" r="1" fill="currentColor" /><circle cx="14.5" cy="10" r="1" fill="currentColor" /><path d="M9 15h6" />
      </svg>
    ),
  },
  {
    nombre: 'Canvas / iThenticate',
    detalle: 'Similitud Turnitin',
    url: 'https://my.canvasacademic.com/ithenticate',
    icono: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3v18h18" /><rect x="7" y="10" width="3" height="7" rx="0.5" /><rect x="13" y="6" width="3" height="11" rx="0.5" />
      </svg>
    ),
  },
  {
    nombre: 'Turnitin Oficial',
    detalle: 'Cuenta institucional',
    url: 'https://www.turnitin.com/login_page.asp?lang=es',
    icono: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" />
      </svg>
    ),
  },
];

const kb = (b: number | null) => (b == null ? '—' : b < 1e6 ? (b / 1e3).toFixed(0) + ' KB' : (b / 1e6).toFixed(1) + ' MB');

function SkeletonTabla() {
  return (
    <div className="p-4 space-y-3">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-4">
          <div className="dv-skeleton h-9 w-1/4" />
          <div className="dv-skeleton h-9 w-1/3" />
          <div className="dv-skeleton h-9 flex-1" />
        </div>
      ))}
    </div>
  );
}

export default function DocumentosClient() {
  const [docs, setDocs] = useState<Documento[]>([]);
  const [cargando, setCargando] = useState(true);
  const [filtro, setFiltro] = useState<'TODOS' | DocEstado>('TODOS');
  const [subir, setSubir] = useState(false);
  const [activo, setActivo] = useState<Documento | null>(null);
  const informeRef = useRef<HTMLInputElement>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    const params = new URLSearchParams();
    if (filtro !== 'TODOS') params.set('estado', filtro);
    const r = await fetch('/api/documentos?' + params).then((x) => x.json());
    setDocs(Array.isArray(r) ? r : []);
    setCargando(false);
  }, [filtro]);

  useEffect(() => { cargar(); }, [cargar]);

  const cambiarEstado = async (id: string, estado: DocEstado) => {
    await fetch(`/api/documentos/${id}/estado`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado }),
    });
    cargar();
  };

  const [trayendo, setTrayendo] = useState<string>('');

  // Trae el informe desde iVerificate (IA) o Canvas (similitud): lista los
  // reportes disponibles, toma el primero listo y lo adjunta al documento.
  const traerReporte = async (doc: Documento, plataforma: 'iverificate' | 'canvas') => {
    setTrayendo(doc.id + plataforma);
    try {
      const lista = await fetch(`/api/reportes/listar?plataforma=${plataforma}`).then((x) => x.json());
      const reportes = lista.reportes ?? [];
      const listo = reportes.find((r: any) => /listo|complet/i.test(r.estado)) ?? reportes[0];
      if (!listo) { alert('No hay reportes disponibles en la plataforma.'); return; }
      const res = await fetch('/api/reportes/descargar', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plataforma, reporteId: listo.id, documentoId: doc.id, nombreCliente: doc.cliente_nombre }),
      });
      const r = await res.json();
      if (!res.ok) throw new Error(r.error);
      cargar();
    } catch (e: any) {
      alert('❌ ' + e.message);
    } finally {
      setTrayendo('');
    }
  };

  const subirInforme = async (doc: Documento, file: File) => {
    const fd = new FormData();
    fd.append('informe', file);
    const res = await fetch(`/api/documentos/${doc.id}/informe`, { method: 'POST', body: fd });
    if (res.ok) { alert('✅ Informe subido y publicado al cliente'); cargar(); }
    else alert('❌ ' + (await res.json()).error);
  };

  const conteo = (e: DocEstado) => docs.filter((d) => d.estado === e).length;

  return (
    <div className="space-y-6">
      {/* Paneles de procesamiento */}
      <div className="dv-animate-up">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="font-serif text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Paneles de procesamiento</h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Estos sitios bloquean el embebido (X-Frame-Options); se abren en ventana aparte con la sesión del operador.
            </p>
          </div>
          <button onClick={() => setSubir(true)} className="dv-btn-primary">
            + Subir documento
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {PANELES.map((p, i) => (
            <div key={p.nombre} className={`dv-card dv-hover-lift p-4 dv-animate-up dv-delay-${i + 1}`}>
              <div className="flex items-center gap-3 mb-3">
                <div className="dv-icon-tile" style={{ background: 'var(--brand-soft)', color: 'var(--brand)' }}>{p.icono}</div>
                <div>
                  <h3 className="text-sm font-semibold leading-tight" style={{ color: 'var(--text-primary)' }}>{p.nombre}</h3>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{p.detalle}</p>
                </div>
              </div>
              <button
                onClick={() => window.open(p.url, '_blank', 'noopener')}
                className="w-full py-2 rounded-lg text-xs font-medium border transition-colors hover:border-[var(--accent)] hover:text-[var(--accent-hover)]"
                style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)', background: 'var(--surface)' }}
              >
                Abrir en nueva ventana ↗
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {(['RECIBIDO', 'EN_PROCESO', 'COMPLETADO'] as DocEstado[]).map((e, i) => (
          <button key={e} onClick={() => setFiltro(filtro === e ? 'TODOS' : e)}
            className={`dv-card dv-hover-lift p-4 text-left dv-animate-up dv-delay-${i + 2} ${filtro === e ? 'ring-2 ring-[var(--accent)]' : ''}`}>
            <p className="dv-eyebrow mb-1">{ESTADOS[e].label}</p>
            <p className="text-2xl font-bold font-serif" style={{ color: 'var(--text-primary)' }}>{conteo(e)}</p>
          </button>
        ))}
      </div>

      {/* Tabla de documentos */}
      <div className="dv-card overflow-hidden dv-animate-up dv-delay-3">
        <div className="flex items-center gap-2 p-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <h2 className="font-serif text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Documentos</h2>
          <select value={filtro} onChange={(e) => setFiltro(e.target.value as any)} className="dv-input ml-auto !w-auto !py-1.5">
            <option value="TODOS">Todos</option>
            <option value="RECIBIDO">Recibidos</option>
            <option value="EN_PROCESO">En proceso</option>
            <option value="COMPLETADO">Completados</option>
          </select>
          <a href={`/api/documentos/daily-log?date=${new Date().toISOString().split('T')[0]}&format=csv`}
            className="px-3 py-1.5 text-sm border rounded-lg transition-colors hover:bg-[var(--surface-muted)]"
            style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
            ⬇ CSV
          </a>
          <a href={`/api/documentos/daily-log?date=${new Date().toISOString().split('T')[0]}&format=pdf`}
            className="px-3 py-1.5 text-sm border rounded-lg transition-colors hover:bg-[var(--surface-muted)]"
            style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
            ⬇ PDF
          </a>
        </div>

        {cargando ? (
          <SkeletonTabla />
        ) : docs.length === 0 ? (
          <div className="py-14 text-center dv-animate-in">
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No hay documentos. Sube el primero.</p>
          </div>
        ) : (
          <table className="dv-table">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Archivo</th>
                <th>Servicio</th>
                <th>Estado</th>
                <th>Drive</th>
                <th>Reportes</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {docs.map((d) => (
                <tr key={d.id}>
                  <td>
                    <div className="font-medium">{d.cliente_nombre}</div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{d.cliente_email || '—'}</div>
                  </td>
                  <td>
                    <div style={{ color: 'var(--text-secondary)' }}>{d.nombre_archivo}</div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{kb(d.tamano_bytes)}</div>
                  </td>
                  <td><span className="dv-badge dv-badge-muted">{d.tipo_servicio}</span></td>
                  <td>
                    <select value={d.estado} onChange={(e) => cambiarEstado(d.id, e.target.value as DocEstado)}
                      className={`dv-badge ${ESTADOS[d.estado].badge} cursor-pointer border-0`}>
                      {(Object.keys(ESTADOS) as DocEstado[]).map((e) => (
                        <option key={e} value={e}>{ESTADOS[e].label}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    {d.url_drive
                      ? <a href={d.url_drive} target="_blank" className="text-xs hover:underline" style={{ color: 'var(--accent-hover)' }}>Ver ↗</a>
                      : <span className="text-xs" style={{ color: 'var(--text-muted)' }}>sincronizando…</span>}
                  </td>
                  <td>
                    <div className="flex flex-col gap-1">
                      {d.reporte_ia_url
                        ? <a href={d.reporte_ia_url} target="_blank" className="text-xs hover:underline font-medium" style={{ color: 'var(--brand)' }}>🤖 IA ↗</a>
                        : <button onClick={() => traerReporte(d, 'iverificate')} disabled={trayendo === d.id + 'iverificate'}
                            className="text-xs text-left disabled:opacity-40 transition-colors hover:text-[var(--brand)]" style={{ color: 'var(--text-muted)' }}>
                            {trayendo === d.id + 'iverificate' ? '…' : '+ IA'}
                          </button>}
                      {d.reporte_similitud_url
                        ? <a href={d.reporte_similitud_url} target="_blank" className="text-xs hover:underline font-medium" style={{ color: 'var(--accent-hover)' }}>📊 Similitud ↗</a>
                        : <button onClick={() => traerReporte(d, 'canvas')} disabled={trayendo === d.id + 'canvas'}
                            className="text-xs text-left disabled:opacity-40 transition-colors hover:text-[var(--accent-hover)]" style={{ color: 'var(--text-muted)' }}>
                            {trayendo === d.id + 'canvas' ? '…' : '+ Similitud'}
                          </button>}
                    </div>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {d.url_informe ? (
                      <a href={d.url_informe} target="_blank" className="text-xs hover:underline font-medium" style={{ color: 'var(--success)' }}>📄 Informe</a>
                    ) : (
                      <button onClick={() => { setActivo(d); setTimeout(() => informeRef.current?.click(), 0); }}
                        className="text-xs transition-colors hover:text-[var(--text-primary)]" style={{ color: 'var(--text-muted)' }}>
                        Subir informe
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* input oculto para informe */}
      <input ref={informeRef} type="file" accept=".pdf" className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f && activo) subirInforme(activo, f);
          e.target.value = '';
        }} />

      {subir && <ModalSubir onClose={() => setSubir(false)} onDone={() => { setSubir(false); cargar(); }} />}
    </div>
  );
}

function ModalSubir({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [form, setForm] = useState({ cliente_nombre: '', cliente_email: '', tipo_servicio: 'AMBOS' });
  const [file, setFile] = useState<File | null>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [arrastrando, setArrastrando] = useState(false);

  const enviar = async () => {
    if (!file || !form.cliente_nombre) return;
    setSubiendo(true);
    try {
      const fd = new FormData();
      fd.append('archivo', file);
      fd.append('cliente_nombre', form.cliente_nombre);
      fd.append('cliente_email', form.cliente_email);
      fd.append('tipo_servicio', form.tipo_servicio);
      const res = await fetch('/api/documentos/upload', { method: 'POST', body: fd });
      if (!res.ok) throw new Error((await res.json()).error);
      onDone();
    } catch (e: any) {
      alert('❌ ' + e.message);
    } finally {
      setSubiendo(false);
    }
  };

  return (
    <div className="dv-modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="dv-modal max-w-md p-6">
        <h2 className="font-serif text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Subir documento</h2>
        <div className="space-y-3">
          <div>
            <label className="dv-label">Nombre del cliente *</label>
            <input value={form.cliente_nombre} onChange={(e) => setForm((f) => ({ ...f, cliente_nombre: e.target.value }))} className="dv-input" />
          </div>
          <div>
            <label className="dv-label">Email del cliente</label>
            <input type="email" value={form.cliente_email} onChange={(e) => setForm((f) => ({ ...f, cliente_email: e.target.value }))} className="dv-input" />
          </div>
          <div>
            <label className="dv-label">Servicio</label>
            <select value={form.tipo_servicio} onChange={(e) => setForm((f) => ({ ...f, tipo_servicio: e.target.value }))} className="dv-input">
              {TIPOS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="dv-label">Archivo (.docx / .pdf) *</label>
            <label
              onDragOver={(e) => { e.preventDefault(); setArrastrando(true); }}
              onDragLeave={() => setArrastrando(false)}
              onDrop={(e) => {
                e.preventDefault();
                setArrastrando(false);
                const f = e.dataTransfer.files?.[0];
                if (f) setFile(f);
              }}
              className="flex flex-col items-center justify-center gap-1 py-6 px-3 rounded-xl border-2 border-dashed cursor-pointer transition-colors text-center"
              style={{
                borderColor: arrastrando ? 'var(--accent)' : 'var(--border-strong)',
                background: arrastrando ? 'var(--accent-soft)' : 'var(--surface-muted)',
              }}
            >
              <input type="file" accept=".doc,.docx,.pdf" className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
              {file ? (
                <>
                  <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>📄 {file.name}</span>
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Click para cambiar</span>
                </>
              ) : (
                <>
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Arrastra el archivo aquí</span>
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>o haz click para buscarlo</span>
                </>
              )}
            </label>
          </div>
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 py-2.5 border rounded-xl text-sm transition-colors hover:bg-[var(--surface-muted)]"
            style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
            Cancelar
          </button>
          <button onClick={enviar} disabled={subiendo || !file || !form.cliente_nombre}
            className="flex-1 dv-btn-primary disabled:opacity-40">
            {subiendo ? 'Subiendo…' : 'Subir'}
          </button>
        </div>
      </div>
    </div>
  );
}

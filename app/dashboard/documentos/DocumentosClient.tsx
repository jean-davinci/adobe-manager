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

const ESTADOS: Record<DocEstado, { label: string; color: string }> = {
  RECIBIDO: { label: 'Recibido', color: 'bg-yellow-100 text-yellow-700' },
  EN_PROCESO: { label: 'En proceso', color: 'bg-blue-100 text-blue-700' },
  COMPLETADO: { label: 'Completado', color: 'bg-green-100 text-green-700' },
};
const TIPOS = ['IA', 'SIMILITUD', 'AMBOS', 'TURNITIN_OFICIAL'];

const PANELES = [
  { nombre: 'iVerificate (Detección IA)', url: 'https://iverificate.com/originality/inbox', emoji: '🤖', color: 'border-purple-200 bg-purple-50' },
  { nombre: 'Canvas / iThenticate (Similitud)', url: 'https://my.canvasacademic.com/ithenticate', emoji: '📊', color: 'border-blue-200 bg-blue-50' },
  { nombre: 'Turnitin Oficial', url: 'https://www.turnitin.com/login_page.asp?lang=es', emoji: '🎓', color: 'border-gray-200 bg-gray-50' },
];

const kb = (b: number | null) => (b == null ? '—' : b < 1e6 ? (b / 1e3).toFixed(0) + ' KB' : (b / 1e6).toFixed(1) + ' MB');

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
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-900">Paneles de procesamiento</h2>
          <button onClick={() => setSubir(true)}
            className="px-4 py-1.5 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-700 font-medium">
            + Subir documento
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {PANELES.map((p) => (
            <div key={p.nombre} className={`rounded-2xl border p-4 ${p.color}`}>
              <div className="text-2xl mb-2">{p.emoji}</div>
              <h3 className="text-sm font-semibold text-gray-900 leading-tight mb-1">{p.nombre}</h3>
              <p className="text-xs text-gray-500 mb-3">Sesión del operador (cookies en el navegador).</p>
              <button onClick={() => window.open(p.url, '_blank', 'noopener')}
                className="w-full py-2 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50">
                Abrir en nueva ventana ↗
              </button>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Estos sitios bloquean el embebido (X-Frame-Options), por eso se abren en ventana aparte y aquí queda el registro del documento activo.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {(['RECIBIDO', 'EN_PROCESO', 'COMPLETADO'] as DocEstado[]).map((e) => (
          <div key={e} className="bg-white rounded-2xl border border-gray-100 p-4">
            <p className="text-xs text-gray-400 mb-1">{ESTADOS[e].label}</p>
            <p className="text-2xl font-bold text-gray-900">{conteo(e)}</p>
          </div>
        ))}
      </div>

      {/* Tabla de documentos */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="flex items-center gap-2 p-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">Documentos</h2>
          <select value={filtro} onChange={(e) => setFiltro(e.target.value as any)}
            className="ml-auto border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm">
            <option value="TODOS">Todos</option>
            <option value="RECIBIDO">Recibidos</option>
            <option value="EN_PROCESO">En proceso</option>
            <option value="COMPLETADO">Completados</option>
          </select>
          <a href={`/api/documentos/daily-log?date=${new Date().toISOString().split('T')[0]}&format=csv`}
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-100">
            ⬇ CSV
          </a>
          <a href={`/api/documentos/daily-log?date=${new Date().toISOString().split('T')[0]}&format=pdf`}
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-100">
            ⬇ PDF
          </a>
        </div>

        {cargando ? (
          <div className="py-12 text-center text-gray-400 text-sm">Cargando...</div>
        ) : docs.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-sm">No hay documentos. Sube el primero.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-400 border-b border-gray-100">
                <th className="text-left font-medium px-4 py-2.5">Cliente</th>
                <th className="text-left font-medium px-4 py-2.5">Archivo</th>
                <th className="text-left font-medium px-4 py-2.5">Servicio</th>
                <th className="text-left font-medium px-4 py-2.5">Estado</th>
                <th className="text-left font-medium px-4 py-2.5">Drive</th>
                <th className="text-left font-medium px-4 py-2.5">Reportes</th>
                <th className="text-right font-medium px-4 py-2.5">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {docs.map((d) => (
                <tr key={d.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-2.5">
                    <div className="font-medium text-gray-900">{d.cliente_nombre}</div>
                    <div className="text-xs text-gray-400">{d.cliente_email || '—'}</div>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="text-gray-700">{d.nombre_archivo}</div>
                    <div className="text-xs text-gray-400">{kb(d.tamano_bytes)}</div>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{d.tipo_servicio}</span>
                  </td>
                  <td className="px-4 py-2.5">
                    <select value={d.estado} onChange={(e) => cambiarEstado(d.id, e.target.value as DocEstado)}
                      className={`text-xs px-2 py-1 rounded-lg border-0 font-medium ${ESTADOS[d.estado].color}`}>
                      {(Object.keys(ESTADOS) as DocEstado[]).map((e) => (
                        <option key={e} value={e}>{ESTADOS[e].label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-2.5">
                    {d.url_drive
                      ? <a href={d.url_drive} target="_blank" className="text-xs text-blue-500 hover:underline">Ver ↗</a>
                      : <span className="text-xs text-gray-300">sincronizando…</span>}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex flex-col gap-1">
                      {d.reporte_ia_url
                        ? <a href={d.reporte_ia_url} target="_blank" className="text-xs text-purple-600 hover:underline">🤖 IA ↗</a>
                        : <button onClick={() => traerReporte(d, 'iverificate')} disabled={trayendo === d.id + 'iverificate'}
                            className="text-xs text-gray-500 hover:text-purple-600 text-left disabled:opacity-40">
                            {trayendo === d.id + 'iverificate' ? '…' : '+ IA'}
                          </button>}
                      {d.reporte_similitud_url
                        ? <a href={d.reporte_similitud_url} target="_blank" className="text-xs text-blue-600 hover:underline">📊 Similitud ↗</a>
                        : <button onClick={() => traerReporte(d, 'canvas')} disabled={trayendo === d.id + 'canvas'}
                            className="text-xs text-gray-500 hover:text-blue-600 text-left disabled:opacity-40">
                            {trayendo === d.id + 'canvas' ? '…' : '+ Similitud'}
                          </button>}
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    {d.url_informe ? (
                      <a href={d.url_informe} target="_blank" className="text-xs text-green-600 hover:underline">📄 Informe</a>
                    ) : (
                      <button onClick={() => { setActivo(d); setTimeout(() => informeRef.current?.click(), 0); }}
                        className="text-xs text-gray-500 hover:text-gray-900">Subir informe</button>
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
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Subir documento</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Nombre del cliente *</label>
            <input value={form.cliente_nombre} onChange={(e) => setForm((f) => ({ ...f, cliente_nombre: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Email del cliente</label>
            <input type="email" value={form.cliente_email} onChange={(e) => setForm((f) => ({ ...f, cliente_email: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Servicio</label>
            <select value={form.tipo_servicio} onChange={(e) => setForm((f) => ({ ...f, tipo_servicio: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm">
              {TIPOS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Archivo (.docx / .pdf) *</label>
            <input type="file" accept=".doc,.docx,.pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="w-full text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-gray-100 file:text-gray-700" />
          </div>
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600">Cancelar</button>
          <button onClick={enviar} disabled={subiendo || !file || !form.cliente_nombre}
            className="flex-1 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-medium disabled:bg-gray-300">
            {subiendo ? 'Subiendo...' : 'Subir'}
          </button>
        </div>
      </div>
    </div>
  );
}

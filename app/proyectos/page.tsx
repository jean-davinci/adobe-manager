'use client';
import { useState, useEffect } from 'react';

type CursoTesis = 'TESIS_I' | 'TESIS_II' | 'TESIS_III';

interface Proyecto {
  id: string;
  nombre_alumno: string;
  carrera: string;
  curso_tesis: CursoTesis;
  titulo_tesis?: string;
  drive_link?: string;
  j1_nota?: number;
  j2_nota?: number;
  j3_nota?: number;
  j4_nota?: number;
  porcentaje_avance: number;
  notas?: string;
  created_at: string;
}

const CURSOS: Record<CursoTesis, { label: string; color: string; bg: string }> = {
  TESIS_I:   { label: 'Tesis I',   color: 'text-blue-700',   bg: 'bg-blue-100'   },
  TESIS_II:  { label: 'Tesis II',  color: 'text-purple-700', bg: 'bg-purple-100' },
  TESIS_III: { label: 'Tesis III', color: 'text-orange-700', bg: 'bg-orange-100' },
};

const FORM_VACIO = {
  nombre_alumno: '',
  carrera: 'Comunicación',
  curso_tesis: 'TESIS_I' as CursoTesis,
  titulo_tesis: '',
  drive_link: '',
  notas: '',
};

function colorNota(n?: number | null): string {
  if (n == null) return 'text-gray-300';
  if (n >= 14) return 'text-green-600';
  if (n >= 11) return 'text-yellow-500';
  return 'text-red-500';
}

function etiquetaNota(n?: number | null): string {
  if (n == null) return '';
  if (n >= 18) return 'Excelente';
  if (n >= 14) return 'Bueno';
  if (n >= 11) return 'Regular';
  return 'Desaprobado';
}

function promedio(p: Proyecto): number | null {
  const ns = [p.j1_nota, p.j2_nota, p.j3_nota, p.j4_nota].filter(n => n != null) as number[];
  if (!ns.length) return null;
  return ns.reduce((a, b) => a + b, 0) / ns.length;
}

export default function ProyectosPage() {
  const [proyectos, setProyectos]       = useState<Proyecto[]>([]);
  const [cargando, setCargando]         = useState(true);
  const [modal, setModal]               = useState(false);
  const [form, setForm]                 = useState(FORM_VACIO);
  const [guardando, setGuardando]       = useState(false);
  const [editJota, setEditJota]         = useState<{ id: string; campo: string } | null>(null);
  const [notaTemp, setNotaTemp]         = useState('');
  const [filtroCurso, setFiltroCurso]   = useState('TODOS');

  useEffect(() => { cargar(); }, []);

  async function cargar() {
    setCargando(true);
    try {
      const r = await fetch('/api/proyectos');
      if (r.ok) setProyectos(await r.json());
    } finally { setCargando(false); }
  }

  async function guardar() {
    if (!form.nombre_alumno.trim()) return alert('El nombre del alumno es requerido');
    setGuardando(true);
    try {
      const r = await fetch('/api/proyectos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (r.ok) { setModal(false); setForm(FORM_VACIO); await cargar(); }
      else { const e = await r.json(); alert('Error: ' + e.error); }
    } finally { setGuardando(false); }
  }

  async function guardarNota(id: string, campo: string) {
    const valor = notaTemp.trim() === '' ? null : parseFloat(notaTemp);
    await fetch(`/api/proyectos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [campo]: valor }),
    });
    setEditJota(null);
    await cargar();
  }

  async function actualizarAvance(id: string, v: number) {
    await fetch(`/api/proyectos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ porcentaje_avance: v }),
    });
    setProyectos(prev => prev.map(p => p.id === id ? { ...p, porcentaje_avance: v } : p));
  }

  const filtrados = proyectos.filter(p =>
    filtroCurso === 'TODOS' || p.curso_tesis === filtroCurso
  );

  const promGeneral = () => {
    const ps = proyectos.map(promedio).filter(n => n != null) as number[];
    if (!ps.length) return null;
    return ps.reduce((a, b) => a + b, 0) / ps.length;
  };
  const pg = promGeneral();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">📊 Proyectos de Tesis</h1>
          <p className="text-xs text-gray-400 mt-0.5">Seguimiento de notas y avance · J1 · J2 · J3 · J4</p>
        </div>
        <button
          onClick={() => { setForm(FORM_VACIO); setModal(true); }}
          className="bg-gray-900 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-700 transition-colors"
        >
          + Nuevo proyecto
        </button>
      </div>

      <div className="p-6 max-w-5xl mx-auto space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'TOTAL',         value: proyectos.length,                                           color: 'text-gray-900'   },
            { label: 'TESIS I',       value: proyectos.filter(p => p.curso_tesis === 'TESIS_I').length,  color: 'text-blue-600'   },
            { label: 'TESIS II',      value: proyectos.filter(p => p.curso_tesis === 'TESIS_II').length, color: 'text-purple-600' },
            { label: 'PROMEDIO GRAL', value: pg != null ? pg.toFixed(1) : '—',                           color: pg != null && pg >= 11 ? 'text-green-600' : 'text-red-500' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl p-5 border border-gray-100">
              <p className="text-xs text-gray-400 font-semibold tracking-wider mb-2">{s.label}</p>
              <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filtro */}
        <div className="flex gap-2">
          {[
            { val: 'TODOS',    lab: 'Todos' },
            { val: 'TESIS_I',  lab: 'Tesis I' },
            { val: 'TESIS_II', lab: 'Tesis II' },
            { val: 'TESIS_III',lab: 'Tesis III' },
          ].map(f => (
            <button key={f.val} onClick={() => setFiltroCurso(f.val)}
              className={`px-4 py-1.5 rounded-xl text-sm font-medium transition-all ${
                filtroCurso === f.val ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}>
              {f.lab}
            </button>
          ))}
        </div>

        {/* Lista */}
        {cargando ? (
          <div className="text-center py-12 text-gray-400">Cargando proyectos...</div>
        ) : filtrados.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">🎓</p>
            <p className="text-gray-500 font-medium">No hay proyectos</p>
            <p className="text-gray-400 text-sm mt-1">Crea el primero con el botón de arriba</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filtrados.map(p => {
              const cur  = CURSOS[p.curso_tesis];
              const prom = promedio(p);
              const jotas = [
                { label: 'J1', campo: 'j1_nota', nota: p.j1_nota },
                { label: 'J2', campo: 'j2_nota', nota: p.j2_nota },
                { label: 'J3', campo: 'j3_nota', nota: p.j3_nota },
                { label: 'J4', campo: 'j4_nota', nota: p.j4_nota },
              ];
              return (
                <div key={p.id} className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-sm transition-all">
                  {/* Top */}
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${cur.bg} ${cur.color}`}>
                          {cur.label}
                        </span>
                        {prom != null && (
                          <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                            prom >= 14 ? 'bg-green-100 text-green-700' :
                            prom >= 11 ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            Prom: {prom.toFixed(2)} · {etiquetaNota(prom)}
                          </span>
                        )}
                      </div>
                      <p className="font-bold text-gray-900 text-base leading-tight">{p.nombre_alumno}</p>
                      {p.titulo_tesis && (
                        <p className="text-sm text-gray-500 mt-0.5 line-clamp-1 italic">"{p.titulo_tesis}"</p>
                      )}
                      <p className="text-xs text-gray-400 mt-0.5">{p.carrera}</p>
                    </div>
                    {p.drive_link && (
                      <a href={p.drive_link} target="_blank" rel="noopener noreferrer"
                        className="shrink-0 text-xs bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1.5 rounded-xl hover:bg-blue-100 transition-colors font-medium flex items-center gap-1.5">
                        📁 Drive
                      </a>
                    )}
                  </div>

                  {/* Jotas — click para editar nota */}
                  <div className="grid grid-cols-4 gap-3 mb-4">
                    {jotas.map(j => {
                      const editing = editJota?.id === p.id && editJota?.campo === j.campo;
                      return (
                        <div key={j.campo} className="bg-gray-50 rounded-xl p-3 text-center">
                          <p className="text-xs font-bold text-gray-400 mb-1">{j.label}</p>
                          {editing ? (
                            <div className="space-y-1">
                              <input
                                type="number" min="0" max="20" step="0.5"
                                value={notaTemp}
                                onChange={e => setNotaTemp(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') guardarNota(p.id, j.campo); if (e.key === 'Escape') setEditJota(null); }}
                                className="w-full text-center border border-gray-300 rounded-lg py-1 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
                                autoFocus
                              />
                              <div className="flex gap-1">
                                <button onClick={() => guardarNota(p.id, j.campo)}
                                  className="flex-1 bg-gray-900 text-white text-xs py-1 rounded-lg hover:bg-gray-700 transition-colors">✓</button>
                                <button onClick={() => setEditJota(null)}
                                  className="flex-1 border border-gray-200 text-gray-500 text-xs py-1 rounded-lg hover:bg-gray-50 transition-colors">✕</button>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <button
                                onClick={() => { setEditJota({ id: p.id, campo: j.campo }); setNotaTemp(j.nota?.toString() || ''); }}
                                className={`text-2xl font-bold ${colorNota(j.nota)} hover:opacity-60 transition-opacity`}
                                title="Click para editar la nota"
                              >
                                {j.nota != null ? j.nota : '—'}
                              </button>
                              {j.nota != null && (
                                <p className={`text-xs mt-0.5 ${colorNota(j.nota)}`}>{etiquetaNota(j.nota)}</p>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Avance slider */}
                  <div>
                    <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                      <span>Avance del proyecto</span>
                      <span className="font-semibold text-gray-600">{p.porcentaje_avance}%</span>
                    </div>
                    <input
                      type="range" min="0" max="100" step="5"
                      value={p.porcentaje_avance}
                      onChange={e => actualizarAvance(p.id, parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer accent-gray-800"
                    />
                    <div className="flex justify-between text-xs text-gray-300 mt-0.5">
                      <span>0%</span><span>50%</span><span>100%</span>
                    </div>
                  </div>

                  {p.notas && (
                    <p className="mt-3 text-xs text-gray-400 bg-gray-50 rounded-xl px-3 py-2 italic">
                      📝 {p.notas}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={e => { if (e.target === e.currentTarget) setModal(false); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h2 className="font-bold text-gray-900 text-lg">Nuevo proyecto de tesis</h2>
              <button onClick={() => setModal(false)} className="text-gray-400 hover:text-gray-600 text-xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">✕</button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del alumno *</label>
                <input type="text" value={form.nombre_alumno}
                  onChange={e => setForm(p => ({ ...p, nombre_alumno: e.target.value }))}
                  placeholder="Ej: María García Torres"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Carrera</label>
                  <input type="text" value={form.carrera}
                    onChange={e => setForm(p => ({ ...p, carrera: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Curso *</label>
                  <select value={form.curso_tesis}
                    onChange={e => setForm(p => ({ ...p, curso_tesis: e.target.value as CursoTesis }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none bg-white">
                    <option value="TESIS_I">Tesis I</option>
                    <option value="TESIS_II">Tesis II</option>
                    <option value="TESIS_III">Tesis III</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Título de la tesis</label>
                <input type="text" value={form.titulo_tesis}
                  onChange={e => setForm(p => ({ ...p, titulo_tesis: e.target.value }))}
                  placeholder="Ej: Estrategias de comunicación digital..."
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">📁 Link de Google Drive</label>
                <input type="url" value={form.drive_link}
                  onChange={e => setForm(p => ({ ...p, drive_link: e.target.value }))}
                  placeholder="https://drive.google.com/..."
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200" />
                <p className="text-xs text-gray-400 mt-1">El botón Drive en cada tarjeta abrirá este enlace</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notas adicionales</label>
                <textarea value={form.notas}
                  onChange={e => setForm(p => ({ ...p, notas: e.target.value }))}
                  rows={2}
                  placeholder="Observaciones, pendientes, contexto..."
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 resize-none" />
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex gap-3 rounded-b-2xl">
              <button onClick={() => setModal(false)}
                className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50">
                Cancelar
              </button>
              <button onClick={guardar} disabled={guardando || !form.nombre_alumno.trim()}
                className="flex-1 bg-gray-900 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed">
                {guardando ? 'Guardando...' : 'Crear proyecto'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
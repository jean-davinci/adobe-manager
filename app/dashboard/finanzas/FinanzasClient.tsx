'use client';

import { useEffect, useState, useCallback } from 'react';

type TipoTx = 'INGRESO' | 'EGRESO';
type Transaccion = {
  id: string; tipo: TipoTx; categoria: string; monto: number; moneda: string;
  descripcion: string | null; cliente_nombre: string | null;
  comprobante_url: string | null; proveedor_id: string | null; fecha: string;
};
type Resumen = {
  mesActual: { ingresos: number; egresos: number; neto: number };
  variacion: { ingresos: number; egresos: number; neto: number };
  porCategoria: { categoria: string; total: number }[];
  serie: { mes: string; ingresos: number; egresos: number }[];
};
type Proveedor = {
  id: string; nombre: string; servicio: string | null;
  costo_por_uso: number | null; umbral_alerta: number | null;
  gasto_mes: number; pagos: number; alerta: boolean;
};

const CATEGORIAS = [
  'Turnitin Pasada', 'Afiliado', 'Servicio Adicional',
  'Proveedor Turnitin', 'Proveedor IA', 'Gasto Operativo', 'Otro',
];
const COLORES = ['#2563eb', '#7c3aed', '#16a34a', '#ea580c', '#db2777', '#0891b2', '#64748b'];

const money = (n: number, m = 'PEN') => (m === 'USD' ? '$ ' : 'S/. ') + n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const FORM_VACIO = {
  tipo: 'INGRESO' as TipoTx, categoria: 'Afiliado', monto: '', moneda: 'PEN',
  descripcion: '', cliente_nombre: '', proveedor_id: '', fecha: new Date().toISOString().split('T')[0],
};

export default function FinanzasClient() {
  const [tab, setTab] = useState<'movimientos' | 'proveedores'>('movimientos');

  return (
    <div className="space-y-6">
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {(['movimientos', 'proveedores'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
            {t === 'movimientos' ? 'Movimientos' : 'Proveedores'}
          </button>
        ))}
      </div>
      {tab === 'movimientos' ? <Movimientos /> : <Proveedores />}
    </div>
  );
}

function Movimientos() {
  const [resumen, setResumen] = useState<Resumen | null>(null);
  const [txs, setTxs] = useState<Transaccion[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [cargando, setCargando] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(FORM_VACIO);
  const [comprobante, setComprobante] = useState<File | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [filtroTipo, setFiltroTipo] = useState<'TODOS' | TipoTx>('TODOS');
  const [filtroCat, setFiltroCat] = useState('TODOS');

  const cargar = useCallback(async () => {
    setCargando(true);
    const params = new URLSearchParams();
    if (filtroTipo !== 'TODOS') params.set('tipo', filtroTipo);
    if (filtroCat !== 'TODOS') params.set('categoria', filtroCat);
    const [r, t] = await Promise.all([
      fetch('/api/finanzas/resumen').then((x) => x.json()),
      fetch('/api/finanzas/transacciones?' + params).then((x) => x.json()),
    ]);
    setResumen(r);
    setTxs(Array.isArray(t) ? t : []);
    setCargando(false);
  }, [filtroTipo, filtroCat]);

  useEffect(() => { cargar(); }, [cargar]);
  useEffect(() => {
    fetch('/api/finanzas/proveedores').then((x) => x.json()).then((p) => setProveedores(Array.isArray(p) ? p : []));
  }, []);

  const guardar = async () => {
    setGuardando(true);
    try {
      let comprobante_url: string | null = null;
      if (comprobante) {
        const fd = new FormData(); fd.append('comprobante', comprobante);
        const up = await fetch('/api/finanzas/comprobante', { method: 'POST', body: fd });
        if (up.ok) comprobante_url = (await up.json()).url;
      }
      const res = await fetch('/api/finanzas/transacciones', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, comprobante_url }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setModal(false); setForm(FORM_VACIO); setComprobante(null); cargar();
    } catch (e: any) {
      alert('❌ ' + e.message);
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = async (id: string) => {
    if (!confirm('¿Eliminar esta transacción?')) return;
    await fetch(`/api/finanzas/transacciones/${id}`, { method: 'DELETE' });
    cargar();
  };

  const exportar = (formato: 'csv' | 'pdf') => {
    const params = new URLSearchParams({ format: formato });
    if (filtroTipo !== 'TODOS') params.set('tipo', filtroTipo);
    if (filtroCat !== 'TODOS') params.set('categoria', filtroCat);
    window.open('/api/finanzas/reporte?' + params, '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">Resumen del mes en curso</p>
        <div className="flex gap-2">
          <button onClick={() => exportar('csv')} className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-100">⬇ CSV</button>
          <button onClick={() => exportar('pdf')} className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-100">⬇ PDF</button>
          <button onClick={() => setModal(true)} className="px-4 py-1.5 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-700 font-medium">+ Nueva transacción</button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard label="Ingresos del mes" valor={resumen?.mesActual.ingresos} variacion={resumen?.variacion.ingresos} color="text-green-600" />
        <KpiCard label="Egresos del mes" valor={resumen?.mesActual.egresos} variacion={resumen?.variacion.egresos} color="text-red-500" invertir />
        <KpiCard label="Margen neto" valor={resumen?.mesActual.neto} variacion={resumen?.variacion.neto} color="text-gray-900" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Ingresos vs egresos (6 meses)</h3>
          <BarChart serie={resumen?.serie ?? []} />
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Ingresos por categoría</h3>
          <Donut datos={resumen?.porCategoria ?? []} />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 p-4 border-b border-gray-100">
          <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value as any)} className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm">
            <option value="TODOS">Todos los tipos</option><option value="INGRESO">Ingresos</option><option value="EGRESO">Egresos</option>
          </select>
          <select value={filtroCat} onChange={(e) => setFiltroCat(e.target.value)} className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm">
            <option value="TODOS">Todas las categorías</option>
            {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <span className="text-xs text-gray-400 ml-auto">{txs.length} transacciones</span>
        </div>

        {cargando ? <div className="py-12 text-center text-gray-400 text-sm">Cargando...</div>
          : txs.length === 0 ? <div className="py-12 text-center text-gray-400 text-sm">Sin transacciones</div> : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-400 border-b border-gray-100">
                <th className="text-left font-medium px-4 py-2.5">Fecha</th>
                <th className="text-left font-medium px-4 py-2.5">Categoría</th>
                <th className="text-left font-medium px-4 py-2.5">Detalle</th>
                <th className="text-center font-medium px-4 py-2.5">Comp.</th>
                <th className="text-right font-medium px-4 py-2.5">Monto</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {txs.slice(0, 50).map((t) => (
                <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-2.5 text-gray-500 whitespace-nowrap">{t.fecha}</td>
                  <td className="px-4 py-2.5"><span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{t.categoria}</span></td>
                  <td className="px-4 py-2.5 text-gray-600">{t.cliente_nombre || t.descripcion || '—'}</td>
                  <td className="px-4 py-2.5 text-center">
                    {t.comprobante_url ? <a href={t.comprobante_url} target="_blank" className="text-blue-500" title="Ver comprobante">📎</a> : <span className="text-gray-200">—</span>}
                  </td>
                  <td className={`px-4 py-2.5 text-right font-semibold ${t.tipo === 'INGRESO' ? 'text-green-600' : 'text-red-500'}`}>
                    {t.tipo === 'INGRESO' ? '+' : '−'} {money(Number(t.monto), t.moneda)}
                  </td>
                  <td className="px-4 py-2.5 text-right"><button onClick={() => eliminar(t.id)} className="text-xs text-gray-300 hover:text-red-500">✕</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) setModal(false); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Nueva transacción</h2>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                {(['INGRESO', 'EGRESO'] as TipoTx[]).map((t) => (
                  <button key={t} onClick={() => setForm((f) => ({ ...f, tipo: t }))}
                    className={`py-2 rounded-xl text-sm font-medium border ${form.tipo === t ? t === 'INGRESO' ? 'bg-green-50 border-green-300 text-green-700' : 'bg-red-50 border-red-300 text-red-600' : 'border-gray-200 text-gray-500'}`}>
                    {t === 'INGRESO' ? '↑ Ingreso' : '↓ Egreso'}
                  </button>
                ))}
              </div>
              <Campo label="Categoría">
                <select value={form.categoria} onChange={(e) => setForm((f) => ({ ...f, categoria: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm">
                  {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </Campo>
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <Campo label="Monto">
                    <input type="number" step="0.01" value={form.monto} onChange={(e) => setForm((f) => ({ ...f, monto: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" />
                  </Campo>
                </div>
                <Campo label="Moneda">
                  <select value={form.moneda} onChange={(e) => setForm((f) => ({ ...f, moneda: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm">
                    <option value="PEN">PEN</option><option value="USD">USD</option>
                  </select>
                </Campo>
              </div>
              {form.tipo === 'EGRESO' && (
                <Campo label="Proveedor (opcional)">
                  <select value={form.proveedor_id} onChange={(e) => setForm((f) => ({ ...f, proveedor_id: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm">
                    <option value="">— Ninguno —</option>
                    {proveedores.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                  </select>
                </Campo>
              )}
              <Campo label="Cliente / Detalle (opcional)">
                <input value={form.cliente_nombre} onChange={(e) => setForm((f) => ({ ...f, cliente_nombre: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" />
              </Campo>
              <Campo label="Fecha">
                <input type="date" value={form.fecha} onChange={(e) => setForm((f) => ({ ...f, fecha: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" />
              </Campo>
              <Campo label="Comprobante (.pdf/.jpg, opcional)">
                <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setComprobante(e.target.files?.[0] ?? null)}
                  className="w-full text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-gray-100 file:text-gray-700" />
              </Campo>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setModal(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600">Cancelar</button>
              <button onClick={guardar} disabled={guardando || !form.monto} className="flex-1 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-medium disabled:bg-gray-300">
                {guardando ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Proveedores() {
  const [provs, setProvs] = useState<Proveedor[]>([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ nombre: '', servicio: '', costo_por_uso: '', umbral_alerta: '' });
  const [expandido, setExpandido] = useState<string | null>(null);
  const [historial, setHistorial] = useState<Transaccion[]>([]);

  const cargar = useCallback(async () => {
    const p = await fetch('/api/finanzas/proveedores').then((x) => x.json());
    setProvs(Array.isArray(p) ? p : []);
  }, []);
  useEffect(() => { cargar(); }, [cargar]);

  const verHistorial = async (id: string) => {
    if (expandido === id) { setExpandido(null); return; }
    const h = await fetch(`/api/finanzas/proveedores/${id}/historial`).then((x) => x.json());
    setHistorial(Array.isArray(h) ? h : []);
    setExpandido(id);
  };

  const guardar = async () => {
    if (!form.nombre) return;
    const res = await fetch('/api/finanzas/proveedores', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    if (res.ok) { setModal(false); setForm({ nombre: '', servicio: '', costo_por_uso: '', umbral_alerta: '' }); cargar(); }
  };

  const eliminar = async (id: string) => {
    if (!confirm('¿Eliminar proveedor?')) return;
    await fetch(`/api/finanzas/proveedores?id=${id}`, { method: 'DELETE' });
    cargar();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">Gasto del mes por proveedor</p>
        <button onClick={() => setModal(true)} className="px-4 py-1.5 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-700 font-medium">+ Nuevo proveedor</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {provs.map((p) => (
          <div key={p.id} className={`bg-white rounded-2xl border p-5 ${p.alerta ? 'border-red-300' : 'border-gray-100'}`}>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">{p.nombre}</h3>
                <p className="text-xs text-gray-400">{p.servicio || '—'}</p>
              </div>
              <button onClick={() => eliminar(p.id)} className="text-xs text-gray-300 hover:text-red-500">✕</button>
            </div>
            <div className="mt-4 flex items-end justify-between">
              <div>
                <p className="text-xs text-gray-400">Gasto este mes</p>
                <p className={`text-xl font-bold ${p.alerta ? 'text-red-600' : 'text-gray-900'}`}>{money(p.gasto_mes)}</p>
              </div>
              <span className="text-xs text-gray-400">{p.pagos} pagos</span>
            </div>
            {p.umbral_alerta != null && (
              <p className={`text-xs mt-2 ${p.alerta ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                {p.alerta ? '⚠ Supera el umbral' : 'Umbral'}: {money(Number(p.umbral_alerta))}
              </p>
            )}
            {p.costo_por_uso != null && <p className="text-xs text-gray-400 mt-1">Costo/uso: {money(Number(p.costo_por_uso))}</p>}
            <button onClick={() => verHistorial(p.id)} className="mt-3 text-xs text-blue-500 hover:underline">
              {expandido === p.id ? 'Ocultar historial' : 'Ver historial'}
            </button>
            {expandido === p.id && (
              <div className="mt-2 border-t border-gray-100 pt-2 space-y-1 max-h-40 overflow-y-auto">
                {historial.length === 0 ? <p className="text-xs text-gray-400">Sin pagos registrados</p>
                  : historial.map((h) => (
                    <div key={h.id} className="flex justify-between text-xs">
                      <span className="text-gray-500">{h.fecha}</span>
                      <span className="text-red-500 font-medium">{money(Number(h.monto), h.moneda)}</span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        ))}
        {provs.length === 0 && <p className="text-sm text-gray-400">Sin proveedores aún.</p>}
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) setModal(false); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Nuevo proveedor</h2>
            <div className="space-y-3">
              <Campo label="Nombre *"><input value={form.nombre} onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" /></Campo>
              <Campo label="Servicio que provee"><input value={form.servicio} onChange={(e) => setForm((f) => ({ ...f, servicio: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" /></Campo>
              <div className="grid grid-cols-2 gap-2">
                <Campo label="Costo por uso"><input type="number" step="0.01" value={form.costo_por_uso} onChange={(e) => setForm((f) => ({ ...f, costo_por_uso: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" /></Campo>
                <Campo label="Umbral de alerta"><input type="number" step="0.01" value={form.umbral_alerta} onChange={(e) => setForm((f) => ({ ...f, umbral_alerta: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" /></Campo>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setModal(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600">Cancelar</button>
              <button onClick={guardar} disabled={!form.nombre} className="flex-1 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-medium disabled:bg-gray-300">Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>{children}</div>;
}

function KpiCard({ label, valor, variacion, color, invertir }: { label: string; valor?: number; variacion?: number; color: string; invertir?: boolean; }) {
  const v = variacion ?? 0;
  const positivo = invertir ? v < 0 : v > 0;
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{valor == null ? '—' : money(valor)}</p>
      {variacion != null && (
        <p className={`text-xs mt-1 ${positivo ? 'text-green-600' : 'text-red-500'}`}>{v >= 0 ? '▲' : '▼'} {Math.abs(v).toFixed(1)}% vs mes anterior</p>
      )}
    </div>
  );
}

function BarChart({ serie }: { serie: { mes: string; ingresos: number; egresos: number }[] }) {
  if (!serie.length) return <div className="h-44 flex items-center justify-center text-gray-300 text-sm">Sin datos</div>;
  const max = Math.max(1, ...serie.flatMap((s) => [s.ingresos, s.egresos]));
  return (
    <div>
      <div className="flex items-end gap-4 h-44">
        {serie.map((s) => (
          <div key={s.mes} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
            <div className="flex items-end gap-1 w-full justify-center h-full">
              <div className="w-1/3 bg-green-500 rounded-t" style={{ height: `${(s.ingresos / max) * 100}%` }} title={money(s.ingresos)} />
              <div className="w-1/3 bg-red-400 rounded-t" style={{ height: `${(s.egresos / max) * 100}%` }} title={money(s.egresos)} />
            </div>
            <span className="text-[10px] text-gray-400">{s.mes.slice(5)}</span>
          </div>
        ))}
      </div>
      <div className="flex gap-4 mt-3 text-xs text-gray-500">
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-green-500 rounded-sm" /> Ingresos</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-red-400 rounded-sm" /> Egresos</span>
      </div>
    </div>
  );
}

function Donut({ datos }: { datos: { categoria: string; total: number }[] }) {
  const total = datos.reduce((a, d) => a + d.total, 0);
  if (!total) return <div className="h-44 flex items-center justify-center text-gray-300 text-sm">Sin datos</div>;
  let acum = 0;
  const r = 54, c = 2 * Math.PI * r;
  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 140 140" className="w-36 h-36 -rotate-90">
        {datos.map((d, i) => {
          const frac = d.total / total; const dash = frac * c;
          const el = <circle key={d.categoria} cx="70" cy="70" r={r} fill="none" stroke={COLORES[i % COLORES.length]} strokeWidth="18" strokeDasharray={`${dash} ${c - dash}`} strokeDashoffset={-acum} />;
          acum += dash; return el;
        })}
      </svg>
      <div className="mt-3 w-full space-y-1">
        {datos.slice(0, 5).map((d, i) => (
          <div key={d.categoria} className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-gray-600"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: COLORES[i % COLORES.length] }} />{d.categoria}</span>
            <span className="text-gray-400">{((d.total / total) * 100).toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

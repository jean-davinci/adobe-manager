'use client';
import { useState, useEffect } from 'react';

interface ResumenServicio {
  tipo: string;
  label: string;
  emoji: string;
  ingresos: number;
  cantidad: number;
  color: string;
}

// Costos fijos de proveedores (editables)
const GASTOS_DEFAULT = {
  adobe_por_cuenta: 18,
  turnitin_mensual: 50,
  otros: 0,
};

export default function GananciasPage() {
  const [cuentasAdobe, setCuentasAdobe] = useState(0);
  const [servicios, setServicios]       = useState<any[]>([]);
  const [cargando, setCargando]         = useState(true);
  const [gastos, setGastos]             = useState(GASTOS_DEFAULT);
  const [editandoGastos, setEditandoGastos] = useState(false);
  const [mes, setMes] = useState(() => {
    const hoy = new Date();
    return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  async function cargarDatos() {
    setCargando(true);
    try {
      const [rAdobe, rServicios] = await Promise.all([
        fetch('/api/clientes'),
        fetch('/api/servicios'),
      ]);
      if (rAdobe.ok) {
        const data = await rAdobe.json();
        const activos = data.filter((c: any) => c.estado === 'ACTIVO');
        setCuentasAdobe(activos.length);
      }
      if (rServicios.ok) {
        setServicios(await rServicios.json());
      }
    } finally {
      setCargando(false);
    }
  }

  // Filtrar por mes seleccionado
  const serviciosMes = servicios.filter(s => {
    if (!s.created_at) return false;
    return s.created_at.startsWith(mes);
  });

  // Calcular ingresos por tipo
  const porTipo: Record<string, ResumenServicio> = {
    TURNITIN: {
      tipo: 'TURNITIN', label: 'Turnitin', emoji: '📄',
      ingresos: 0, cantidad: 0, color: 'bg-blue-100 text-blue-700',
    },
    IA_REDUCCION: {
      tipo: 'IA_REDUCCION', label: 'Reducción IA', emoji: '🤖',
      ingresos: 0, cantidad: 0, color: 'bg-purple-100 text-purple-700',
    },
    ASESORIA: {
      tipo: 'ASESORIA', label: 'Asesoría', emoji: '📚',
      ingresos: 0, cantidad: 0, color: 'bg-green-100 text-green-700',
    },
    TESIS_COMPLETA: {
      tipo: 'TESIS_COMPLETA', label: 'Tesis Completa', emoji: '🎓',
      ingresos: 0, cantidad: 0, color: 'bg-orange-100 text-orange-700',
    },
  };

  serviciosMes.forEach(s => {
    if (porTipo[s.tipo_servicio]) {
      porTipo[s.tipo_servicio].ingresos += Number(s.monto) || 0;
      porTipo[s.tipo_servicio].cantidad += 1;
    }
  });

  // Ingresos Adobe (estimado: cuentas activas × precio promedio cliente)
  // Se asume S/. 40 promedio — el usuario puede ajustar
  const [precioPromedioAdobe, setPrecioPromedioAdobe] = useState(40);
  const ingresosAdobe    = cuentasAdobe * precioPromedioAdobe;
  const ingresosServicios = Object.values(porTipo).reduce((a, b) => a + b.ingresos, 0);
  const totalIngresos    = ingresosAdobe + ingresosServicios;

  // Gastos
  const gastoAdobe    = cuentasAdobe * gastos.adobe_por_cuenta;
  const gastoTurnitin = gastos.turnitin_mensual;
  const gastoOtros    = gastos.otros;
  const totalGastos   = gastoAdobe + gastoTurnitin + gastoOtros;
  const gananciaNet   = totalIngresos - totalGastos;
  const margen        = totalIngresos > 0 ? Math.round((gananciaNet / totalIngresos) * 100) : 0;

  const MESES = [
    { value: '2026-01', label: 'Enero 2026' },
    { value: '2026-02', label: 'Febrero 2026' },
    { value: '2026-03', label: 'Marzo 2026' },
    { value: '2026-04', label: 'Abril 2026' },
    { value: '2026-05', label: 'Mayo 2026' },
    { value: '2026-06', label: 'Junio 2026' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">💰 Ganancias</h1>
          <p className="text-xs text-gray-400 mt-0.5">Panel financiero · Ingresos y gastos</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={mes}
            onChange={e => setMes(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none"
          >
            {MESES.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
          <button
            onClick={() => setEditandoGastos(!editandoGastos)}
            className="text-sm border border-gray-200 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors text-gray-600"
          >
            ⚙️ Configurar gastos
          </button>
        </div>
      </div>

      <div className="p-6 max-w-5xl mx-auto space-y-6">

        {/* Configuración de gastos (colapsable) */}
        {editandoGastos && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-800 mb-4">⚙️ Configuración de costos</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Costo proveedor Adobe (por cuenta) S/.
                </label>
                <input
                  type="number"
                  value={gastos.adobe_por_cuenta}
                  onChange={e => setGastos(p => ({ ...p, adobe_por_cuenta: parseFloat(e.target.value) || 0 }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Precio promedio que cobras por Adobe S/.
                </label>
                <input
                  type="number"
                  value={precioPromedioAdobe}
                  onChange={e => setPrecioPromedioAdobe(parseFloat(e.target.value) || 0)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Costo proveedor Turnitin (mensual) S/.
                </label>
                <input
                  type="number"
                  value={gastos.turnitin_mensual}
                  onChange={e => setGastos(p => ({ ...p, turnitin_mensual: parseFloat(e.target.value) || 0 }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Otros gastos S/.
                </label>
                <input
                  type="number"
                  value={gastos.otros}
                  onChange={e => setGastos(p => ({ ...p, otros: parseFloat(e.target.value) || 0 }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
                />
              </div>
            </div>
            <button
              onClick={() => setEditandoGastos(false)}
              className="mt-4 bg-gray-900 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-700 transition-colors"
            >
              Guardar configuración
            </button>
          </div>
        )}

        {/* Resumen principal */}
        <div className="grid grid-cols-3 gap-4">
          {/* Ingresos */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                <span className="text-green-600 text-sm">↑</span>
              </div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Ingresos</p>
            </div>
            <p className="text-3xl font-bold text-gray-900">S/. {totalIngresos.toFixed(2)}</p>
            <p className="text-xs text-gray-400 mt-1">este mes</p>
          </div>

          {/* Gastos */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                <span className="text-red-600 text-sm">↓</span>
              </div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Gastos</p>
            </div>
            <p className="text-3xl font-bold text-gray-900">S/. {totalGastos.toFixed(2)}</p>
            <p className="text-xs text-gray-400 mt-1">proveedores</p>
          </div>

          {/* Ganancia neta */}
          <div className={`rounded-2xl p-5 ${gananciaNet >= 0 ? 'bg-green-600' : 'bg-red-600'}`}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                <span className="text-white text-sm">💰</span>
              </div>
              <p className="text-xs font-semibold text-white/70 uppercase tracking-wider">Ganancia neta</p>
            </div>
            <p className="text-3xl font-bold text-white">S/. {gananciaNet.toFixed(2)}</p>
            <p className="text-xs text-white/60 mt-1">margen {margen}%</p>
          </div>
        </div>

        {/* Desglose */}
        <div className="grid grid-cols-2 gap-4">
          {/* Ingresos por servicio */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-800 mb-4 text-sm">📈 Ingresos por servicio</h3>
            <div className="space-y-3">
              {/* Adobe */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-base">🎨</span>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Adobe Creative Cloud</p>
                    <p className="text-xs text-gray-400">{cuentasAdobe} cuentas activas</p>
                  </div>
                </div>
                <p className="font-semibold text-gray-900 text-sm">S/. {ingresosAdobe.toFixed(2)}</p>
              </div>
              <div className="h-px bg-gray-100" />
              {/* Servicios */}
              {Object.values(porTipo).map(s => (
                <div key={s.tipo} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{s.emoji}</span>
                    <div>
                      <p className="text-sm font-medium text-gray-700">{s.label}</p>
                      <p className="text-xs text-gray-400">{s.cantidad} servicios</p>
                    </div>
                  </div>
                  <p className="font-semibold text-gray-900 text-sm">S/. {s.ingresos.toFixed(2)}</p>
                </div>
              ))}
              <div className="h-px bg-gray-100" />
              <div className="flex justify-between">
                <p className="text-sm font-bold text-gray-700">Total ingresos</p>
                <p className="text-sm font-bold text-green-600">S/. {totalIngresos.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Gastos por categoría */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-800 mb-4 text-sm">📉 Gastos por categoría</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-base">🎨</span>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Proveedor Adobe</p>
                    <p className="text-xs text-gray-400">{cuentasAdobe} × S/. {gastos.adobe_por_cuenta}</p>
                  </div>
                </div>
                <p className="font-semibold text-red-600 text-sm">S/. {gastoAdobe.toFixed(2)}</p>
              </div>
              <div className="h-px bg-gray-100" />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-base">📄</span>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Proveedor Turnitin</p>
                    <p className="text-xs text-gray-400">acceso mensual</p>
                  </div>
                </div>
                <p className="font-semibold text-red-600 text-sm">S/. {gastoTurnitin.toFixed(2)}</p>
              </div>
              <div className="h-px bg-gray-100" />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-base">📦</span>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Otros gastos</p>
                    <p className="text-xs text-gray-400">herramientas, etc.</p>
                  </div>
                </div>
                <p className="font-semibold text-red-600 text-sm">S/. {gastoOtros.toFixed(2)}</p>
              </div>
              <div className="h-px bg-gray-100" />
              <div className="flex justify-between">
                <p className="text-sm font-bold text-gray-700">Total gastos</p>
                <p className="text-sm font-bold text-red-600">S/. {totalGastos.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Barra visual de margen */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800 text-sm">📊 Distribución de ingresos</h3>
            <span className="text-xs text-gray-400">margen neto {margen}%</span>
          </div>
          <div className="h-4 bg-gray-100 rounded-full overflow-hidden flex">
            {totalIngresos > 0 && (
              <>
                <div
                  className="h-full bg-red-400 transition-all"
                  style={{ width: `${Math.round((totalGastos / totalIngresos) * 100)}%` }}
                  title={`Gastos: ${Math.round((totalGastos / totalIngresos) * 100)}%`}
                />
                <div
                  className="h-full bg-green-500 transition-all"
                  style={{ width: `${margen}%` }}
                  title={`Ganancia: ${margen}%`}
                />
              </>
            )}
          </div>
          <div className="flex gap-4 mt-2">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-red-400" />
              <span className="text-xs text-gray-500">Gastos ({Math.round((totalGastos / (totalIngresos || 1)) * 100)}%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-green-500" />
              <span className="text-xs text-gray-500">Ganancia ({margen}%)</span>
            </div>
          </div>
        </div>

        {cargando && (
          <p className="text-center text-gray-400 text-sm py-4">Cargando datos...</p>
        )}
      </div>
    </div>
  );
}
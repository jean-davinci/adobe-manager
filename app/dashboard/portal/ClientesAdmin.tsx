'use client';

import { useState } from 'react';

type Cliente = {
  id: string;
  nombre: string;
  email: string;
  activo: boolean;
  created_at: string;
  saldo: number;
  servicios: string[];
};

function ClienteRow({ cliente: c0 }: { cliente: Cliente }) {
  const [cliente, setCliente] = useState(c0);
  const [abierto, setAbierto] = useState(false);
  const [formAdobe, setFormAdobe] = useState({ email_adobe: '', plan: 'Creative Cloud', fecha_inicio: '', fecha_vencimiento: '', notas: '' });
  const [creditosExtra, setCreditosExtra] = useState('');
  const [guardando, setGuardando] = useState(false);

  const patch = async (body: Record<string, any>) => {
    setGuardando(true);
    try {
      const res = await fetch(`/api/admin/portal/clientes/${cliente.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      return res.ok;
    } finally {
      setGuardando(false);
    }
  };

  const toggleServicio = async (servicio: string) => {
    const tieneAcceso = cliente.servicios.includes(servicio);
    const ok = await patch({ accion: tieneAcceso ? 'revocar_acceso' : 'otorgar_acceso', servicio });
    if (ok) {
      setCliente((v) => ({
        ...v,
        servicios: tieneAcceso
          ? v.servicios.filter((s) => s !== servicio)
          : [...v.servicios, servicio],
      }));
    }
  };

  const agregarCreditos = async () => {
    const n = Number(creditosExtra);
    if (!n || n < 1) return;
    const ok = await patch({ accion: 'agregar_creditos', cantidad: n });
    if (ok) {
      setCliente((v) => ({ ...v, saldo: v.saldo + n }));
      setCreditosExtra('');
    }
  };

  const asignarAdobe = async () => {
    if (!formAdobe.email_adobe) return;
    const ok = await patch({ accion: 'asignar_adobe', ...formAdobe });
    if (ok) {
      if (!cliente.servicios.includes('adobe')) {
        await patch({ accion: 'otorgar_acceso', servicio: 'adobe' });
        setCliente((v) => ({ ...v, servicios: [...v.servicios, 'adobe'] }));
      }
    }
  };

  return (
    <div style={{ borderBottom: '1px solid var(--border)' }}>
      <div
        className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-black/[0.02] transition-colors"
        onClick={() => setAbierto(!abierto)}
      >
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
          style={{ background: 'var(--surface-2)', color: 'var(--brand)', border: '1px solid var(--border)' }}
        >
          {cliente.nombre.split(' ').map((p: string) => p[0]).slice(0, 2).join('').toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>{cliente.nombre}</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{cliente.email}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {['turnitin', 'adobe'].map((s) => (
            <span
              key={s}
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{
                background: cliente.servicios.includes(s) ? 'var(--success-soft)' : 'var(--surface-2)',
                color: cliente.servicios.includes(s) ? 'var(--success)' : 'var(--text-muted)',
              }}
            >
              {s === 'turnitin' ? '📊' : '🎨'} {s}
            </span>
          ))}
          <span
            className="text-xs px-2 py-0.5 rounded-full font-medium"
            style={{ background: 'rgba(255,193,7,0.1)', color: 'var(--warning)' }}
          >
            💳 {cliente.saldo}
          </span>
          <span
            className="text-xs px-2 py-0.5 rounded-full"
            style={{ background: cliente.activo ? 'var(--success-soft)' : 'var(--danger-soft)',
                     color: cliente.activo ? 'var(--success)' : 'var(--danger)' }}
          >
            {cliente.activo ? 'Activo' : 'Inactivo'}
          </span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            className={`transition-transform ${abierto ? 'rotate-180' : ''}`} style={{ color: 'var(--text-muted)' }}>
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>

      {abierto && (
        <div className="px-5 pb-5 pt-2 space-y-5" style={{ background: 'var(--surface-2)' }}>
          {/* Servicios */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>Acceso a servicios</p>
            <div className="flex gap-2">
              {['turnitin', 'adobe'].map((s) => (
                <button
                  key={s}
                  onClick={() => toggleServicio(s)}
                  disabled={guardando}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-50"
                  style={{
                    background: cliente.servicios.includes(s) ? 'var(--danger-soft)' : 'var(--success-soft)',
                    color: cliente.servicios.includes(s) ? 'var(--danger)' : 'var(--success)',
                    border: '1px solid currentColor',
                  }}
                >
                  {cliente.servicios.includes(s) ? `✗ Revocar ${s}` : `✓ Activar ${s}`}
                </button>
              ))}
            </div>
          </div>

          {/* Créditos */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
              Créditos ({cliente.saldo} disponibles)
            </p>
            <div className="flex gap-2">
              <input
                type="number"
                min="1"
                value={creditosExtra}
                onChange={(e) => setCreditosExtra(e.target.value)}
                placeholder="Cantidad a agregar"
                className="dv-input flex-1 text-xs py-1.5"
              />
              <button
                onClick={agregarCreditos}
                disabled={guardando || !creditosExtra}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-white disabled:opacity-50"
                style={{ background: 'var(--brand)' }}
              >
                + Agregar créditos
              </button>
            </div>
          </div>

          {/* Adobe */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>Cuenta Adobe</p>
            <div className="grid sm:grid-cols-2 gap-2">
              <input type="email" placeholder="email@adobe.com" value={formAdobe.email_adobe}
                onChange={(e) => setFormAdobe((v) => ({ ...v, email_adobe: e.target.value }))}
                className="dv-input text-xs py-1.5" />
              <input type="text" placeholder="Plan (ej. Creative Cloud)" value={formAdobe.plan}
                onChange={(e) => setFormAdobe((v) => ({ ...v, plan: e.target.value }))}
                className="dv-input text-xs py-1.5" />
              <input type="date" placeholder="Inicio" value={formAdobe.fecha_inicio}
                onChange={(e) => setFormAdobe((v) => ({ ...v, fecha_inicio: e.target.value }))}
                className="dv-input text-xs py-1.5" />
              <input type="date" placeholder="Vencimiento" value={formAdobe.fecha_vencimiento}
                onChange={(e) => setFormAdobe((v) => ({ ...v, fecha_vencimiento: e.target.value }))}
                className="dv-input text-xs py-1.5" />
              <input type="text" placeholder="Notas" value={formAdobe.notas}
                onChange={(e) => setFormAdobe((v) => ({ ...v, notas: e.target.value }))}
                className="dv-input text-xs py-1.5 sm:col-span-2" />
            </div>
            <button
              onClick={asignarAdobe}
              disabled={guardando || !formAdobe.email_adobe}
              className="mt-2 px-3 py-1.5 rounded-lg text-xs font-medium text-white disabled:opacity-50"
              style={{ background: '#FF0000' }}
            >
              Asignar cuenta Adobe
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ClientesAdmin({ clientesIniciales }: { clientesIniciales: Cliente[] }) {
  const [busqueda, setBusqueda] = useState('');
  const clientes = clientesIniciales.filter(
    (c) => c.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
            c.email.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <input
        type="search"
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        placeholder="Buscar por nombre o email…"
        className="dv-input"
      />
      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
        {clientes.length === 0 ? (
          <div className="py-10 text-center" style={{ background: 'var(--surface)', color: 'var(--text-muted)' }}>
            {busqueda ? 'No se encontraron clientes.' : 'Aún no hay clientes registrados.'}
          </div>
        ) : (
          clientes.map((c) => (
            <div key={c.id} style={{ background: 'var(--surface)' }}>
              <ClienteRow cliente={c} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}

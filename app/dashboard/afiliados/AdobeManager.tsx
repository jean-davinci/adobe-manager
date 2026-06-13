'use client';
import { useState, useEffect } from 'react';
import TablaClientes from '@/app/TablaClientes';
import Metricas from '@/app/Metricas';
import Factura from '@/app/Factura';
import GmailReader from '@/app/GmailReader';

export default function AdobeManager() {
  const [refresh, setRefresh] = useState(0);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [clienteSeleccionado, setClienteSeleccionado] = useState<any>(null);
  const [editando, setEditando] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [emailEnviado, setEmailEnviado] = useState<string[]>([]);
  const [mostrarGmail, setMostrarGmail] = useState(false);
  const [mostrarGmailCliente, setMostrarGmailCliente] = useState(false);
  const [mostrarAdobeCliente, setMostrarAdobeCliente] = useState(false);
  const [mostrarFactura, setMostrarFactura] = useState(false);
  const [form, setForm] = useState({
    numero_pedido: '', nombre_cliente: '', email_cliente: '',
    telefono: '', plan_duracion: '1', costo_servicio: '44.90',
    email_adobe: '', contraseña_adobe: ''
  });

  const planCosto: any = { '1': '44.90', '3': '124.90', '6': '199.90', '12': '289.90' };

  const cargarSiguienteNumero = async () => {
    const res = await fetch('/api/clientes/siguiente-pedido');
    const data = await res.json();
    setForm(f => ({ ...f, numero_pedido: data.numero_pedido }));
  };

  useEffect(() => {
    if (mostrarForm) cargarSiguienteNumero();
  }, [mostrarForm]);

  const handleSubmit = async () => {
    setLoading(true);
    setMensaje('');
    try {
      const res = await fetch('/api/clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          plan_duracion: parseInt(form.plan_duracion),
          costo_servicio: parseFloat(form.costo_servicio)
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMensaje('✅ Cliente agregado');
      setRefresh(r => r + 1);
      setTimeout(() => { setMostrarForm(false); setMensaje(''); }, 1500);
    } catch (err: any) {
      setMensaje('❌ ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEnviarEmail = async (cliente: any, tipo: string) => {
    const key = `${cliente.id}-${tipo}`;
    await fetch('/api/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tipo, cliente })
    });
    setEmailEnviado(prev => [...prev, key]);
    alert('✅ Email enviado');
  };

  const handleGuardarEdicion = async () => {
    try {
      const res = await fetch(`/api/clientes/${clienteSeleccionado.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      if (!res.ok) throw new Error('Error al guardar');
      const actualizado = await res.json();
      setClienteSeleccionado(actualizado);
      setEditando(false);
      setRefresh(r => r + 1);
      alert('✅ Actualizado correctamente');
    } catch (err: any) {
      alert('❌ ' + err.message);
    }
  };

  const handleEliminar = async () => {
    if (!confirm(`¿Eliminar a ${clienteSeleccionado.nombre_cliente}? Esta acción no se puede deshacer.`)) return;
    try {
      const res = await fetch(`/api/clientes/${clienteSeleccionado.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Error al eliminar');
      setClienteSeleccionado(null);
      setRefresh(r => r + 1);
      alert('✅ Cliente eliminado');
    } catch (err: any) {
      alert('❌ ' + err.message);
    }
  };

  const handleCambiarEstado = async (nuevoEstado: string) => {
    try {
      const res = await fetch(`/api/clientes/${clienteSeleccionado.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...editForm, estado: nuevoEstado })
      });
      if (!res.ok) throw new Error('Error');
      const actualizado = await res.json();
      setClienteSeleccionado(actualizado);
      setRefresh(r => r + 1);
      alert(`✅ Cliente marcado como ${nuevoEstado}`);
    } catch (err: any) {
      alert('❌ ' + err.message);
    }
  };

  const esInactivo = clienteSeleccionado?.estado === 'INACTIVO' || clienteSeleccionado?.estado === 'CANCELADO';

  return (
    <main className="min-h-screen" style={{ background: 'var(--background)' }}>
      {/* HEADER */}
      <div className="border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ background: 'var(--brand)' }}
            >
              <span className="font-serif text-lg font-semibold" style={{ color: 'var(--accent)' }}>A</span>
            </div>
            <div>
              <div className="dv-eyebrow mb-0.5">Módulo · Adobe</div>
              <h1 className="font-serif text-[22px] font-semibold leading-tight" style={{ color: 'var(--text-primary)' }}>
                Adobe Manager
              </h1>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                Gestión de cuentas Creative Cloud · <a href="/servicios" className="hover:underline font-medium" style={{ color: 'var(--accent-hover)' }}>Ir a Centro de Servicios →</a>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setMostrarGmail(!mostrarGmail)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-sm rounded-lg transition-colors border"
              style={{ color: 'var(--text-secondary)', borderColor: 'var(--border)' }}>
              <span style={{ color: 'var(--accent)' }}>✉</span> Gmail
            </button>
            <button onClick={() => setMostrarForm(!mostrarForm)}
              className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg transition-colors font-medium text-white"
              style={{ background: 'var(--brand)' }}>
              {mostrarForm ? '✕ Cerrar' : '+ Nuevo cliente'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* PANEL GMAIL GLOBAL */}
        {mostrarGmail && (
          <div className="mb-6 dv-card overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
              <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                <span className="dv-eyebrow mr-2">Gmail</span> Códigos de Activación
              </span>
              <button onClick={() => setMostrarGmail(false)} className="text-sm" style={{ color: 'var(--text-muted)' }}>✕ Cerrar</button>
            </div>
            <iframe src="https://mail.google.com" className="w-full" style={{ height: '480px', border: 'none' }} title="Gmail" />
          </div>
        )}

        {/* FORMULARIO */}
        {mostrarForm && (
          <div className="dv-modal-backdrop" onClick={e => { if (e.target === e.currentTarget) setMostrarForm(false); }}>
            <div className="dv-modal max-w-lg max-h-[90vh] overflow-y-auto p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-serif text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Nuevo cliente</h2>
                <span
                  className="font-mono text-sm font-bold px-3 py-1 rounded-lg"
                  style={{ background: 'var(--accent-soft)', color: 'var(--accent-hover)' }}
                >
                  {form.numero_pedido || '...'}
                </span>
              </div>
              {mensaje && (
                <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: 'var(--surface-muted)', color: 'var(--text-secondary)' }}>
                  {mensaje}
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { key: 'nombre_cliente', label: 'Nombre completo', type: 'text' },
                  { key: 'email_cliente', label: 'Email del cliente', type: 'email' },
                  { key: 'telefono', label: 'WhatsApp', type: 'tel' },
                  { key: 'email_adobe', label: 'Email Adobe', type: 'email' },
                  { key: 'contraseña_adobe', label: 'Contraseña Adobe', type: 'password' },
                ].map(({ key, label, type }) => (
                  <div key={key}>
                    <label className="dv-label">{label}</label>
                    <input type={type} value={(form as any)[key]}
                      onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                      className="dv-input" />
                  </div>
                ))}
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Plan</label>
                  <select value={form.plan_duracion}
                    onChange={e => {
                      const plan = e.target.value;
                      setForm(f => ({ ...f, plan_duracion: plan, costo_servicio: planCosto[plan] }));
                    }}
                    className="w-full rounded-lg px-3 py-2 text-sm border focus:outline-none focus:ring-2"
                    style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
                    <option value="1">1 Mes — S/. 44.90</option>
                    <option value="3">3 Meses — S/. 124.90</option>
                    <option value="6">6 Meses — S/. 199.90</option>
                    <option value="12">12 Meses — S/. 289.90</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Costo S/.</label>
                  <input type="number" value={form.costo_servicio}
                    onChange={e => setForm(f => ({ ...f, costo_servicio: e.target.value }))}
                    className="w-full rounded-lg px-3 py-2 text-sm border focus:outline-none focus:ring-2"
                    style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }} />
                </div>
              </div>
              <button onClick={handleSubmit} disabled={loading}
                className="mt-5 w-full py-2.5 text-sm rounded-lg transition-colors font-medium text-white disabled:opacity-50"
                style={{ background: 'var(--brand)' }}>
                {loading ? 'Guardando...' : 'Guardar cliente'}
              </button>
            </div>
          </div>
        )}

        <Metricas refresh={refresh} />
        <TablaClientes refresh={refresh} onSeleccionar={(c) => {
          setClienteSeleccionado(c);
          setEditForm({
            contraseña_adobe: '',
            fecha_renovacion_proxima: c.fecha_renovacion_proxima,
            costo_servicio: c.costo_servicio,
            plan_duracion: c.plan_duracion,
            estado: c.estado,
          });
          setEditando(false);
          setMostrarFactura(false);
          setMostrarGmailCliente(false);
          setMostrarAdobeCliente(false);
        }} />
      </div>

      {/* PANEL FLOTANTE CLIENTE */}
      {clienteSeleccionado && !mostrarFactura && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-end dv-animate-in"
          onClick={() => { setClienteSeleccionado(null); setEditando(false); setMostrarGmailCliente(false); setMostrarAdobeCliente(false); }}>
          <div className="h-full w-full max-w-md shadow-2xl overflow-y-auto dv-animate-panel"
            onClick={e => e.stopPropagation()}>

            {/* Header panel */}
            <div className="sticky top-0 border-b px-6 py-4 flex items-center justify-between z-10"
              style={{ borderColor: 'var(--border)' }}>
              <div>
                <div className="dv-eyebrow mb-0.5">Cliente</div>
                <h2 className="font-serif text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {clienteSeleccionado.nombre_cliente}
                </h2>
                <p className="text-xs font-mono mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  {clienteSeleccionado.numero_pedido}
                </p>
              </div>
              <button onClick={() => { setClienteSeleccionado(null); setEditando(false); }}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--surface)]/[0.06]"
                style={{ color: 'var(--text-muted)' }}>✕</button>
            </div>

            <div className="p-6">
              {/* TABS */}
              <div className="flex gap-1 mb-6 rounded-lg p-1" style={{ background: 'var(--surface-muted)' }}>
                <button onClick={() => setEditando(false)}
                  className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-all ${
                    !editando ? 'bg-[var(--surface)] shadow-sm' : ''
                  }`}
                  style={{ color: !editando ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                  Info
                </button>
                <button onClick={() => setEditando(true)}
                  className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-all ${
                    editando ? 'bg-[var(--surface)] shadow-sm' : ''
                  }`}
                  style={{ color: editando ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                  Editar
                </button>
              </div>

              {!editando ? (
                <div className="space-y-3">
                  {/* Acceso rápido Adobe + Gmail */}
                  <div className="mb-4">
                    <button
                      onClick={() => window.open('https://account.adobe.com', '_blank')}
                      className="w-full flex items-center justify-center gap-2 py-2.5 border rounded-lg text-xs font-medium transition-colors mb-2"
                      style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                      Abrir Adobe (cambiar contraseña) →
                    </button>
                    <GmailReader emailAdobe={clienteSeleccionado.email_adobe} />
                  </div>

                  {/* Info cards */}
                  {[
                    { label: 'Email cliente', value: clienteSeleccionado.email_cliente, copy: true },
                    { label: 'Email Adobe', value: clienteSeleccionado.email_adobe, copy: true, highlight: true },
                  ].map(item => (
                    <div key={item.label} className="rounded-lg p-3.5"
                      style={{
                        background: item.highlight ? 'var(--accent-soft)' : 'var(--surface-muted)',
                        border: item.highlight ? '1px solid var(--accent)' : '1px solid var(--border)',
                      }}>
                      <p className="dv-eyebrow mb-1">{item.label}</p>
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium" style={{ color: item.highlight ? 'var(--accent-hover)' : 'var(--text-primary)' }}>
                          {item.value}
                        </p>
                        {item.copy && (
                          <button onClick={() => navigator.clipboard.writeText(item.value)}
                            className="text-xs ml-2 hover:underline"
                            style={{ color: 'var(--accent-hover)' }}>
                            Copiar
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  <div className="rounded-lg p-3.5" style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)' }}>
                    <p className="dv-eyebrow mb-1">WhatsApp</p>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{clienteSeleccionado.telefono}</p>
                      <a href={`https://wa.me/${clienteSeleccionado.telefono?.replace(/\+/g,'')}`} target="_blank"
                        className="text-xs hover:underline" style={{ color: 'var(--success)' }}>Abrir →</a>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-lg p-3.5" style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)' }}>
                      <p className="dv-eyebrow mb-1">Plan</p>
                      <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                        {clienteSeleccionado.plan_duracion === 12 ? '12 meses' : `${clienteSeleccionado.plan_duracion} mes`}
                      </p>
                    </div>
                    <div className="rounded-lg p-3.5" style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)' }}>
                      <p className="dv-eyebrow mb-1">Costo</p>
                      <p className="text-sm font-semibold" style={{ color: 'var(--success)' }}>
                        S/. {Number(clienteSeleccionado.costo_servicio).toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-lg p-3.5" style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)' }}>
                    <p className="dv-eyebrow mb-1">Vencimiento</p>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      {new Date(clienteSeleccionado.fecha_renovacion_proxima).toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>

                  {/* Acciones email */}
                  <div className="space-y-2 pt-2">
                    <button onClick={() => handleEnviarEmail(clienteSeleccionado, 'nuevo')}
                      disabled={emailEnviado.includes(`${clienteSeleccionado.id}-nuevo`)}
                      className="w-full py-2.5 border rounded-lg text-xs font-medium disabled:opacity-40 transition-colors"
                      style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                      {emailEnviado.includes(`${clienteSeleccionado.id}-nuevo`) ? '✓ Bienvenida enviada' : 'Enviar email de bienvenida'}
                    </button>
                    <button onClick={() => handleEnviarEmail(clienteSeleccionado, 'renovacion')}
                      disabled={emailEnviado.includes(`${clienteSeleccionado.id}-renovacion`)}
                      className="w-full py-2.5 border rounded-lg text-xs font-medium disabled:opacity-40 transition-colors"
                      style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                      {emailEnviado.includes(`${clienteSeleccionado.id}-renovacion`) ? '✓ Recordatorio enviado' : 'Enviar recordatorio de pago'}
                    </button>
                    {esInactivo && (
                      <button onClick={() => handleEnviarEmail(clienteSeleccionado, 'reactivacion')}
                        className="w-full py-2.5 rounded-lg text-xs font-medium transition-colors"
                        style={{ background: 'var(--accent-soft)', color: 'var(--accent-hover)', border: '1px solid var(--accent)' }}>
                        Enviar promoción de reactivación
                      </button>
                    )}
                    <button onClick={() => setMostrarFactura(true)}
                      className="w-full py-2.5 rounded-lg text-xs font-medium transition-colors text-white"
                      style={{ background: 'var(--brand)' }}>
                      Generar comprobante de pago
                    </button>
                  </div>

                  {/* Estado + Eliminar */}
                  <div className="pt-4 border-t space-y-2" style={{ borderColor: 'var(--border)' }}>
                    {!esInactivo ? (
                      <button onClick={() => handleCambiarEstado('INACTIVO')}
                        className="w-full py-2 text-xs rounded-lg transition-colors border"
                        style={{ color: 'var(--warning)', borderColor: 'var(--warning-soft)' }}>
                        Marcar como inactivo
                      </button>
                    ) : (
                      <button onClick={() => handleCambiarEstado('ACTIVO')}
                        className="w-full py-2 text-xs rounded-lg transition-colors border"
                        style={{ color: 'var(--success)', borderColor: 'var(--success-soft)' }}>
                        Reactivar cliente
                      </button>
                    )}
                    <button onClick={handleEliminar}
                      className="w-full py-2 text-xs rounded-lg transition-colors border"
                      style={{ color: 'var(--danger)', borderColor: 'var(--danger-soft)' }}>
                      Eliminar cliente permanentemente
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Nueva contraseña Adobe</label>
                    <input type="text" value={editForm.contraseña_adobe}
                      onChange={e => setEditForm((f: any) => ({ ...f, contraseña_adobe: e.target.value }))}
                      placeholder="Dejar vacío para no cambiar"
                      className="w-full rounded-lg px-3 py-2 text-sm border focus:outline-none focus:ring-2"
                      style={{ borderColor: 'var(--border)' }} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Fecha de vencimiento</label>
                    <input type="date" value={editForm.fecha_renovacion_proxima}
                      onChange={e => setEditForm((f: any) => ({ ...f, fecha_renovacion_proxima: e.target.value }))}
                      className="w-full rounded-lg px-3 py-2 text-sm border focus:outline-none focus:ring-2"
                      style={{ borderColor: 'var(--border)' }} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Costo S/.</label>
                    <input type="number" value={editForm.costo_servicio}
                      onChange={e => setEditForm((f: any) => ({ ...f, costo_servicio: e.target.value }))}
                      className="w-full rounded-lg px-3 py-2 text-sm border focus:outline-none focus:ring-2"
                      style={{ borderColor: 'var(--border)' }} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Plan</label>
                    <select value={editForm.plan_duracion}
                      onChange={e => setEditForm((f: any) => ({ ...f, plan_duracion: parseInt(e.target.value) }))}
                      className="w-full rounded-lg px-3 py-2 text-sm border focus:outline-none focus:ring-2"
                      style={{ borderColor: 'var(--border)' }}>
                      <option value="1">1 Mes</option>
                      <option value="3">3 Meses</option>
                      <option value="6">6 Meses</option>
                      <option value="12">12 Meses</option>
                    </select>
                  </div>
                  <button onClick={handleGuardarEdicion}
                    className="w-full py-2.5 text-sm rounded-lg transition-colors font-medium text-white"
                    style={{ background: 'var(--brand)' }}>
                    Guardar cambios
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* FACTURA */}
      {mostrarFactura && clienteSeleccionado && (
        <Factura cliente={clienteSeleccionado} onClose={() => setMostrarFactura(false)} />
      )}
    </main>
  );
}
'use client';
import { useState, useEffect } from 'react';
import TablaClientes from './TablaClientes';
import Metricas from './Metricas';
import Factura from './Factura';
import GmailReader from './GmailReader';

export default function Home() {
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
    <main className="min-h-screen bg-gray-50">
      {/* HEADER */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm">A</span>
            </div>
            <div>
              <h1 className="text-base font-semibold text-gray-900">Adobe Manager</h1>
              <p className="text-xs text-gray-400">Gestión de cuentas Creative Cloud</p>
              <a href="/servicios" className="text-xs text-blue-500 hover:text-blue-700 font-medium">→ Centro de Servicios</a>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setMostrarGmail(!mostrarGmail)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              📬 Gmail
            </button>
            <button onClick={() => setMostrarForm(!mostrarForm)}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors font-medium">
              {mostrarForm ? '✕ Cerrar' : '+ Nuevo cliente'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* PANEL GMAIL GLOBAL */}
        {mostrarGmail && (
          <div className="mb-6 bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <span className="text-sm font-medium text-gray-700">📬 Gmail — Códigos de Activación</span>
              <button onClick={() => setMostrarGmail(false)} className="text-gray-400 hover:text-gray-600 text-sm">✕ Cerrar</button>
            </div>
            <iframe src="https://mail.google.com" className="w-full" style={{ height: '480px', border: 'none' }} title="Gmail" />
          </div>
        )}

        {/* FORMULARIO */}
        {mostrarForm && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) setMostrarForm(false); }}><div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-gray-900">Nuevo cliente</h2>
              <span className="font-mono text-sm font-bold text-blue-500 bg-blue-50 px-3 py-1 rounded-lg">
                {form.numero_pedido || '...'}
              </span>
            </div>
            {mensaje && <div className="mb-4 p-3 rounded-lg bg-gray-50 text-sm text-gray-600">{mensaje}</div>}
            <div className="grid grid-cols-2 gap-4">
              {[
                { key: 'nombre_cliente', label: 'Nombre completo', type: 'text' },
                { key: 'email_cliente', label: 'Email del cliente', type: 'email' },
                { key: 'telefono', label: 'WhatsApp', type: 'tel' },
                { key: 'email_adobe', label: 'Email Adobe', type: 'email' },
                { key: 'contraseña_adobe', label: 'Contraseña Adobe', type: 'password' },
              ].map(({ key, label, type }) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">{label}</label>
                  <input type={type} value={(form as any)[key]}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent" />
                </div>
              ))}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Plan</label>
                <select value={form.plan_duracion}
                  onChange={e => {
                    const plan = e.target.value;
                    setForm(f => ({ ...f, plan_duracion: plan, costo_servicio: planCosto[plan] }));
                  }}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900">
                  <option value="1">1 Mes — S/. 44.90</option>
                  <option value="3">3 Meses — S/. 124.90</option>
                  <option value="6">6 Meses — S/. 199.90</option>
                  <option value="12">12 Meses — S/. 289.90</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Costo S/.</label>
                <input type="number" value={form.costo_servicio}
                  onChange={e => setForm(f => ({ ...f, costo_servicio: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900" />
              </div>
            </div>
            <button onClick={handleSubmit} disabled={loading}
              className="mt-5 w-full py-2.5 bg-gray-900 text-white text-sm rounded-xl hover:bg-gray-700 disabled:bg-gray-200 transition-colors font-medium">
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
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-end"
          onClick={() => { setClienteSeleccionado(null); setEditando(false); setMostrarGmailCliente(false); setMostrarAdobeCliente(false); }}>
          <div className="bg-white h-full w-full max-w-md shadow-2xl overflow-y-auto"
            onClick={e => e.stopPropagation()}>

            {/* Header panel */}
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
              <div>
                <h2 className="text-base font-semibold text-gray-900">{clienteSeleccionado.nombre_cliente}</h2>
                <p className="text-xs text-gray-400 font-mono">{clienteSeleccionado.numero_pedido}</p>
              </div>
              <button onClick={() => { setClienteSeleccionado(null); setEditando(false); }}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400">✕</button>
            </div>

            <div className="p-6">
              {/* TABS */}
              <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1">
                <button onClick={() => setEditando(false)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${!editando ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
                  Info
                </button>
                <button onClick={() => setEditando(true)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${editando ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
                  Editar
                </button>
              </div>

              {!editando ? (
                <div className="space-y-3">
                  {/* Acceso rápido Adobe + Gmail */}
                  <div className="mb-4">
                    <button
                      onClick={() => window.open('https://account.adobe.com', '_blank')}
                      className="w-full flex items-center justify-center gap-2 py-2.5 border border-gray-200 rounded-xl text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors mb-2">
                      🎨 Abrir Adobe (cambiar contraseña)
                    </button>
                    <GmailReader emailAdobe={clienteSeleccionado.email_adobe} />
                  </div>

                  {/* Info cards */}
                  {[
                    { label: 'Email cliente', value: clienteSeleccionado.email_cliente, copy: true },
                    { label: 'Email Adobe', value: clienteSeleccionado.email_adobe, copy: true, highlight: true },
                  ].map(item => (
                    <div key={item.label} className={`rounded-xl p-3.5 ${item.highlight ? 'bg-blue-50 border border-blue-100' : 'bg-gray-50'}`}>
                      <p className="text-xs text-gray-400 mb-1">{item.label}</p>
                      <div className="flex items-center justify-between">
                        <p className={`text-sm font-medium ${item.highlight ? 'text-blue-700' : 'text-gray-900'}`}>{item.value}</p>
                        {item.copy && (
                          <button onClick={() => navigator.clipboard.writeText(item.value)}
                            className="text-xs text-blue-500 hover:text-blue-700 ml-2">Copiar</button>
                        )}
                      </div>
                    </div>
                  ))}

                  <div className="rounded-xl p-3.5 bg-gray-50">
                    <p className="text-xs text-gray-400 mb-1">WhatsApp</p>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900">{clienteSeleccionado.telefono}</p>
                      <a href={`https://wa.me/${clienteSeleccionado.telefono?.replace(/\+/g,'')}`} target="_blank"
                        className="text-xs text-green-600 hover:text-green-700">Abrir →</a>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-xl p-3.5 bg-gray-50">
                      <p className="text-xs text-gray-400 mb-1">Plan</p>
                      <p className="text-sm font-medium text-gray-900">{clienteSeleccionado.plan_duracion === 12 ? '12 meses' : `${clienteSeleccionado.plan_duracion} mes`}</p>
                    </div>
                    <div className="rounded-xl p-3.5 bg-gray-50">
                      <p className="text-xs text-gray-400 mb-1">Costo</p>
                      <p className="text-sm font-semibold text-green-600">S/. {Number(clienteSeleccionado.costo_servicio).toFixed(2)}</p>
                    </div>
                  </div>

                  <div className="rounded-xl p-3.5 bg-gray-50">
                    <p className="text-xs text-gray-400 mb-1">Vencimiento</p>
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(clienteSeleccionado.fecha_renovacion_proxima).toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>

                  {/* Acciones email */}
                  <div className="space-y-2 pt-2">
                    <button onClick={() => handleEnviarEmail(clienteSeleccionado, 'nuevo')}
                      disabled={emailEnviado.includes(`${clienteSeleccionado.id}-nuevo`)}
                      className="w-full py-2.5 border border-gray-200 rounded-xl text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 transition-colors">
                      {emailEnviado.includes(`${clienteSeleccionado.id}-nuevo`) ? '✅ Bienvenida enviada' : '📧 Enviar email de bienvenida'}
                    </button>
                    <button onClick={() => handleEnviarEmail(clienteSeleccionado, 'renovacion')}
                      disabled={emailEnviado.includes(`${clienteSeleccionado.id}-renovacion`)}
                      className="w-full py-2.5 border border-gray-200 rounded-xl text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 transition-colors">
                      {emailEnviado.includes(`${clienteSeleccionado.id}-renovacion`) ? '✅ Recordatorio enviado' : '🔔 Enviar recordatorio de pago'}
                    </button>
                    {esInactivo && (
                      <button onClick={() => handleEnviarEmail(clienteSeleccionado, 'reactivacion')}
                        className="w-full py-2.5 border border-blue-200 bg-blue-50 rounded-xl text-xs font-medium text-blue-700 hover:bg-blue-100 transition-colors">
                        🎯 Enviar promoción de reactivación
                      </button>
                    )}
                    <button onClick={() => setMostrarFactura(true)}
                      className="w-full py-2.5 bg-gray-900 text-white rounded-xl text-xs font-medium hover:bg-gray-700 transition-colors">
                      🧾 Generar comprobante de pago
                    </button>
                  </div>

                  {/* Estado + Eliminar */}
                  <div className="pt-4 border-t border-gray-100 space-y-2">
                    {!esInactivo ? (
                      <button onClick={() => handleCambiarEstado('INACTIVO')}
                        className="w-full py-2 text-xs text-orange-600 hover:bg-orange-50 rounded-xl transition-colors border border-orange-100">
                        Marcar como inactivo
                      </button>
                    ) : (
                      <button onClick={() => handleCambiarEstado('ACTIVO')}
                        className="w-full py-2 text-xs text-green-600 hover:bg-green-50 rounded-xl transition-colors border border-green-100">
                        Reactivar cliente
                      </button>
                    )}
                    <button onClick={handleEliminar}
                      className="w-full py-2 text-xs text-red-500 hover:bg-red-50 rounded-xl transition-colors border border-red-100">
                      Eliminar cliente permanentemente
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">Nueva contraseña Adobe</label>
                    <input type="text" value={editForm.contraseña_adobe}
                      onChange={e => setEditForm((f: any) => ({ ...f, contraseña_adobe: e.target.value }))}
                      placeholder="Dejar vacío para no cambiar"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">Fecha de vencimiento</label>
                    <input type="date" value={editForm.fecha_renovacion_proxima}
                      onChange={e => setEditForm((f: any) => ({ ...f, fecha_renovacion_proxima: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">Costo S/.</label>
                    <input type="number" value={editForm.costo_servicio}
                      onChange={e => setEditForm((f: any) => ({ ...f, costo_servicio: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">Plan</label>
                    <select value={editForm.plan_duracion}
                      onChange={e => setEditForm((f: any) => ({ ...f, plan_duracion: parseInt(e.target.value) }))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900">
                      <option value="1">1 Mes</option>
                      <option value="3">3 Meses</option>
                      <option value="6">6 Meses</option>
                      <option value="12">12 Meses</option>
                    </select>
                  </div>
                  <button onClick={handleGuardarEdicion}
                    className="w-full py-2.5 bg-gray-900 text-white text-sm rounded-xl hover:bg-gray-700 transition-colors font-medium">
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
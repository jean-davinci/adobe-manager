'use client';
import { useState } from 'react';

export default function Factura({ cliente, onClose }: { cliente: any; onClose: () => void }) {
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const numeroFactura = `FAC-${cliente.numero_pedido}-${Date.now().toString().slice(-4)}`;
  const fechaEmision = new Date().toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' });
  const fechaVence = new Date(cliente.fecha_renovacion_proxima).toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' });

  const handleDescargar = async () => {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF();

    // Header
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('ADOBE MANAGER', 20, 18);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Gestion de cuentas Adobe Creative Cloud - Peru', 20, 28);
    doc.text(`N deg Factura: ${numeroFactura}`, 20, 36);

    // Info cliente
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('COMPROBANTE DE PAGO', 20, 58);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Cliente: ${cliente.nombre_cliente}`, 20, 72);
    doc.text(`Email: ${cliente.email_cliente}`, 20, 80);
    doc.text(`Telefono: ${cliente.telefono}`, 20, 88);
    doc.text(`Fecha de emision: ${fechaEmision}`, 20, 96);

    // Tabla servicio
    doc.setFillColor(241, 245, 249);
    doc.rect(15, 108, 180, 10, 'F');
    doc.setFont('helvetica', 'bold');
    doc.text('DESCRIPCION', 20, 116);
    doc.text('PLAN', 110, 116);
    doc.text('TOTAL', 170, 116);

    doc.setFont('helvetica', 'normal');
    doc.text('Adobe Creative Cloud', 20, 130);
    doc.text(`${cliente.plan_duracion} mes(es)`, 110, 130);
    doc.text(`S/. ${Number(cliente.costo_servicio).toFixed(2)}`, 170, 130);

    doc.text(`Periodo: hasta ${fechaVence}`, 20, 140);

    // Total
    doc.setFillColor(15, 23, 42);
    doc.rect(130, 150, 65, 18, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('TOTAL:', 135, 161);
    doc.text(`S/. ${Number(cliente.costo_servicio).toFixed(2)}`, 162, 161);

    // Footer
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Gracias por tu preferencia - Adobe Manager Peru', 20, 280);
    doc.text(`Comprobante generado el ${fechaEmision}`, 20, 286);

    doc.save(`Factura-${cliente.nombre_cliente}-${numeroFactura}.pdf`);
  };

  const handleEnviarPorEmail = async () => {
    setEnviando(true);
    try {
      await fetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: 'factura',
          cliente,
          numeroFactura,
          fechaEmision,
          fechaVence,
        })
      });
      setEnviado(true);
    } catch (err) {
      alert('Error al enviar email');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}>
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md shadow-2xl"
        onClick={e => e.stopPropagation()}>

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">🧾 Comprobante de Pago</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl">✕</button>
        </div>

        {/* Preview */}
        <div className="bg-gray-800 rounded-xl p-4 mb-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">N° Comprobante:</span>
            <span className="font-mono text-blue-400">{numeroFactura}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Cliente:</span>
            <span className="text-white">{cliente.nombre_cliente}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Email:</span>
            <span className="text-white text-xs">{cliente.email_cliente}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Plan:</span>
            <span className="text-white">{cliente.plan_duracion} mes(es)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Válido hasta:</span>
            <span className="text-white">{fechaVence}</span>
          </div>
          <hr className="border-gray-600" />
          <div className="flex justify-between font-bold text-base">
            <span className="text-gray-300">TOTAL:</span>
            <span className="text-green-400">S/. {Number(cliente.costo_servicio).toFixed(2)}</span>
          </div>
        </div>

        <div className="space-y-3">
          <button onClick={handleDescargar}
            className="w-full py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-semibold transition-colors">
            📥 Descargar PDF
          </button>
          <button onClick={handleEnviarPorEmail} disabled={enviando || enviado}
            className="w-full py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded-lg text-sm font-semibold transition-colors">
            {enviado ? '✅ Enviado al cliente' : enviando ? 'Enviando...' : '📧 Enviar PDF al cliente por email'}
          </button>
        </div>
      </div>
    </div>
  );
}

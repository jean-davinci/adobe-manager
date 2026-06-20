import { requireRole } from '@/lib/dal';
import { getServiceStatus, getServiceQr, getWhatsappMode } from '@/lib/whatsapp';
import WaSetupClient from './WaSetupClient';

export const dynamic = 'force-dynamic';

export default async function WhatsAppSetupPage() {
  await requireRole('ADMIN');

  const modo = getWhatsappMode();
  const status = await getServiceStatus();
  const qr = status?.hasQr ? await getServiceQr() : null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <p className="text-xs uppercase tracking-wider font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>
          Configuración
        </p>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>
          WhatsApp
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          Vincula el número de WhatsApp para recibir y enviar mensajes desde el CRM.
        </p>
      </div>

      {/* Modo activo */}
      <div
        className="flex items-center gap-3 p-4 rounded-2xl"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg"
          style={{
            background: modo === 'service' ? 'rgba(34,197,94,0.1)'
              : modo === 'meta' ? 'rgba(26,43,74,0.1)'
              : 'var(--warning-soft)',
          }}
        >
          {modo === 'service' ? '📱' : modo === 'meta' ? '☁️' : '🧪'}
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
            {modo === 'service' ? 'Microservicio whatsapp-web.js'
              : modo === 'meta' ? 'Meta WhatsApp Business Cloud API'
              : 'Modo mock (desarrollo)'}
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {modo === 'service'
              ? `WA_SERVICE_URL configurado`
              : modo === 'meta'
              ? 'WHATSAPP_TOKEN y WHATSAPP_PHONE_NUMBER_ID configurados'
              : 'Configura WA_SERVICE_URL o WHATSAPP_TOKEN en las variables de entorno'}
          </p>
        </div>
        <span
          className="text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0"
          style={{
            background: modo === 'mock' ? 'var(--warning-soft)' : 'var(--success-soft)',
            color: modo === 'mock' ? 'var(--warning)' : 'var(--success)',
          }}
        >
          {modo === 'mock' ? 'Sin configurar' : 'Activo'}
        </span>
      </div>

      {/* Panel del microservicio */}
      {modo === 'service' && status !== null && (
        <WaSetupClient statusInicial={status} qrInicial={qr} />
      )}

      {/* Instrucciones de configuración */}
      {modo === 'mock' && (
        <div
          className="rounded-2xl p-5 space-y-4"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
            Cómo configurar el microservicio
          </h2>
          <ol className="space-y-3 text-sm" style={{ color: 'var(--text-muted)' }}>
            <li className="flex gap-2">
              <span className="font-bold flex-shrink-0" style={{ color: 'var(--brand)' }}>1.</span>
              Despliega la carpeta <code className="px-1.5 py-0.5 rounded text-xs" style={{ background: 'var(--surface-2)' }}>whatsapp-service/</code> en Railway o un VPS con Docker.
            </li>
            <li className="flex gap-2">
              <span className="font-bold flex-shrink-0" style={{ color: 'var(--brand)' }}>2.</span>
              Genera un secret seguro:
              <code className="px-1.5 py-0.5 rounded text-xs" style={{ background: 'var(--surface-2)' }}>
                node -e &quot;console.log(require(&apos;crypto&apos;).randomBytes(32).toString(&apos;hex&apos;))&quot;
              </code>
            </li>
            <li className="flex gap-2">
              <span className="font-bold flex-shrink-0" style={{ color: 'var(--brand)' }}>3.</span>
              Añade estas variables de entorno en el microservicio y en Vercel:
            </li>
          </ol>
          <div
            className="rounded-xl p-4 font-mono text-xs space-y-1"
            style={{ background: 'var(--surface-2)', color: 'var(--text)' }}
          >
            <p><span style={{ color: 'var(--text-muted)' }}># Microservicio (Railway)</span></p>
            <p>WA_SERVICE_SECRET=<span style={{ color: 'var(--warning)' }}>tu-secret-aqui</span></p>
            <p>CRM_WEBHOOK_URL=<span style={{ color: 'var(--warning)' }}>https://tu-app.vercel.app/api/webhooks/whatsapp</span></p>
            <p className="pt-2"><span style={{ color: 'var(--text-muted)' }}># CRM (Vercel)</span></p>
            <p>WA_SERVICE_URL=<span style={{ color: 'var(--warning)' }}>https://tu-servicio.railway.app</span></p>
            <p>WA_SERVICE_SECRET=<span style={{ color: 'var(--warning)' }}>el-mismo-secret</span></p>
          </div>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Una vez desplegado, vuelve aquí para escanear el QR con tu teléfono.
          </p>
        </div>
      )}
    </div>
  );
}

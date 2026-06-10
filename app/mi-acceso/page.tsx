import { requireRole } from '@/lib/dal';
import { getCurrentUser } from '@/lib/dal';
import { getClientePorEmail } from '@/lib/clientes';
import { listarDocumentos } from '@/lib/documentos';
import LogoutButton from '@/app/components/LogoutButton';
import CodigoAcceso from './CodigoAcceso';

export const metadata = { title: 'Mi acceso — Davinci Labs' };

const ESTADO_DOC: Record<string, { label: string; color: string }> = {
  RECIBIDO: { label: 'Recibido', color: 'bg-yellow-100 text-yellow-700' },
  EN_PROCESO: { label: 'En proceso', color: 'bg-blue-100 text-blue-700' },
  COMPLETADO: { label: 'Completado', color: 'bg-green-100 text-green-700' },
};

export default async function MiAccesoPage() {
  const session = await requireRole('CLIENT');
  const user = await getCurrentUser();
  const email = user?.email ?? '';

  const [acceso, documentos] = await Promise.all([
    getClientePorEmail(email),
    listarDocumentos({ email }),
  ]);

  const venc = acceso?.fecha_renovacion_proxima
    ? new Date(acceso.fecha_renovacion_proxima).toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' })
    : null;
  const activo = acceso?.estado === 'ACTIVO';

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-base font-semibold text-gray-900">Mi acceso</h1>
            <p className="text-xs text-gray-400">Hola, {session.nombre}</p>
          </div>
          <LogoutButton />
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
        {/* Código de acceso Adobe */}
        <section>
          <h2 className="text-sm font-semibold text-gray-900 mb-3">🎨 Tu acceso Adobe Creative Cloud</h2>
          {acceso ? (
            <div className={`rounded-2xl border p-5 ${activo ? 'bg-white border-gray-100' : 'bg-red-50 border-red-100'}`}>
              <div className="flex items-center justify-between mb-4">
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {activo ? '● Activo' : '● ' + acceso.estado}
                </span>
                {venc && <span className="text-xs text-gray-400">Vence: {venc}</span>}
              </div>
              <CodigoAcceso
                email={acceso.email_adobe ?? ''}
                password={acceso['contraseña_adobe_encriptada'] ?? ''}
              />
              <p className="text-xs text-gray-400 mt-3">
                Ingresa en <a href="https://account.adobe.com" target="_blank" className="text-blue-500 hover:underline">account.adobe.com</a> con estas credenciales.
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-gray-100 bg-white p-5 text-sm text-gray-500">
              No tienes una suscripción Adobe activa registrada con {email}.
            </div>
          )}
        </section>

        {/* Documentos */}
        <section>
          <h2 className="text-sm font-semibold text-gray-900 mb-3">📄 Mis documentos</h2>
          {documentos.length === 0 ? (
            <div className="rounded-2xl border border-gray-100 bg-white p-5 text-sm text-gray-500">
              Aún no tienes documentos enviados.
            </div>
          ) : (
            <div className="space-y-2">
              {documentos.map((d) => {
                const e = ESTADO_DOC[d.estado] ?? ESTADO_DOC.RECIBIDO;
                return (
                  <div key={d.id} className="rounded-2xl border border-gray-100 bg-white p-4 flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{d.nombre_archivo}</p>
                      <p className="text-xs text-gray-400">{d.tipo_servicio} · {new Date(d.created_at).toLocaleDateString('es-PE')}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${e.color}`}>{e.label}</span>
                      {d.reporte_ia_url && (
                        <a href={d.reporte_ia_url} target="_blank" className="text-xs text-purple-600 hover:underline font-medium">🤖 IA ↗</a>
                      )}
                      {d.reporte_similitud_url && (
                        <a href={d.reporte_similitud_url} target="_blank" className="text-xs text-blue-600 hover:underline font-medium">📊 Similitud ↗</a>
                      )}
                      {d.url_informe && (
                        <a href={d.url_informe} target="_blank"
                          className="text-xs text-green-600 hover:underline font-medium">Ver informe ↗</a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

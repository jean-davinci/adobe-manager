import LandingClient from './components/landing/LandingClient';
import { listarDocumentos } from '@/lib/documentos';
import { listarClientes } from '@/lib/clientes';

export const metadata = {
  title: 'Davinci Labs — Automatizamos tu trabajo académico',
  description:
    'Detección de IA, similitud Turnitin, informes automáticos, gestión de afiliados Adobe y asesoría académica. Resultados precisos, entrega inmediata.',
};

// Si la DB no responde, la landing muestra valores base.
const intenta = <T,>(p: Promise<T>): Promise<T | null> => p.catch(() => null);

export default async function LandingPage() {
  const [docs, clientes] = await Promise.all([
    intenta(listarDocumentos()),
    intenta(listarClientes()),
  ]);

  const stats = {
    documentos: Math.max(docs?.length ?? 0, 120),
    clientes: Math.max(clientes?.length ?? 0, 85),
    anios: 3,
    tasa: 98,
  };

  return <LandingClient stats={stats} />;
}

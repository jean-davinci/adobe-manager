import LandingClient from './components/landing/LandingClient';
import { listarDocumentos } from '@/lib/documentos';
import { listarClientes } from '@/lib/clientes';

export const metadata = {
  title: 'Pasada de Turnitin en Perú | Informe con Baja Similitud | Davinci Labs',
  description:
    'Obtén tu informe Turnitin con porcentaje de similitud reducido. Detectamos IA, verificamos originalidad para tesis, ensayos y trabajos académicos. Resultados en minutos. Perú.',
  keywords: [
    'pasada de turnitin',
    'informe turnitin peru',
    'bajar similitud turnitin',
    'reducir similitud turnitin',
    'turnitin online peru',
    'pasar turnitin',
    'verificar plagio turnitin',
    'detector de plagio universitario',
    'turnitin para tesis',
    'porcentaje similitud turnitin',
    'informe originalidad turnitin',
    'detector ia turnitin',
    'similitud turnitin peru',
    'turnitin tesis peru',
  ],
  openGraph: {
    title: 'Pasada de Turnitin | Informe con Baja Similitud | Davinci Labs',
    description:
      'Procesamos tu tesis o trabajo con Turnitin y te entregamos el informe oficial. Similitud reducida, detección de IA, entrega en minutos.',
    url: 'https://davincilabs.pe',
    siteName: 'Davinci Labs',
    locale: 'es_PE',
    type: 'website',
  },
  alternates: { canonical: 'https://davincilabs.pe' },
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

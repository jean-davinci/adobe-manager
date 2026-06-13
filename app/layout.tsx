import type { Metadata } from 'next';
import { Poppins } from 'next/font/google';
import './globals.css';
import LayoutShell from './components/LayoutShell';
import { getSession } from '@/lib/dal';

const poppins = Poppins({
  subsets: ['latin'],
  variable: '--font-poppins',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'Davinci Labs — Automatizamos tu trabajo académico',
  description:
    'Procesamiento inteligente de documentos con IA. Detección de IA, similitud Turnitin, informes automáticos y asesoría académica.',
  icons: {
    icon: '/logo-icon.svg',
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  const sesion = session?.userId
    ? { nombre: session.nombre, rol: session.rol }
    : null;

  return (
    <html lang="es" className={poppins.variable}>
      <body className="bg-background antialiased">
        <LayoutShell sesion={sesion}>{children}</LayoutShell>
      </body>
    </html>
  );
}

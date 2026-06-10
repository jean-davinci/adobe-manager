import type { Metadata } from 'next';
import './globals.css';
import LayoutShell from './components/LayoutShell';

export const metadata: Metadata = {
  title: 'Davinci · Centro de investigación profesional',
  description: 'Gestor Adobe y Centro de servicios',
  icons: {
    icon: '/favicon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="bg-gray-50 antialiased">
        <LayoutShell>{children}</LayoutShell>
      </body>
    </html>
  );
}
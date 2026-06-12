import { redirect } from 'next/navigation';

// La landing pública vive ahora en '/'. Esta ruta queda como alias.
export default function ExcelenciaRedirect() {
  redirect('/');
}

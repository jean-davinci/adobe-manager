import { NextResponse, type NextRequest } from 'next/server';
import { decrypt } from '@/lib/session';

// Rutas de staff (admin/operador). El gestor Adobe vive ahora en
// /dashboard/afiliados; '/' es la landing pública.
const STAFF_PREFIXES = ['/dashboard', '/servicios', '/proyectos', '/ganancias'];
// Rutas del portal del cliente
const CLIENT_PREFIXES = ['/mi-acceso', '/portal'];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isStaff = STAFF_PREFIXES.some((p) => pathname.startsWith(p));
  const isClient = CLIENT_PREFIXES.some((p) => pathname.startsWith(p));
  const isLogin = pathname === '/login';

  // Chequeo optimista: solo leemos la cookie (sin tocar la DB).
  const cookie = req.cookies.get('session')?.value;
  const session = await decrypt(cookie);
  const authed = !!session?.userId;

  // Usuario sin sesión intentando entrar a zona protegida → login
  if ((isStaff || isClient) && !authed) {
    const url = new URL('/login', req.nextUrl);
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  if (authed) {
    const esCliente = session!.rol === 'CLIENT';

    // Ya logueado y va al login → a su home según rol
    if (isLogin) {
      return NextResponse.redirect(
        new URL(esCliente ? '/mi-acceso' : '/dashboard', req.nextUrl)
      );
    }
    // Cliente intentando entrar a zona de staff
    if (isStaff && esCliente) {
      return NextResponse.redirect(new URL('/mi-acceso', req.nextUrl));
    }
    // Staff intentando entrar al portal del cliente
    if (isClient && !esCliente) {
      return NextResponse.redirect(new URL('/dashboard', req.nextUrl));
    }
  }

  return NextResponse.next();
}

export const config = {
  // Corre en todo menos API, estáticos e imágenes.
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$|favicon.ico).*)'],
};

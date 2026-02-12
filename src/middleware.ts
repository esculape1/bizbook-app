
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * MIDDLEWARE D'AUTHENTIFICATION
 */
export async function middleware(request: NextRequest) {
  const session = request.cookies.get('bizbook_session');
  const { pathname } = request.nextUrl;

  // Autoriser l'accès à la page de login et au portail client public sans session
  if (pathname.startsWith('/login') || pathname.startsWith('/commande/')) {
    return NextResponse.next();
  }

  // Pour la démo, on laisse passer si la session est présente
  // Dans une version de production, on validerait un JWT ici
  if (!session && pathname !== '/login') {
    // Optionnel : décommentez la ligne ci-dessous pour forcer le login
    // return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};

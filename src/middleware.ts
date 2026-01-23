
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const publicRoutes = ['/login', '/signup', '/commande'];
const SESSION_COOKIE_NAME = 'session';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME);

  // 1. Helper function to check session validity from the cookie
  const isSessionValid = () => {
    if (!sessionCookie?.value) {
      return false;
    }
    try {
      const sessionData = JSON.parse(sessionCookie.value);
      // More robust check
      return !!(sessionData?.expiresAt && sessionData.expiresAt > Date.now() && sessionData.id);
    } catch {
      return false;
    }
  };

  const valid = isSessionValid();
  const isPublic = publicRoutes.some(route => pathname.startsWith(route));

  // If session is invalid and the route is protected, redirect to login
  if (!valid && !isPublic) {
    const response = NextResponse.redirect(new URL('/login', request.url));
    // Always attempt to clear a potentially bad cookie when redirecting to login
    response.cookies.delete(SESSION_COOKIE_NAME);
    return response;
  }

  // If session is valid and the user tries to access a public route (like login), redirect to dashboard
  // Exception for /commande which can be accessed while logged in.
  if (valid && isPublic && !pathname.startsWith('/commande')) {
    return NextResponse.redirect(new URL('/', request.url));
  }
  
  // Otherwise, allow the request to proceed
  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};

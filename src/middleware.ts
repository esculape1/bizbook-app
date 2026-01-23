
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const publicRoutes = ['/login', '/signup', '/commande'];
const SESSION_COOKIE_NAME = 'session';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME);

  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

  // 1. Helper to redirect to login and clear any invalid cookie
  const redirectToLogin = () => {
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete(SESSION_COOKIE_NAME);
    return response;
  };

  // 2. Validate session if cookie exists
  let isSessionValid = false;
  if (sessionCookie) {
    try {
      const sessionData = JSON.parse(sessionCookie.value);
      if (sessionData && sessionData.expiresAt && sessionData.expiresAt > Date.now()) {
        isSessionValid = true;
      }
    } catch {
      // Invalid JSON, session is not valid
    }
  }

  // 3. Logic for protected routes
  if (!isPublicRoute) {
    if (!isSessionValid) {
      // Not on a public route and no valid session, redirect to login
      return redirectToLogin();
    }
    // On a protected route with a valid session, allow access
    return NextResponse.next();
  }

  // 4. Logic for public routes
  if (isPublicRoute) {
    if (isSessionValid) {
      // User has a valid session but is on a public route like /login.
      // Redirect them to the dashboard, unless it's a special public route like /commande.
      if (!pathname.startsWith('/commande')) {
        return NextResponse.redirect(new URL('/', request.url));
      }
    }
    // If session is not valid, or it's a special route, just allow access.
    // If the cookie was invalid, we should clear it but not redirect.
    if (sessionCookie && !isSessionValid) {
        const response = NextResponse.next();
        response.cookies.delete(SESSION_COOKIE_NAME);
        return response;
    }
    return NextResponse.next();
  }

  // Fallback, should not be reached
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

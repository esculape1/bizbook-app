import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const publicRoutes = ['/login', '/signup'];
const SESSION_COOKIE_NAME = 'session';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME);

  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

  // If user is on a public route
  if (isPublicRoute) {
    // If they have a session, redirect them to the dashboard
    if (sessionCookie) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    // Otherwise, allow them to access the public route
    return NextResponse.next();
  }

  // For all other (protected) routes
  // If the user does not have a session, redirect to login
  if (!sessionCookie) {
    // Add the original destination to the query params to redirect back after login
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // If user has a session, allow access
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

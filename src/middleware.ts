
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const SESSION_COOKIE_NAME = 'session';
const publicRoutes = ['/login', '/signup', '/commande'];

// This function checks if a route is public or starts with a public prefix
function isPublicRoute(pathname: string) {
  if (publicRoutes.includes(pathname)) {
    return true;
  }
  for (const route of publicRoutes) {
    if (pathname.startsWith(route + '/')) {
      return true;
    }
  }
  return false;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME);
  
  let sessionData;
  try {
    sessionData = sessionCookie ? JSON.parse(sessionCookie.value) : null;
  } catch (error) {
    sessionData = null;
  }
  
  const isSessionValid = sessionData?.expiresAt && sessionData.expiresAt > Date.now() && sessionData.id;
  const isRoutePublic = isPublicRoute(pathname);

  // Scenario 1: User has an invalid session but is trying to access a protected route.
  // Action: Redirect to login and clear the bad cookie.
  if (!isSessionValid && !isRoutePublic) {
    const response = NextResponse.redirect(new URL('/login', request.url));
    // Corrected line: The delete method expects only one argument (the cookie name).
    response.cookies.delete(SESSION_COOKIE_NAME);
    return response;
  }

  // Scenario 2: User has a valid session but is on a public-only page like login/signup.
  // Action: Redirect to the dashboard.
  if (isSessionValid && (pathname === '/login' || pathname === '/signup')) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Scenario 3: All other cases (valid session on protected route, invalid session on public route, etc.)
  // Action: Allow the request to proceed.
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

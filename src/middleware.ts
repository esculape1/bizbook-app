
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

  // 1. Get the session cookie
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME);
  let sessionData;
  try {
    sessionData = sessionCookie ? JSON.parse(sessionCookie.value) : null;
  } catch {
    sessionData = null;
  }

  // 2. Determine session validity
  const isSessionValid = sessionData?.expiresAt && sessionData.expiresAt > Date.now() && sessionData.id;

  // 3. Check if the current route is public
  const isRoutePublic = isPublicRoute(pathname);

  // 4. Handle invalid sessions
  if (!isSessionValid) {
    // If the route is protected, redirect to login and clear any bad cookie
    if (!isRoutePublic) {
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete(SESSION_COOKIE_NAME, { path: '/' });
      return response;
    }
    // If the route is public, do nothing and let the user access it
    return NextResponse.next();
  }

  // 5. Handle valid sessions
  if (isSessionValid) {
    // If the user is on a public-only route (like login), redirect them to the dashboard
    if (pathname === '/login' || pathname === '/signup') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // 6. For all other cases, allow the request to proceed
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

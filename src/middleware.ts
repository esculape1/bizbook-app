import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSession } from './lib/session';

const protectedRoutes = ['/', '/clients', '/products', '/devis', '/invoices', '/expenses', '/reports', '/settings'];
const adminRoutes = ['/settings', '/reports'];
const publicRoutes = ['/login', '/signup'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route));
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));
  
  const user = await getSession();

  if (isProtectedRoute) {
    if (!user) {
      // User is not authenticated, redirect to login
      return NextResponse.redirect(new URL('/login', request.url));
    }

    if (isAdminRoute && user.role !== 'Admin') {
      // Non-admin user trying to access admin route, redirect to dashboard
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  if (isPublicRoute && user) {
    // Authenticated user trying to access login/signup, redirect to dashboard
    return NextResponse.redirect(new URL('/', request.url));
  }

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

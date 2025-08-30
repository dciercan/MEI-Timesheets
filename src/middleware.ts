
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { User } from '@/lib/types';

export function middleware(request: NextRequest) {
  const currentUserCookie = request.cookies.get('currentUser');
  let currentUser: User | null = null;

  if (currentUserCookie?.value) {
    try {
      // The cookie value is URL-encoded, so we need to decode it first.
      currentUser = JSON.parse(decodeURIComponent(currentUserCookie.value));
    } catch (e) {
      currentUser = null;
      const response = NextResponse.redirect(new URL('/', request.url));
      response.cookies.delete('currentUser');
      return response;
    }
  }

  const { pathname } = request.nextUrl;
  const isLoginPage = pathname === '/';
  
  if (currentUser) {
    const isAdminUser = currentUser.appRole === 'Admin' || currentUser.appRole === 'Subcontractor Admin';
    const isAdminRoute = pathname.startsWith('/admin');

    // If a logged-in user is on the login page, redirect to their dashboard
    if (isLoginPage) {
      const targetUrl = isAdminUser ? '/admin' : '/timesheet';
      return NextResponse.redirect(new URL(targetUrl, request.url));
    }
    
    // If a non-admin tries to access an admin route, redirect them.
    if (isAdminRoute && !isAdminUser) {
       return NextResponse.redirect(new URL('/timesheet', request.url));
    }
    
  } else {
    // If user is not logged in and trying to access a protected page, redirect to login.
    if (!isLoginPage) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }
  
  return NextResponse.next();
}

export const config = {
  // Match all routes except for static assets, API routes, and other internal Next.js paths
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}

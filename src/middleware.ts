
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { User } from '@/lib/types';

export function middleware(request: NextRequest) {
  const currentUserCookie = request.cookies.get('currentUser');
  let currentUser: User | null = null;

  if (currentUserCookie?.value) {
    try {
      currentUser = JSON.parse(currentUserCookie.value);
    } catch (e) {
      currentUser = null;
    }
  }

  const { pathname } = request.nextUrl;

  // If a user is logged in
  if (currentUser) {
    const isUserAdmin = currentUser.appRole === 'Admin' || currentUser.appRole === 'Subcontractor Admin';
    
    // If they are on the login page, redirect them to their correct dashboard
    if (pathname === '/') {
      const targetUrl = isUserAdmin ? '/admin' : '/timesheet';
      return NextResponse.redirect(new URL(targetUrl, request.url));
    }
    
    // Protect admin routes from non-admins.
    if (pathname.startsWith('/admin') && !isUserAdmin) {
       return NextResponse.redirect(new URL('/timesheet', request.url));
    }
    
  } else {
    // If user is not logged in and tries to access any protected page, redirect to login.
    // The root path '/' is the only allowed unauthenticated route.
    if (pathname !== '/') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }
  
  return NextResponse.next();
}

export const config = {
  // Match all routes except for static assets and API routes
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}

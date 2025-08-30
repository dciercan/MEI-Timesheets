
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { User } from '@/lib/types';

export function middleware(request: NextRequest) {
  const currentUserCookie = request.cookies.get('currentUser');
  let currentUser: User | null = null;

  if (currentUserCookie?.value) {
    try {
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
  const isAdminRoute = pathname.startsWith('/admin');
  
  if (currentUser) {
    const isAllowedAdmin = currentUser.appRole === 'Admin' || currentUser.appRole === 'Subcontractor Admin';

    // If logged in user is on the login page, redirect them.
    if (isLoginPage) {
      const targetUrl = isAllowedAdmin ? '/admin' : '/timesheet';
      return NextResponse.redirect(new URL(targetUrl, request.url));
    }
    
    // If a non-admin tries to access an admin route, redirect them.
    if (isAdminRoute && !isAllowedAdmin) {
       return NextResponse.redirect(new URL('/timesheet', request.url));
    }
    
  } else {
    // If user is not logged in and not on the login page, redirect them to login.
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

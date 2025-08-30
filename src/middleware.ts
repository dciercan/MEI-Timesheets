
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { User } from '@/lib/types';

export function middleware(request: NextRequest) {
  const currentUserCookie = request.cookies.get('currentUser');
  let currentUser: User | null = null;

  if (currentUserCookie?.value) {
    try {
      // The cookie value might be URL-encoded.
      currentUser = JSON.parse(decodeURIComponent(currentUserCookie.value));
    } catch (e) {
      currentUser = null;
      // If the cookie is malformed, delete it and redirect to login
      const response = NextResponse.redirect(new URL('/', request.url));
      response.cookies.delete('currentUser');
      return response;
    }
  }

  const { pathname } = request.nextUrl;
  const isLoginPage = pathname === '/';
  
  // If user is logged in
  if (currentUser) {
    const isAdminUser = currentUser.appRole === 'Admin' || currentUser.appRole === 'Subcontractor Admin';
    const isSupervisor = currentUser.appRole === 'Crew Supervisor';
    const isAdminRoute = pathname.startsWith('/admin');

    // If a logged-in user is trying to access the login page, redirect them to their correct dashboard.
    if (isLoginPage) {
      const targetUrl = isAdminUser ? '/admin' : '/timesheet';
      return NextResponse.redirect(new URL(targetUrl, request.url));
    }
    
    // If a non-admin user tries to access an admin route, redirect them to their dashboard.
    if (isAdminRoute && !isAdminUser) {
       return NextResponse.redirect(new URL('/timesheet', request.url));
    }

    // If an admin user tries to access a supervisor-only page, redirect them to the admin dashboard.
    if (pathname.startsWith('/timesheet/my-submissions') && isAdminUser) {
        return NextResponse.redirect(new URL('/admin', request.url));
    }
    
  } else {
    // If user is not logged in and trying to access any page other than the login page, redirect them to login.
    if (!isLoginPage) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }
  
  // If none of the above conditions are met, allow the request to proceed.
  return NextResponse.next();
}

export const config = {
  // Match all routes except for static assets, API routes, and other internal Next.js paths
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}

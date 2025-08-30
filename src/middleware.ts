
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
      // Invalid cookie, clear it and treat as logged out
      currentUser = null;
      const response = NextResponse.redirect(new URL('/', request.url));
      response.cookies.delete('currentUser');
      return response;
    }
  }

  const { pathname } = request.nextUrl;
  const isLoginPage = pathname === '/';
  
  // User is logged in
  if (currentUser) {
    const isUserAdmin = currentUser.appRole === 'Admin' || currentUser.appRole === 'Subcontractor Admin';
    const isAdminRoute = pathname.startsWith('/admin');

    // If logged-in user is on the login page, redirect them to their dashboard
    if (isLoginPage) {
      const targetUrl = isUserAdmin ? '/admin' : '/timesheet';
      return NextResponse.redirect(new URL(targetUrl, request.url));
    }
    
    // If a non-admin tries to access an admin route, redirect them to their default page
    if (isAdminRoute && !isUserAdmin) {
       return NextResponse.redirect(new URL('/timesheet', request.url));
    }
    
  } else {
    // User is not logged in. If they are trying to access any page other than
    // the login page, redirect them to the login page.
    if (!isLoginPage) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }
  
  // If no redirection rules matched, allow the request to proceed
  return NextResponse.next();
}

export const config = {
  // Match all routes except for static assets, API routes, and other internal Next.js paths
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}


import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { User } from '@/lib/types';

export function middleware(request: NextRequest) {
  const currentUserCookie = request.cookies.get('currentUser');
  let currentUser: User | null = null;

  if (currentUserCookie) {
    try {
      currentUser = JSON.parse(currentUserCookie.value);
    } catch (e) {
      // Invalid cookie, treat as logged out
      currentUser = null;
    }
  }

  const { pathname } = request.nextUrl;
  const isAuthPage = pathname === '/';

  // If user is logged in
  if (currentUser) {
    const isUserAdmin = currentUser.appRole === 'Admin' || currentUser.appRole === 'Subcontractor Admin';
    const targetUrl = isUserAdmin ? '/admin' : '/timesheet';
    
    // If they are on the login page, redirect them to their dashboard.
    if (isAuthPage) {
      return NextResponse.redirect(new URL(targetUrl, request.url));
    }
    
    // If a non-admin tries to access an admin route, redirect them.
    if (pathname.startsWith('/admin') && !isUserAdmin) {
       return NextResponse.redirect(new URL('/timesheet', request.url));
    }

    // If an admin tries to access the 'my-submissions' page, redirect them to the admin dash.
    if (pathname === '/timesheet/my-submissions' && isUserAdmin) {
         return NextResponse.redirect(new URL('/admin', request.url));
    }

  } else {
    // If user is not logged in and not on the login page, redirect to login.
    if (!isAuthPage) {
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

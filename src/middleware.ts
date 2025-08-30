
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
  const isAdminRoute = pathname.startsWith('/admin');
  const isTimesheetRoute = pathname.startsWith('/timesheet');

  if (!currentUser && !isAuthPage) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  if (currentUser) {
    const isUserAdmin = currentUser.appRole === 'Admin' || currentUser.appRole === 'Subcontractor Admin';

    if (isAuthPage) {
      const url = isUserAdmin ? '/admin' : '/timesheet';
      return NextResponse.redirect(new URL(url, request.url));
    }
    
    if (isAdminRoute && !isUserAdmin) {
       return NextResponse.redirect(new URL('/timesheet', request.url));
    }

    if (isTimesheetRoute && isUserAdmin) {
        // Admins can see the timesheet entry page, but shouldn't see 'my-submissions'
        if (pathname === '/timesheet/my-submissions') {
             return NextResponse.redirect(new URL('/admin', request.url));
        }
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

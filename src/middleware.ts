
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
  const isAuthPage = pathname === '/';

  if (currentUser) {
    const isUserAdmin = currentUser.appRole === 'Admin' || currentUser.appRole === 'Subcontractor Admin';
    
    // If logged-in user is on the auth page, redirect them to their dashboard.
    if (isAuthPage) {
      const targetUrl = isUserAdmin ? '/admin' : '/timesheet';
      return NextResponse.redirect(new URL(targetUrl, request.url));
    }
    
    // Protect admin routes from non-admins
    if (pathname.startsWith('/admin') && !isUserAdmin) {
       return NextResponse.redirect(new URL('/timesheet', request.url));
    }

    // Protect supervisor-only pages from admins
    if (pathname === '/timesheet/my-submissions' && isUserAdmin) {
         return NextResponse.redirect(new URL('/admin', request.url));
    }

  } else {
    // If user is not logged in and trying to access a protected page, redirect to login.
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

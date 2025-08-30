
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// This middleware is now disabled to simplify the application and remove authentication complexity.
// All logic has been removed.
export function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [],
}

import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export const runtime = 'nodejs';

export async function middleware(request: NextRequest) {
  // Block OPTIONS method to prevent information disclosure
  // OPTIONS is used for CORS preflight, but we can handle CORS in API routes if needed
  if (request.method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 405 });
    response.headers.set('Allow', 'GET, POST, PUT, PATCH, DELETE, HEAD');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    return response;
  }

  // Block other unnecessary HTTP methods
  const allowedMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD'];
  if (!allowedMethods.includes(request.method)) {
    const response = new NextResponse(null, { status: 405 });
    response.headers.set('Allow', allowedMethods.join(', '));
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    return response;
  }

  // update user's auth session (security headers are already added in updateSession)
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'
  ]
};

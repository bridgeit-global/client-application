import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from './server';

// Helper function to add security headers to any NextResponse
function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  // Indicate allowed HTTP methods (OPTIONS is blocked for security)
  response.headers.set('Allow', 'GET, POST, PUT, PATCH, DELETE, HEAD');
  
  // Content Security Policy
  // Note: 'unsafe-inline' and 'unsafe-eval' are required for Next.js hydration
  const cspPolicy = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live https://va.vercel-scripts.com https://*.vercel-scripts.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob: https://utfs.io https://*.supabase.co https://*.supabase.in https://api.mapbox.com https://*.tiles.mapbox.com",
    "connect-src 'self' https://*.supabase.co https://*.supabase.in wss://*.supabase.co wss://*.supabase.in https://api.mapbox.com https://events.mapbox.com https://uploadthing.com https://vercel.live https://*.vercel-scripts.com",
    "frame-src 'self' https://uploadthing.com",
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join('; ');
  
  response.headers.set('Content-Security-Policy', cspPolicy);
  return response;
}

export async function updateSession(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isSupportRoute = path.startsWith('/support');
  const isPortalRoute = path.startsWith('/portal');
  const isProtectedRoute = isSupportRoute || isPortalRoute;
  const isLoginRoute = path === '/login';
  // Home page is not a protected route, so both logged-in and non-logged-in users can access it

  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  const url = request.nextUrl.clone();
  const isOperator = user?.user_metadata?.role === 'operator';

  if (isLoginRoute && (user?.email || (isOperator && user?.phone_confirmed_at))) {
    url.pathname = isOperator ? '/portal/meter-reading-list' : '/portal/dashboard';
    url.search = '';
    return addSecurityHeaders(NextResponse.redirect(url));
  }

  // if not protected route, redirect to requested route
  if (!isProtectedRoute) {
    return addSecurityHeaders(NextResponse.next());
  }

  // If the user is not logged in, redirect to /login
  // For operators, email is optional so we check for user existence and phone confirmation
  const shouldRedirectToLogin = isProtectedRoute && (!user || (!user.email && !isOperator) || (isOperator && !user.phone_confirmed_at));

  if (shouldRedirectToLogin) {
    if (path !== '/login') {
      url.pathname = '/login';
      // For operators with unconfirmed phone, add error parameter
      if (isOperator && !user?.phone_confirmed_at) {
        url.searchParams.set('error', 'phone_not_verified');
      }
      return addSecurityHeaders(NextResponse.redirect(url));
    }
    return addSecurityHeaders(NextResponse.next()); // Avoid infinite redirect loop
  }
  // If the user is logged in (either with email or as an authenticated operator)
  if (user?.email || (isOperator && user?.phone_confirmed_at)) {
    if (isProtectedRoute) {
      // Handle role-specific redirects for protected routes

      // Restrict operator users to only meter-reading pages
      if (user.user_metadata?.role === 'operator') {
        const allowedOperatorPaths = ['/portal/meter-reading', '/portal/meter-reading-list'];
        if (!allowedOperatorPaths.includes(path) && isPortalRoute) {
          url.pathname = '/portal/meter-reading-list';
          return addSecurityHeaders(NextResponse.redirect(url));
        }
        if (isSupportRoute) {
          url.pathname = '/portal/meter-reading-list';
          return addSecurityHeaders(NextResponse.redirect(url));
        }
      }

      // Block non-operator users from accessing meter-reading pages
      const operatorOnlyPaths = ['/portal/meter-reading', '/portal/meter-reading-list'];
      if (operatorOnlyPaths.includes(path) && user.user_metadata?.role !== 'operator') {
        url.pathname = '/portal/dashboard';
        return addSecurityHeaders(NextResponse.redirect(url));
      }

      if (user.role !== 'service_role' && isSupportRoute) {
        if (path !== '/portal/dashboard') {
          url.pathname = '/portal/dashboard';
          return addSecurityHeaders(NextResponse.redirect(url));
        }
      }
    }
  } else {
    // Redirect to login for unauthorized users
    if (path !== '/login' && isProtectedRoute) {
      url.pathname = '/login';
      return addSecurityHeaders(NextResponse.redirect(url));
    }
  }

  return addSecurityHeaders(NextResponse.next());
}

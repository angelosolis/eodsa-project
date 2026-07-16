import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  ADMIN_SESSION_COOKIE,
  isAdminOnlyPath,
  verifyAdminSessionToken
} from '@/lib/admin-session';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Admin-only gate (server-side; cannot be bypassed by skipping client JS) ──
  if (isAdminOnlyPath(pathname)) {
    const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    const session = await verifyAdminSessionToken(token);
    if (!session?.isAdmin) {
      // APIs get 401 JSON; pages redirect to Admin login
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { success: false, error: 'Admin authentication required' },
          { status: 401 }
        );
      }
      const loginUrl = new URL('/portal/admin', request.url);
      loginUrl.searchParams.set('next', pathname + request.nextUrl.search);
      return NextResponse.redirect(loginUrl);
    }
  }

  const response = NextResponse.next();

  // Special handling for file upload routes
  if (pathname.includes('/api/upload/music')) {
    response.headers.set('X-Upload-Route', 'true');
    response.headers.set('X-Max-File-Size', '250MB');
  }

  // Do not blanket-allow all origins on internal admin surfaces
  if (!isAdminOnlyPath(pathname) && !pathname.startsWith('/api/admin')) {
    response.headers.set('Access-Control-Allow-Origin', '*');
  }
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (pathname.startsWith('/api/')) {
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
  }

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: response.headers });
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except static assets.
     * Includes pages + APIs so admin page HTML cannot be served anonymously.
     */
    '/((?!_next/static|_next/image|favicon.ico).*)'
  ]
};

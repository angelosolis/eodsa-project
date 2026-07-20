import { NextRequest, NextResponse } from 'next/server';
import {
  ADMIN_SESSION_COOKIE,
  verifyAdminSessionToken
} from '@/lib/admin-session';

/**
 * GET — validate current httpOnly Admin cookie only.
 * Never mints a session from client-supplied IDs (that was a passwordless bypass).
 */
export async function GET(request: NextRequest) {
  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  const session = await verifyAdminSessionToken(token);
  if (!session) {
    return NextResponse.json({ success: false, authenticated: false }, { status: 401 });
  }
  return NextResponse.json({
    success: true,
    authenticated: true,
    admin: { id: session.id, email: session.email, name: session.name, isAdmin: true }
  });
}

/** POST removed — Admin cookies are only issued by /api/auth/login after password verification. */
export async function POST() {
  return NextResponse.json(
    {
      success: false,
      error: 'Admin password login is required. Use /api/auth/login.'
    },
    { status: 405 }
  );
}

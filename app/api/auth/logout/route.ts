import { NextResponse } from 'next/server';
import { ADMIN_SESSION_COOKIE, adminCookieOptions } from '@/lib/admin-session';

/** Clear Admin session cookie */
export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(ADMIN_SESSION_COOKIE, '', {
    ...adminCookieOptions(0),
    maxAge: 0
  });
  return response;
}

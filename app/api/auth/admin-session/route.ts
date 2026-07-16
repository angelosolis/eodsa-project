import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';
import {
  ADMIN_SESSION_COOKIE,
  adminCookieOptions,
  createAdminSessionToken,
  verifyAdminSessionToken
} from '@/lib/admin-session';

/** GET — validate current admin cookie */
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

/**
 * POST — mint/refresh httpOnly admin cookie after verifying the user is still an admin in DB.
 * Accepts { adminSession } from legacy localStorage or { adminId }.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    let adminId: string | undefined;

    if (body.adminSession) {
      try {
        const parsed =
          typeof body.adminSession === 'string'
            ? JSON.parse(body.adminSession)
            : body.adminSession;
        if (!parsed?.isAdmin || !parsed?.id) {
          return NextResponse.json(
            { success: false, error: 'Admin session required' },
            { status: 401 }
          );
        }
        adminId = parsed.id;
      } catch {
        return NextResponse.json({ success: false, error: 'Invalid session' }, { status: 400 });
      }
    } else if (body.adminId) {
      adminId = body.adminId;
    }

    if (!adminId) {
      return NextResponse.json(
        { success: false, error: 'Admin identification required' },
        { status: 400 }
      );
    }

    const admin = await db.getJudgeById(adminId);
    if (!admin || !admin.isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    const token = await createAdminSessionToken({
      id: admin.id,
      email: admin.email,
      name: admin.name
    });

    const response = NextResponse.json({
      success: true,
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        isAdmin: true
      }
    });
    response.cookies.set(ADMIN_SESSION_COOKIE, token, adminCookieOptions());
    return response;
  } catch (error) {
    console.error('admin-session error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to establish admin session' },
      { status: 500 }
    );
  }
}

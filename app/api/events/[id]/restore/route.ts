import { NextRequest, NextResponse } from 'next/server';
import { db, initializeDatabase } from '@/lib/database';

function parseAdminSession(body: any, request: NextRequest): { isAdmin: boolean; id?: string } | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader && !body.adminSession && !body.adminId) {
    return null;
  }

  if (body.adminSession) {
    try {
      const adminData = typeof body.adminSession === 'string'
        ? JSON.parse(body.adminSession)
        : body.adminSession;
      if (!adminData?.isAdmin) return { isAdmin: false };
      return { isAdmin: true, id: adminData.id || adminData.adminId || body.adminId };
    } catch {
      return null;
    }
  }

  if (body.adminId) {
    return { isAdmin: true, id: body.adminId };
  }

  return { isAdmin: true };
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initializeDatabase();
    const { id: eventId } = await params;
    const body = await request.json().catch(() => ({}));

    const session = parseAdminSession(body, request);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }
    if (!session.isAdmin) {
      return NextResponse.json({ success: false, error: 'Admin privileges required' }, { status: 403 });
    }

    if (session.id) {
      const admin = await db.getJudgeById(session.id);
      if (!admin || !admin.isAdmin) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized: Admin access required' },
          { status: 403 }
        );
      }
    }

    const event = await db.restoreEvent(eventId);

    return NextResponse.json({
      success: true,
      message: 'Event restored successfully. It will appear in active dashboards again.',
      event
    });
  } catch (error: any) {
    console.error('Error restoring event:', error);
    const message = error?.message || 'Failed to restore event';
    const status = message.includes('not found') ? 404
      : message.includes('not archived') ? 400
      : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { db, initializeDatabase } from '@/lib/database';
import { cloudinary } from '@/lib/cloudinary';

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

/** Extract Cloudinary public_id from a secure URL */
function extractCloudinaryPublicId(url: string): { publicId: string; resourceType: string } | null {
  try {
    // Examples:
    // https://res.cloudinary.com/cloud/video/upload/v123/eodsa/music/file.mp3
    // https://res.cloudinary.com/cloud/image/upload/v123/folder/file.jpg
    const match = url.match(/\/(video|image|raw)\/upload\/(?:v\d+\/)?(.+?)(?:\.[a-zA-Z0-9]+)?$/);
    if (!match) {
      // Try without version
      const match2 = url.match(/cloudinary\.com\/[^/]+\/(video|image|raw)\/upload\/(.+)$/);
      if (!match2) return null;
      const resourceType = match2[1];
      let publicId = match2[2];
      // Strip transformation segments if present (e.g. q_auto/)
      if (publicId.includes('/')) {
        const parts = publicId.split('/');
        // If first part looks like a transformation, skip until we hit folder path
        // For signed uploads we use eodsa/music/... without transforms
        const eodsaIdx = parts.findIndex(p => p === 'eodsa' || p.startsWith('eodsa'));
        if (eodsaIdx >= 0) {
          publicId = parts.slice(eodsaIdx).join('/');
        }
      }
      publicId = publicId.replace(/\.[a-zA-Z0-9]+$/, '');
      return { publicId, resourceType };
    }
    const resourceType = match[1];
    let publicId = match[2];
    publicId = publicId.replace(/\.[a-zA-Z0-9]+$/, '');
    return { publicId, resourceType };
  } catch {
    return null;
  }
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

    if (body.confirmation !== 'PURGE') {
      return NextResponse.json(
        { success: false, error: 'Confirmation required. Type PURGE to continue.' },
        { status: 400 }
      );
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

    const event = await db.getEventById(eventId);
    if (!event) {
      return NextResponse.json({ success: false, error: 'Event not found' }, { status: 404 });
    }

    if (!event.isArchived) {
      return NextResponse.json(
        { success: false, error: 'Event must be archived before media can be purged.' },
        { status: 400 }
      );
    }

    if (event.mediaPurgedAt) {
      return NextResponse.json(
        { success: false, error: 'Media for this event has already been purged.' },
        { status: 400 }
      );
    }

    const mediaUrls = await db.getEventMediaUrls(eventId);
    const destroyed: string[] = [];
    const failed: string[] = [];

    for (const item of mediaUrls) {
      if (!item.url.includes('cloudinary.com') || !cloudinary) {
        continue;
      }
      const parsed = extractCloudinaryPublicId(item.url);
      if (!parsed) {
        failed.push(item.url);
        continue;
      }
      try {
        await cloudinary.uploader.destroy(parsed.publicId, {
          resource_type: parsed.resourceType === 'image' ? 'image' : 'video',
          invalidate: true
        });
        destroyed.push(parsed.publicId);
      } catch (err) {
        console.error('Cloudinary destroy failed for', parsed.publicId, err);
        failed.push(parsed.publicId);
      }
    }

    // Always clear DB URLs (even if some Cloudinary destroys failed — files may already be gone)
    await db.clearEventMediaUrls(eventId);

    return NextResponse.json({
      success: true,
      message: `Purged media for "${event.name}". Deleted ${destroyed.length} Cloudinary file(s). Certificates and scores were not affected.`,
      destroyedCount: destroyed.length,
      failedCount: failed.length,
      clearedUrlCount: mediaUrls.length
    });
  } catch (error: any) {
    console.error('Error purging event media:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to purge media' },
      { status: 500 }
    );
  }
}

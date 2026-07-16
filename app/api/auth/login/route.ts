import { NextResponse } from 'next/server';
import { db } from '@/lib/database';
import bcrypt from 'bcryptjs';
import {
  ADMIN_SESSION_COOKIE,
  adminCookieOptions,
  createAdminSessionToken
} from '@/lib/admin-session';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const judge = await db.getJudgeByEmail(email);

    if (!judge) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const isValidPassword = await bcrypt.compare(password, judge.password);

    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const judgeSession = {
      id: judge.id,
      name: judge.name,
      email: judge.email,
      isAdmin: judge.isAdmin
    };

    const response = NextResponse.json({
      success: true,
      judge: judgeSession
    });

    // Server-side Admin cookie — required for /backend, /admin, etc.
    if (judge.isAdmin) {
      const token = await createAdminSessionToken({
        id: judge.id,
        email: judge.email,
        name: judge.name
      });
      response.cookies.set(ADMIN_SESSION_COOKIE, token, adminCookieOptions());
    }

    return response;
  } catch (error) {
    console.error('Authentication error:', error);
    return NextResponse.json(
      { success: false, error: 'Authentication failed' },
      { status: 500 }
    );
  }
}

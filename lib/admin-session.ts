/**
 * Admin session tokens for middleware-enforced Admin-only routes.
 * Edge-compatible (Web Crypto) — used by middleware + auth API routes.
 */

export const ADMIN_SESSION_COOKIE = 'eodsa_admin_session';
export const ADMIN_SESSION_MAX_AGE_SEC = 60 * 60 * 12; // 12 hours

export type AdminSessionPayload = {
  id: string;
  email: string;
  name?: string;
  isAdmin: true;
  exp: number;
};

function getSecret(): string {
  const secret =
    process.env.ADMIN_SESSION_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    process.env.AUTH_SECRET;
  if (secret && secret.length >= 16) return secret;
  // Fallback keeps local/dev working; production should set ADMIN_SESSION_SECRET
  return `eodsa-admin-fallback-${process.env.DATABASE_URL?.slice(-32) || 'dev-only'}`;
}

function toBase64Url(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let binary = '';
  for (let i = 0; i < arr.length; i++) binary += String.fromCharCode(arr[i]!);
  const b64 = btoa(binary);
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function fromBase64Url(value: string): Uint8Array {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/');
  const pad = padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4));
  const binary = atob(padded + pad);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

async function hmacSign(message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(getSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  return toBase64Url(sig);
}

async function hmacVerify(message: string, signatureB64Url: string): Promise<boolean> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(getSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  );
  const sig = fromBase64Url(signatureB64Url);
  // subtle.verify expects ArrayBufferView — copy to a fresh buffer for TS/edge
  const sigBuf = new Uint8Array(sig.byteLength);
  sigBuf.set(sig);
  return crypto.subtle.verify('HMAC', key, sigBuf, enc.encode(message));
}

export async function createAdminSessionToken(admin: {
  id: string;
  email: string;
  name?: string;
}): Promise<string> {
  const payload: AdminSessionPayload = {
    id: admin.id,
    email: admin.email,
    name: admin.name,
    isAdmin: true,
    exp: Math.floor(Date.now() / 1000) + ADMIN_SESSION_MAX_AGE_SEC
  };
  const body = toBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
  const sig = await hmacSign(body);
  return `${body}.${sig}`;
}

export async function verifyAdminSessionToken(
  token: string | undefined | null
): Promise<AdminSessionPayload | null> {
  if (!token || !token.includes('.')) return null;
  const [body, sig] = token.split('.');
  if (!body || !sig) return null;

  const valid = await hmacVerify(body, sig);
  if (!valid) return null;

  try {
    const json = new TextDecoder().decode(fromBase64Url(body));
    const payload = JSON.parse(json) as AdminSessionPayload;
    if (!payload?.isAdmin || !payload.id || !payload.exp) return null;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

/** Paths that must never be reachable without a verified Admin session cookie. */
export function isAdminOnlyPath(pathname: string): boolean {
  const prefixes = [
    '/backend',
    '/admin',
    '/event-type-manager',
    '/certificates/adjust',
    '/certificates/test',
    '/test-certificate',
    '/api/admin'
  ];
  return prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function adminCookieOptions(maxAge = ADMIN_SESSION_MAX_AGE_SEC) {
  return {
    httpOnly: true as const,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge
  };
}

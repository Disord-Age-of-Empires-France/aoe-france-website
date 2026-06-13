import crypto from "node:crypto";
import { cookies } from "next/headers";

export type UserRole = "admin" | "editor" | "member";

export interface SessionPayload {
  userId:   string;
  username: string;
  role:     UserRole;
}

export const SESSION_COOKIE   = "admin_session";
const SESSION_DURATION_MS     = 8 * 60 * 60 * 1000; // 8 h

function b64url(str: string): string {
  return Buffer.from(str).toString("base64url");
}

function fromB64url(str: string): string {
  return Buffer.from(str, "base64url").toString("utf-8");
}

export function signJWT(payload: Record<string, unknown>): string {
  const secret = process.env.AUTH_SECRET!;
  const header = b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body   = b64url(
    JSON.stringify({ ...payload, exp: Date.now() + SESSION_DURATION_MS })
  );
  const sig = crypto
    .createHmac("sha256", secret)
    .update(`${header}.${body}`)
    .digest("base64url");
  return `${header}.${body}.${sig}`;
}

export function verifyJWT(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [header, body, sig] = parts;
    const secret = process.env.AUTH_SECRET!;
    const expected = crypto
      .createHmac("sha256", secret)
      .update(`${header}.${body}`)
      .digest("base64url");
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected)))
      return null;
    const payload = JSON.parse(fromB64url(body));
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const payload = verifyJWT(token);
  if (!payload?.sub || !payload?.userId || !payload?.role) return null;
  return {
    userId:   payload.userId   as string,
    username: payload.sub      as string,
    role:     payload.role     as UserRole,
  };
}

export async function createSession(data: SessionPayload): Promise<void> {
  const token = signJWT({ sub: data.username, userId: data.userId, role: data.role });
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    sameSite: "lax",
    path:     "/",
    maxAge:   SESSION_DURATION_MS / 1000,
  });
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE = "admin_session";

// Routes accessible only to admins
const ADMIN_ONLY = ["/admin/utilisateurs", "/admin/parametres"];

async function verifyToken(token: string): Promise<{ role: string } | null> {
  try {
    const [header, body, sig] = token.split(".");
    if (!header || !body || !sig) return null;

    const secret = process.env.AUTH_SECRET;
    if (!secret) return null;

    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    const sigBytes = Uint8Array.from(
      atob(sig.replace(/-/g, "+").replace(/_/g, "/")),
      (c) => c.charCodeAt(0)
    );

    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      sigBytes,
      new TextEncoder().encode(`${header}.${body}`)
    );
    if (!valid) return null;

    const payload = JSON.parse(
      atob(body.replace(/-/g, "+").replace(/_/g, "/"))
    );
    if (payload.exp && Date.now() > payload.exp) return null;

    return { role: payload.role ?? "editor" };
  } catch {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/admin/login") return NextResponse.next();

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  const result = await verifyToken(token);
  if (!result) {
    const response = NextResponse.redirect(new URL("/admin/login", request.url));
    response.cookies.delete(SESSION_COOKIE);
    return response;
  }

  // Members (Discord public login) cannot access the admin panel
  if (result.role === "member") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Block non-admins from admin-only routes
  if (ADMIN_ONLY.some((p) => pathname.startsWith(p)) && result.role !== "admin") {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};

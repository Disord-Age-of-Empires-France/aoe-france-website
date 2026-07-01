import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE = "admin_session";

// Routes accessibles uniquement aux admins
const ADMIN_ONLY = ["/admin/utilisateurs", "/admin/parametres"];

// ─── JWT Edge-compatible ───────────────────────────────────────────────────────

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

    const payload = JSON.parse(atob(body.replace(/-/g, "+").replace(/_/g, "/")));
    if (payload.exp && Date.now() > payload.exp) return null;

    return { role: payload.role ?? "editor" };
  } catch {
    return null;
  }
}

// ─── Turso HTTP (Edge-compatible) ─────────────────────────────────────────────

async function getMaintenanceStatus(): Promise<{ active: boolean; message: string } | null> {
  const rawUrl = process.env.TURSO_DATABASE_URL;
  const token  = process.env.TURSO_AUTH_TOKEN;
  if (!rawUrl || !token) return null;

  const httpUrl = rawUrl.replace(/^libsql:\/\//, "https://");

  try {
    const res = await fetch(`${httpUrl}/v2/pipeline`, {
      method:  "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type":  "application/json",
      },
      body: JSON.stringify({
        requests: [
          {
            type: "execute",
            stmt: {
              sql: "SELECT key, value FROM settings WHERE key IN ('maintenance_mode', 'maintenance_message', 'maintenance_end')",
            },
          },
          { type: "close" },
        ],
      }),
      cache: "no-store",
    });

    if (!res.ok) return null;

    const json = await res.json() as {
      results: { type: string; response?: { result?: { rows: (string | null)[][] } } }[]
    };
    const rows = json.results?.[0]?.response?.result?.rows ?? [];

    // Chaque cellule est { type: "text", value: "..." }, pas une string brute
    const cell = (c: unknown): string => {
      if (typeof c === "string") return c;
      if (c && typeof c === "object" && "value" in c) return String((c as { value: unknown }).value);
      return "";
    };

    let active  = false;
    let message = "";
    let endAt   = "";
    for (const row of rows) {
      if (cell(row[0]) === "maintenance_mode")    active  = cell(row[1]) === "1";
      if (cell(row[0]) === "maintenance_message") message = cell(row[1]);
      if (cell(row[0]) === "maintenance_end")     endAt   = cell(row[1]);
    }

    // Si une date de fin est définie et déjà passée, la maintenance est terminée
    if (active && endAt) {
      const end = new Date(endAt);
      if (!isNaN(end.getTime()) && Date.now() > end.getTime()) active = false;
    }

    return { active, message };
  } catch {
    return null;
  }
}

// ─── Proxy ────────────────────────────────────────────────────────────────────

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Protection des routes admin ──────────────────────────────────────────
  if (pathname.startsWith("/admin")) {
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

    if (result.role === "member") {
      return NextResponse.redirect(new URL("/", request.url));
    }

    if (ADMIN_ONLY.some((p) => pathname.startsWith(p)) && result.role !== "admin") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }

    return NextResponse.next();
  }

  // ── Maintenance (routes publiques) ────────────────────────────────────────
  if (pathname.startsWith("/maintenance") || pathname.startsWith("/connexion")) {
    return NextResponse.next();
  }

  // Les admins passent toujours, même sur les pages publiques
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (token) {
    const result = await verifyToken(token);
    if (result?.role === "admin") return NextResponse.next();
  }

  const status = await getMaintenanceStatus();
  if (status?.active) {
    return NextResponse.redirect(new URL("/maintenance", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};

import { getSession } from "@/lib/session";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return new Response("Non authentifié", { status: 401 });

  const origin = new URL(request.url).origin;

  const params = new URLSearchParams({
    "openid.ns":         "http://specs.openid.net/auth/2.0",
    "openid.mode":       "checkid_setup",
    "openid.return_to":  `${origin}/api/steam/callback`,
    "openid.realm":      origin,
    "openid.identity":   "http://specs.openid.net/auth/2.0/identifier_select",
    "openid.claimed_id": "http://specs.openid.net/auth/2.0/identifier_select",
  });

  return Response.redirect(`https://steamcommunity.com/openid/login?${params}`);
}

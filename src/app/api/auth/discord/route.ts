import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { randomBytes } from "node:crypto";

export async function GET(request: NextRequest) {
  const state    = randomBytes(16).toString("hex");
  const returnTo = request.nextUrl.searchParams.get("returnTo") ?? "/";

  const params = new URLSearchParams({
    client_id:     process.env.DISCORD_CLIENT_ID!,
    redirect_uri:  process.env.DISCORD_REDIRECT_URI!,
    response_type: "code",
    scope:         "identify email",
    state,
  });

  const response = NextResponse.redirect(
    `https://discord.com/api/oauth2/authorize?${params}`
  );

  const cookieOpts = {
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path:     "/",
    maxAge:   600,
  };

  response.cookies.set("discord_oauth_state",     state,    cookieOpts);
  response.cookies.set("discord_return_to",       returnTo, cookieOpts);

  return response;
}

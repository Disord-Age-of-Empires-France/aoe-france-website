import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";

export async function GET() {
  const state = randomBytes(16).toString("hex");

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

  response.cookies.set("discord_oauth_state", state, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    sameSite: "lax",
    path:     "/",
    maxAge:   600, // 10 min
  });

  return response;
}

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createSession } from "@/lib/session";
import { getUserByDiscordId, createDiscordUser, updateUserLastLogin, createLog } from "@/lib/db";

interface DiscordUser {
  id:          string;
  username:    string;
  global_name: string | null;
  avatar:      string | null;
  email:       string | null;
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code        = searchParams.get("code");
  const state       = searchParams.get("state");
  const storedState = request.cookies.get("discord_oauth_state")?.value;

  const fail = (reason: string) =>
    NextResponse.redirect(new URL(`/connexion?error=${reason}`, request.url));

  if (!code || !state || state !== storedState) return fail("invalid_state");

  // Exchange code for access token
  const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
    method:  "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id:     process.env.DISCORD_CLIENT_ID!,
      client_secret: process.env.DISCORD_CLIENT_SECRET!,
      grant_type:    "authorization_code",
      code,
      redirect_uri:  process.env.DISCORD_REDIRECT_URI!,
    }),
  });

  if (!tokenRes.ok) return fail("token_failed");
  const { access_token } = await tokenRes.json() as { access_token: string };

  // Fetch Discord user info
  const userRes = await fetch("https://discord.com/api/users/@me", {
    headers: { Authorization: `Bearer ${access_token}` },
  });

  if (!userRes.ok) return fail("user_failed");
  const discordUser = await userRes.json() as DiscordUser;

  const discordAvatar = discordUser.avatar
    ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.webp?size=128`
    : "";

  // Find or create user
  let user = await getUserByDiscordId(discordUser.id);
  if (!user) {
    try {
      user = await createDiscordUser({
        discordId:     discordUser.id,
        username:      discordUser.username,
        displayName:   discordUser.global_name ?? discordUser.username,
        email:         discordUser.email ?? "",
        discordAvatar,
      });
    } catch {
      // Username conflict — use discord ID as fallback username
      user = await createDiscordUser({
        discordId:     discordUser.id,
        username:      `discord_${discordUser.id.slice(0, 8)}`,
        displayName:   discordUser.global_name ?? discordUser.username,
        email:         discordUser.email ?? "",
        discordAvatar,
      });
    }
  }

  await createSession({ userId: user.id, username: user.username, role: user.role });
  await updateUserLastLogin(user.id);
  await createLog({
    userId:   user.id,
    username: user.username,
    role:     user.role,
    action:   "auth.login_discord",
    target:   discordUser.username,
    targetId: discordUser.id,
  });

  const dest = user.role === "admin" || user.role === "editor" ? "/admin" : "/";
  const response = NextResponse.redirect(new URL(dest, request.url));
  response.cookies.delete("discord_oauth_state");
  return response;
}

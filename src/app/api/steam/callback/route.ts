import { getSession } from "@/lib/session";
import { updateUserSteam, getUserBySteamId } from "@/lib/db";

interface SteamPlayer {
  personaname: string;
  avatarfull:  string;
  profileurl:  string;
}

export async function GET(request: Request) {
  const base = new URL(request.url).origin;
  const profil = `${base}/profil?tab=profil`;

  const session = await getSession();
  if (!session) return Response.redirect(`${profil}&steam=error`);

  const params = new URL(request.url).searchParams;

  // Vérification OpenID avec Steam
  const verifyParams = new URLSearchParams(params);
  verifyParams.set("openid.mode", "check_authentication");

  const verifyRes  = await fetch("https://steamcommunity.com/openid/login", {
    method:  "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body:    verifyParams.toString(),
  });
  const verifyText = await verifyRes.text();
  if (!verifyText.includes("is_valid:true")) {
    return Response.redirect(`${profil}&steam=error`);
  }

  // Extraction du Steam ID64 depuis openid.claimed_id
  const claimedId = params.get("openid.claimed_id") ?? "";
  const match     = claimedId.match(/\/openid\/id\/(\d+)$/);
  if (!match) return Response.redirect(`${profil}&steam=error`);
  const steamId = match[1];

  // Vérifier que le Steam ID n'est pas déjà utilisé par un autre compte
  const existing = await getUserBySteamId(steamId);
  if (existing && existing.id !== session.userId) {
    return Response.redirect(`${profil}&steam=taken`);
  }

  // Récupération du profil Steam via l'API
  const apiKey = process.env.STEAM_API_KEY;
  if (!apiKey) return Response.redirect(`${profil}&steam=error`);

  const steamRes  = await fetch(
    `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${apiKey}&steamids=${steamId}`
  );
  const steamData = await steamRes.json() as { response: { players: SteamPlayer[] } };
  const player    = steamData.response?.players?.[0];
  if (!player) return Response.redirect(`${profil}&steam=error`);

  await updateUserSteam(session.userId, steamId, player.personaname, player.avatarfull);

  return Response.redirect(`${profil}&steam=success`);
}

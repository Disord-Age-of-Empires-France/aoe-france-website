export async function getDiscordMemberCount(inviteUrl: string): Promise<number | null> {
  try {
    const code = inviteUrl
      .replace(/^https?:\/\/discord(?:\.gg|\.com\/invite)\//, "")
      .split("?")[0]
      .trim();
    if (!code) return null;
    const res = await fetch(
      `https://discord.com/api/v10/invites/${code}?with_counts=true`,
      { next: { revalidate: 3600 }, headers: { "User-Agent": "AOE-France-Website/1.0" } },
    );
    if (!res.ok) return null;
    const data = await res.json() as { approximate_member_count?: number };
    return data.approximate_member_count ?? null;
  } catch {
    return null;
  }
}

export function formatMemberCount(count: number | null, fallback = "4 000+"): string {
  if (!count) return fallback;
  return count.toLocaleString("fr-FR");
}

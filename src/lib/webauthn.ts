export const RP_NAME = "Age of Empires France";

export function getRpId(): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  try { return new URL(siteUrl).hostname; } catch { return "localhost"; }
}

export function getOrigin(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

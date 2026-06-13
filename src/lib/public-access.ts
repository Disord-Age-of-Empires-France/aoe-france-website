import { redirect } from "next/navigation";
import type { SiteSettings } from "./db";
import type { UserRole } from "./session";

type Session = { role: UserRole } | null;

/**
 * Gate a public page behind a feature flag.
 * Admins and editors always pass through.
 * Members and guests are redirected to "/" if `enabled` is false.
 *
 * Pass already-fetched settings + session — no extra DB call.
 */
export function gateFeature(
  settings: SiteSettings,
  session:  Session,
  enabled:  boolean,
): void {
  if (session?.role === "admin" || session?.role === "editor") return;
  if (!enabled) redirect("/");
}

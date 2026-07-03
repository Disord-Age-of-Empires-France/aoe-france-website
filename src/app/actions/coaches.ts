"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { createCoach, updateCoach, deleteCoach } from "@/lib/db";

function parseElo(v: FormDataEntryValue | null): number {
  const n = parseInt(String(v ?? "0"), 10);
  return isNaN(n) ? 0 : Math.max(0, n);
}

function parseCivs(values: FormDataEntryValue[]): string[] {
  return values.map(v => String(v).trim()).filter(Boolean);
}

async function requireAdmin() {
  const session = await getSession();
  if (session?.role !== "admin" && session?.role !== "editor") return null;
  return session;
}

export async function createCoachAction(
  _prev: unknown,
  formData: FormData
): Promise<{ error?: string } | undefined> {
  const session = await requireAdmin();
  if (!session) return { error: "Accès refusé." };

  const pseudoAoe      = (formData.get("pseudoAoe")      as string ?? "").trim();
  const discordName    = (formData.get("discordName")    as string ?? "").trim();
  const rank           = (formData.get("rank")           as string ?? "").trim();
  const elo            = parseElo(formData.get("elo"));
  const civilizations  = parseCivs(formData.getAll("civilizations"));
  const coachingFormat = (formData.get("coachingFormat") as string ?? "").trim();
  const experience     = (formData.get("experience")     as string ?? "").trim();
  const price          = (formData.get("price")          as string ?? "").trim();
  const aoeWorldLink   = (formData.get("aoeWorldLink")   as string ?? "").trim();
  const avatar         = (formData.get("avatar")         as string ?? "").trim();
  const position       = parseInt(formData.get("position") as string ?? "0", 10) || 0;
  const active         = formData.get("active") === "1";

  if (!pseudoAoe)   return { error: "Le pseudo AoE est requis." };
  if (!discordName) return { error: "Le nom Discord est requis." };

  await createCoach({ pseudoAoe, discordName, rank, elo, civilizations, coachingFormat, experience, price, aoeWorldLink, avatar, active, position });
  revalidatePath("/admin/coaching");
  revalidatePath("/coaching");
  redirect("/admin/coaching");
}

export async function updateCoachAction(
  id: string,
  _prev: unknown,
  formData: FormData
): Promise<{ error?: string } | undefined> {
  const session = await requireAdmin();
  if (!session) return { error: "Accès refusé." };

  const pseudoAoe      = (formData.get("pseudoAoe")      as string ?? "").trim();
  const discordName    = (formData.get("discordName")    as string ?? "").trim();
  const rank           = (formData.get("rank")           as string ?? "").trim();
  const elo            = parseElo(formData.get("elo"));
  const civilizations  = parseCivs(formData.getAll("civilizations"));
  const coachingFormat = (formData.get("coachingFormat") as string ?? "").trim();
  const experience     = (formData.get("experience")     as string ?? "").trim();
  const price          = (formData.get("price")          as string ?? "").trim();
  const aoeWorldLink   = (formData.get("aoeWorldLink")   as string ?? "").trim();
  const avatar         = (formData.get("avatar")         as string ?? "").trim();
  const position       = parseInt(formData.get("position") as string ?? "0", 10) || 0;
  const active         = formData.get("active") === "1";

  if (!pseudoAoe)   return { error: "Le pseudo AoE est requis." };
  if (!discordName) return { error: "Le nom Discord est requis." };

  await updateCoach(id, { pseudoAoe, discordName, rank, elo, civilizations, coachingFormat, experience, price, aoeWorldLink, avatar, active, position });
  revalidatePath("/admin/coaching");
  revalidatePath("/coaching");
  redirect("/admin/coaching");
}

export async function deleteCoachAction(id: string): Promise<{ error?: string } | undefined> {
  const session = await requireAdmin();
  if (!session) return { error: "Accès refusé." };
  await deleteCoach(id);
  revalidatePath("/admin/coaching");
  revalidatePath("/coaching");
}

export async function toggleCoachActiveAction(id: string, active: boolean): Promise<void> {
  const session = await requireAdmin();
  if (!session) return;
  await updateCoach(id, { active });
  revalidatePath("/admin/coaching");
  revalidatePath("/coaching");
}

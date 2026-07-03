"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { createStoreLink, updateStoreLink, deleteStoreLink, type StoreType } from "@/lib/db";

function parseStoreType(v: FormDataEntryValue | null): StoreType {
  const valid: StoreType[] = ["steam", "xbox", "ms_store", "ps_store", "game_pass", "other"];
  const s = String(v ?? "other") as StoreType;
  return valid.includes(s) ? s : "other";
}

async function requireEditor() {
  const session = await getSession();
  if (session?.role !== "admin" && session?.role !== "editor") return null;
  return session;
}

export async function createStoreLinkAction(
  _prev: unknown,
  formData: FormData
): Promise<{ error?: string } | undefined> {
  if (!await requireEditor()) return { error: "Accès refusé." };

  const game         = (formData.get("game")         as string ?? "").trim();
  const storeName    = (formData.get("storeName")    as string ?? "").trim();
  const storeType    = parseStoreType(formData.get("storeType"));
  const url          = (formData.get("url")          as string ?? "").trim();
  const badge        = (formData.get("badge")        as string ?? "").trim();
  const priceDisplay = (formData.get("priceDisplay") as string ?? "").trim();
  const isAffiliate  = formData.get("isAffiliate")  === "1";
  const isGamePass   = formData.get("isGamePass")   === "1";
  const active       = formData.get("active")       !== "0";
  const position     = parseInt(formData.get("position") as string ?? "0", 10) || 0;

  if (!game)      return { error: "Le jeu est requis." };
  if (!storeName) return { error: "Le nom du store est requis." };
  if (!url)       return { error: "L'URL est requise." };

  await createStoreLink({ game, storeName, storeType, url, isAffiliate, isGamePass, badge, priceDisplay, active, position });
  revalidatePath("/admin/store");
  revalidatePath("/acheter");
  revalidatePath(`/${game === "aom" ? "aom-retold" : game}/presentation`);
  redirect("/admin/store");
}

export async function updateStoreLinkAction(
  id: string,
  _prev: unknown,
  formData: FormData
): Promise<{ error?: string } | undefined> {
  if (!await requireEditor()) return { error: "Accès refusé." };

  const game         = (formData.get("game")         as string ?? "").trim();
  const storeName    = (formData.get("storeName")    as string ?? "").trim();
  const storeType    = parseStoreType(formData.get("storeType"));
  const url          = (formData.get("url")          as string ?? "").trim();
  const badge        = (formData.get("badge")        as string ?? "").trim();
  const priceDisplay = (formData.get("priceDisplay") as string ?? "").trim();
  const isAffiliate  = formData.get("isAffiliate")  === "1";
  const isGamePass   = formData.get("isGamePass")   === "1";
  const active       = formData.get("active")       !== "0";
  const position     = parseInt(formData.get("position") as string ?? "0", 10) || 0;

  if (!game)      return { error: "Le jeu est requis." };
  if (!storeName) return { error: "Le nom du store est requis." };
  if (!url)       return { error: "L'URL est requise." };

  await updateStoreLink(id, { game, storeName, storeType, url, isAffiliate, isGamePass, badge, priceDisplay, active, position });
  revalidatePath("/admin/store");
  revalidatePath("/acheter");
  revalidatePath(`/${game === "aom" ? "aom-retold" : game}/presentation`);
  redirect("/admin/store");
}

export async function deleteStoreLinkAction(id: string): Promise<{ error?: string } | undefined> {
  if (!await requireEditor()) return { error: "Accès refusé." };
  await deleteStoreLink(id);
  revalidatePath("/admin/store");
  revalidatePath("/acheter");
}

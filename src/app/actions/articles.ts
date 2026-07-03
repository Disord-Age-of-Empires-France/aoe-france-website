"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { createArticle, updateArticle, deleteArticle, updateSettings, getArticle, createLog, getSettings } from "@/lib/db";
import { ARTICLE_CATEGORIES, type ArticleStatus } from "@/lib/categories";
import { getSession } from "@/lib/session";

function parseArticleForm(formData: FormData) {
  const categories = formData.getAll("categories") as string[];
  const firstCat = ARTICLE_CATEGORIES.find(c => c.value === categories[0]);
  return {
    title:       (formData.get("title") as string ?? "").trim(),
    categories,
    badge:       categories[0] ?? "",
    badgeColor:  firstCat?.color ?? "blue",
    description: (formData.get("description") as string ?? "").trim(),
    content:     (formData.get("content") as string ?? "").trim(),
    date:        new Date().toISOString(),
    status:      ((formData.get("status") as string) ?? "draft") as ArticleStatus,
    thumbnail:   (formData.get("thumbnail") as string ?? "").trim(),
    scheduledAt: (formData.get("scheduledAt") as string ?? "").trim() || null,
  };
}

export async function createArticleAction(
  _prev: unknown,
  formData: FormData
): Promise<{ error: string } | undefined> {
  const session = await getSession();
  const data = parseArticleForm(formData);
  if (!data.title) return { error: "Le titre est requis." };
  const article = await createArticle({ ...data, createdBy: session?.username ?? null });
  const logAction = data.status === "draft" && data.scheduledAt ? "article.schedule" : "article.create";
  await createLog({
    userId:   session?.userId ?? null,
    username: session?.username ?? "inconnu",
    role:     session?.role ?? "",
    action:   logAction,
    target:   data.title,
    targetId: article.id,
    meta: {
      status:     data.status,
      categories: data.categories,
      ...(data.scheduledAt ? { scheduledAt: data.scheduledAt } : {}),
    },
  });
  revalidatePath("/");
  revalidatePath("/admin/actualites");
  redirect("/admin/actualites");
}

export async function updateArticleAction(
  id: string,
  _prev: unknown,
  formData: FormData
): Promise<{ error: string } | undefined> {
  const session = await getSession();
  const data = parseArticleForm(formData);
  if (!data.title) return { error: "Le titre est requis." };
  const current = await getArticle(id);
  await updateArticle(id, data);

  let action = "article.update";
  if (current && current.status !== data.status) {
    if      (data.status === "published") action = "article.publish";
    else if (data.status === "archived")  action = "article.archive";
    else                                  action = "article.unpublish";
  } else if (data.status === "draft" && data.scheduledAt && !current?.scheduledAt) {
    action = "article.schedule";
  }

  const meta: Record<string, unknown> = { status: data.status, categories: data.categories };
  if (current && current.status !== data.status) {
    meta.previousStatus = current.status;
  }
  if (data.scheduledAt) meta.scheduledAt = data.scheduledAt;

  await createLog({
    userId:   session?.userId ?? null,
    username: session?.username ?? "inconnu",
    role:     session?.role ?? "",
    action,
    target:   data.title,
    targetId: id,
    meta,
  });
  revalidatePath("/");
  revalidatePath("/admin/actualites");
  redirect("/admin/actualites");
}

export async function deleteArticleAction(id: string): Promise<{ error: string } | undefined> {
  const session = await getSession();
  if (session?.role !== "admin") {
    return { error: "Seuls les administrateurs peuvent supprimer des articles." };
  }
  const article = await getArticle(id);
  await deleteArticle(id);
  await createLog({
    userId:   session.userId,
    username: session.username,
    role:     session.role,
    action:   "article.delete",
    target:   article?.title ?? id,
    targetId: id,
    meta: article ? { categories: article.categories, status: article.status } : undefined,
  });
  revalidatePath("/");
  revalidatePath("/admin/actualites");
}

export async function updateSettingsAction(
  _prev: unknown,
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  const session             = await getSession();
  const discordInvite       = (formData.get("discordInvite") as string ?? "").trim();
  const siteName            = (formData.get("siteName") as string ?? "").trim();
  const maintenance_message = (formData.get("maintenance_message") as string ?? "").trim();
  const maintenance_end     = (formData.get("maintenance_end")     as string ?? "").trim();

  if (!discordInvite) return { success: false, error: "Le lien Discord est requis." };
  if (!siteName)      return { success: false, error: "Le nom du site est requis." };

  const prev = await getSettings();

  const maintenanceMode   = formData.get("maintenance_mode") === "1";
  const featureNews       = formData.get("feature_news")      === "1";
  const featureGuides     = formData.get("feature_guides")    === "1";
  const featureCommunity  = formData.get("feature_community") === "1";
  const featureAoe2       = formData.get("feature_game_aoe2") === "1";
  const featureAoe3       = formData.get("feature_game_aoe3") === "1";
  const featureAoe4       = formData.get("feature_game_aoe4") === "1";
  const featureAom        = formData.get("feature_game_aom")  === "1";
  const featureCoaching   = formData.get("feature_coaching")  === "1";
  const steamAppIdAoe2   = (formData.get("steam_app_id_aoe2") as string ?? "").trim();
  const steamAppIdAoe3   = (formData.get("steam_app_id_aoe3") as string ?? "").trim();
  const steamAppIdAoe4   = (formData.get("steam_app_id_aoe4") as string ?? "").trim();
  const steamAppIdAom    = (formData.get("steam_app_id_aom")  as string ?? "").trim();
  const promoTextAoe2    = (formData.get("promo_text_aoe2")   as string ?? "").trim();
  const promoTextAoe3    = (formData.get("promo_text_aoe3")   as string ?? "").trim();
  const promoTextAoe4    = (formData.get("promo_text_aoe4")   as string ?? "").trim();
  const promoTextAom     = (formData.get("promo_text_aom")    as string ?? "").trim();

  await updateSettings({
    discordInvite,
    siteName,
    maintenance_mode:    maintenanceMode,
    maintenance_message,
    maintenance_end,
    feature_news:       featureNews,
    feature_guides:     featureGuides,
    feature_community:  featureCommunity,
    feature_game_aoe2:  featureAoe2,
    feature_game_aoe3:  featureAoe3,
    feature_game_aoe4:  featureAoe4,
    feature_game_aom:   featureAom,
    feature_coaching:   featureCoaching,
    steam_app_id_aoe2:  steamAppIdAoe2,
    steam_app_id_aoe3:  steamAppIdAoe3,
    steam_app_id_aoe4:  steamAppIdAoe4,
    steam_app_id_aom:   steamAppIdAom,
    promo_text_aoe2:    promoTextAoe2,
    promo_text_aoe3:    promoTextAoe3,
    promo_text_aoe4:    promoTextAoe4,
    promo_text_aom:     promoTextAom,
    navbar_items_aoe2:      formData.getAll("navbar_items_aoe2")      as string[],
    navbar_items_aoe3:      formData.getAll("navbar_items_aoe3")      as string[],
    navbar_items_aoe4:      formData.getAll("navbar_items_aoe4")      as string[],
    navbar_items_aom:       formData.getAll("navbar_items_aom")       as string[],
    navbar_items_news:      formData.getAll("navbar_items_news")      as string[],
    navbar_items_guides:    formData.getAll("navbar_items_guides")    as string[],
    navbar_items_community: formData.getAll("navbar_items_community") as string[],
  });

  // Build a readable diff of what changed
  const changes: string[] = [];
  if (prev.siteName !== siteName) changes.push(`Nom du site : « ${prev.siteName} » → « ${siteName} »`);
  if (prev.discordInvite !== discordInvite) changes.push("Lien Discord modifié");
  if (prev.maintenance.active !== maintenanceMode) changes.push(maintenanceMode ? "Maintenance activée" : "Maintenance désactivée");
  if (prev.features.news      !== featureNews)      changes.push(featureNews      ? "Actualités activées"   : "Actualités désactivées");
  if (prev.features.guides    !== featureGuides)    changes.push(featureGuides    ? "Guides activés"        : "Guides désactivés");
  if (prev.features.community !== featureCommunity) changes.push(featureCommunity ? "Communauté activée"    : "Communauté désactivée");
  if (prev.features.coaching  !== featureCoaching)  changes.push(featureCoaching  ? "Coaching activé"      : "Coaching désactivé");
  if (prev.features.games.aoe2 !== featureAoe2) changes.push(featureAoe2 ? "AoE II activé"  : "AoE II désactivé");
  if (prev.features.games.aoe3 !== featureAoe3) changes.push(featureAoe3 ? "AoE III activé" : "AoE III désactivé");
  if (prev.features.games.aoe4 !== featureAoe4) changes.push(featureAoe4 ? "AoE IV activé"  : "AoE IV désactivé");
  if (prev.features.games.aom  !== featureAom)  changes.push(featureAom  ? "AoM activé"     : "AoM désactivé");

  await createLog({
    userId:   session?.userId ?? null,
    username: session?.username ?? "inconnu",
    role:     session?.role ?? "",
    action:   "settings.update",
    meta:     { changes: changes.length ? changes : ["Navigation mise à jour"] },
  });
  revalidateTag("maintenance", { expire: 0 });
  revalidatePath("/");
  return { success: true };
}

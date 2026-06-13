"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createArticle, updateArticle, deleteArticle, updateSettings, getArticle, createLog } from "@/lib/db";
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
    date:        (formData.get("date") as string) ?? "",
    status:      ((formData.get("status") as string) ?? "draft") as ArticleStatus,
    thumbnail:   (formData.get("thumbnail") as string ?? "").trim(),
  };
}

export async function createArticleAction(
  _prev: unknown,
  formData: FormData
): Promise<{ error: string } | void> {
  const session = await getSession();
  const data = parseArticleForm(formData);
  if (!data.title) return { error: "Le titre est requis." };
  const article = await createArticle(data);
  await createLog({
    userId:   session?.userId ?? null,
    username: session?.username ?? "inconnu",
    role:     session?.role ?? "",
    action:   "article.create",
    target:   data.title,
    targetId: article.id,
  });
  revalidatePath("/");
  revalidatePath("/admin/actualites");
  redirect("/admin/actualites");
}

export async function updateArticleAction(
  id: string,
  _prev: unknown,
  formData: FormData
): Promise<{ error: string } | void> {
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
  }

  await createLog({
    userId:   session?.userId ?? null,
    username: session?.username ?? "inconnu",
    role:     session?.role ?? "",
    action,
    target:   data.title,
    targetId: id,
  });
  revalidatePath("/");
  revalidatePath("/admin/actualites");
  redirect("/admin/actualites");
}

export async function deleteArticleAction(id: string): Promise<{ error: string } | void> {
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
  });
  revalidatePath("/");
  revalidatePath("/admin/actualites");
}

export async function updateSettingsAction(
  _prev: unknown,
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  const session       = await getSession();
  const discordInvite = (formData.get("discordInvite") as string ?? "").trim();
  const siteName      = (formData.get("siteName") as string ?? "").trim();

  if (!discordInvite) return { success: false, error: "Le lien Discord est requis." };
  if (!siteName)      return { success: false, error: "Le nom du site est requis." };

  await updateSettings({
    discordInvite,
    siteName,
    feature_news:       formData.get("feature_news")       === "1",
    feature_guides:     formData.get("feature_guides")     === "1",
    feature_community:  formData.get("feature_community")  === "1",
    feature_game_aoe2:  formData.get("feature_game_aoe2")  === "1",
    feature_game_aoe3:  formData.get("feature_game_aoe3")  === "1",
    feature_game_aoe4:  formData.get("feature_game_aoe4")  === "1",
    feature_game_aom:   formData.get("feature_game_aom")   === "1",
    navbar_items_aoe2:      formData.getAll("navbar_items_aoe2")      as string[],
    navbar_items_aoe3:      formData.getAll("navbar_items_aoe3")      as string[],
    navbar_items_aoe4:      formData.getAll("navbar_items_aoe4")      as string[],
    navbar_items_aom:       formData.getAll("navbar_items_aom")       as string[],
    navbar_items_news:      formData.getAll("navbar_items_news")      as string[],
    navbar_items_guides:    formData.getAll("navbar_items_guides")    as string[],
    navbar_items_community: formData.getAll("navbar_items_community") as string[],
  });
  await createLog({
    userId:   session?.userId ?? null,
    username: session?.username ?? "inconnu",
    role:     session?.role ?? "",
    action:   "settings.update",
  });
  revalidatePath("/");
  return { success: true };
}

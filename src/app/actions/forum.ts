"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import {
  createForumTopic, createForumReply, deleteForumTopic, deleteForumReply,
  toggleForumTopicPin, toggleForumTopicLock, getForumTopic, getForumReply,
  toggleForumReaction, createForumReport, resolveForumReport,
  createForumCategory, updateForumCategory, deleteForumCategory,
  getForumCategory, approveForumTopic, rejectForumTopic,
} from "@/lib/db";

async function requireAuth() {
  const session = await getSession();
  if (!session) throw new Error("Non authentifié");
  return session;
}

async function requireMod() {
  const session = await getSession();
  if (!session || (session.role !== "admin" && session.role !== "editor")) throw new Error("Accès refusé");
  return session;
}

// ─── Topics ──────────────────────────────────────────────────────────────────

export async function createTopicAction(
  _prev: unknown,
  formData: FormData,
): Promise<{ error?: string }> {
  const session = await requireAuth().catch(() => null);
  if (!session) return { error: "Vous devez être connecté pour poster." };

  const categorySlug = (formData.get("categorySlug") as string ?? "").trim();
  const title   = ((formData.get("title")   as string) ?? "").trim().slice(0, 200);
  const content = ((formData.get("content") as string) ?? "").trim().slice(0, 20000);

  if (!title)   return { error: "Le titre est obligatoire." };
  if (title.length < 5) return { error: "Le titre doit faire au moins 5 caractères." };
  if (!content) return { error: "Le contenu est obligatoire." };
  if (content.length < 10) return { error: "Le message doit faire au moins 10 caractères." };

  const category = await getForumCategory(categorySlug);
  if (!category) return { error: "Catégorie introuvable." };

  const isMod = session.role === "admin" || session.role === "editor";
  const status = isMod ? "approved" : "pending" as const;

  const id = randomUUID();
  await createForumTopic({ id, categoryId: category.id, userId: session.userId, title, content, status });

  if (status === "approved") {
    redirect(`/forum/${categorySlug}/${id}`);
  } else {
    redirect(`/forum/${categorySlug}?submitted=1`);
  }
}

export async function createReplyAction(
  _prev: unknown,
  formData: FormData,
): Promise<{ error?: string }> {
  const session = await requireAuth().catch(() => null);
  if (!session) return { error: "Vous devez être connecté pour répondre." };

  const topicId = ((formData.get("topicId") as string) ?? "").trim();
  const content = ((formData.get("content") as string) ?? "").trim().slice(0, 20000);

  if (!content || content.length < 2) return { error: "La réponse est trop courte." };

  const topic = await getForumTopic(topicId);
  if (!topic) return { error: "Sujet introuvable." };
  if (topic.locked && session.role === "member") return { error: "Ce sujet est verrouillé." };

  await createForumReply({ id: randomUUID(), topicId, userId: session.userId, content });
  revalidatePath(`/forum/${topic.categorySlug}/${topicId}`);
  return {};
}

export async function deleteTopicAction(topicId: string, reason: string): Promise<{ error?: string }> {
  const session = await requireAuth().catch(() => null);
  if (!session) return { error: "Non authentifié." };

  const topic = await getForumTopic(topicId);
  if (!topic) return { error: "Sujet introuvable." };

  const isMod = session.role === "admin" || session.role === "editor";
  const canDelete = isMod || session.userId === topic.userId;
  if (!canDelete) return { error: "Accès refusé." };

  const slug = topic.categorySlug;
  await deleteForumTopic(topicId, reason);
  revalidatePath(`/forum/${slug}`);
  redirect(`/forum/${slug}`);
}

export async function deleteReplyAction(replyId: string): Promise<{ error?: string }> {
  const session = await requireAuth().catch(() => null);
  if (!session) return { error: "Non authentifié." };

  const reply = await getForumReply(replyId);
  if (!reply) return { error: "Réponse introuvable." };

  const canDelete = session.role === "admin" || session.role === "editor" || session.userId === reply.userId;
  if (!canDelete) return { error: "Accès refusé." };

  await deleteForumReply(replyId);
  const topic = await getForumTopic(reply.topicId);
  if (topic) revalidatePath(`/forum/${topic.categorySlug}/${reply.topicId}`);
  return {};
}

// ─── Modération ───────────────────────────────────────────────────────────────

export async function togglePinAction(topicId: string): Promise<{ error?: string }> {
  await requireMod().catch(() => null);
  const topic = await getForumTopic(topicId);
  if (!topic) return { error: "Sujet introuvable." };
  await toggleForumTopicPin(topicId);
  revalidatePath(`/forum/${topic.categorySlug}`);
  revalidatePath(`/forum/${topic.categorySlug}/${topicId}`);
  return {};
}

export async function toggleLockAction(topicId: string): Promise<{ error?: string }> {
  await requireMod().catch(() => null);
  const topic = await getForumTopic(topicId);
  if (!topic) return { error: "Sujet introuvable." };
  await toggleForumTopicLock(topicId);
  revalidatePath(`/forum/${topic.categorySlug}/${topicId}`);
  return {};
}

// ─── Réactions ────────────────────────────────────────────────────────────────

export async function toggleReactionAction(
  targetId: string,
  targetType: "topic" | "reply",
  emoji: string,
): Promise<{ error?: string }> {
  const session = await requireAuth().catch(() => null);
  if (!session) return { error: "Connectez-vous pour réagir." };
  const ALLOWED = ["👍", "❤️", "😂", "🔥", "👀"];
  if (!ALLOWED.includes(emoji)) return { error: "Emoji non autorisé." };
  await toggleForumReaction(targetId, targetType, session.userId, emoji);
  return {};
}

// ─── Signalements ─────────────────────────────────────────────────────────────

export async function reportPostAction(
  targetId: string,
  targetType: "topic" | "reply",
  reason: string,
): Promise<{ error?: string }> {
  const session = await requireAuth().catch(() => null);
  if (!session) return { error: "Connectez-vous pour signaler." };
  if (!reason.trim()) return { error: "Précisez la raison du signalement." };
  await createForumReport({ targetId, targetType, userId: session.userId, reason: reason.trim().slice(0, 500) });
  return {};
}

export async function resolveReportAction(reportId: string): Promise<void> {
  await requireMod();
  await resolveForumReport(reportId);
  revalidatePath("/admin/forum/signalements");
}

// ─── Admin : catégories ───────────────────────────────────────────────────────

export async function createCategoryAction(
  _prev: unknown,
  formData: FormData,
): Promise<{ error?: string }> {
  await requireMod();
  const slug        = (formData.get("slug")        as string).trim().toLowerCase().replace(/[^a-z0-9-]/g, "-");
  const name        = (formData.get("name")        as string).trim().slice(0, 80);
  const description = (formData.get("description") as string).trim().slice(0, 300);
  const color       = (formData.get("color")       as string).trim();
  const icon        = (formData.get("icon")        as string).trim().slice(0, 10);
  const position    = parseInt(formData.get("position") as string, 10) || 0;

  if (!slug || !name) return { error: "Slug et nom sont obligatoires." };
  await createForumCategory({ id: randomUUID(), slug, name, description, color, icon, position });
  revalidatePath("/forum");
  revalidatePath("/admin/forum");
  redirect("/admin/forum");
}

export async function updateCategoryAction(
  id: string,
  _prev: unknown,
  formData: FormData,
): Promise<{ error?: string }> {
  await requireMod();
  const slug        = (formData.get("slug")        as string).trim().toLowerCase().replace(/[^a-z0-9-]/g, "-");
  const name        = (formData.get("name")        as string).trim().slice(0, 80);
  const description = (formData.get("description") as string).trim().slice(0, 300);
  const color       = (formData.get("color")       as string).trim();
  const icon        = (formData.get("icon")        as string).trim().slice(0, 10);
  const position    = parseInt(formData.get("position") as string, 10) || 0;

  if (!slug || !name) return { error: "Slug et nom sont obligatoires." };
  await updateForumCategory(id, { slug, name, description, color, icon, position });
  revalidatePath("/forum");
  revalidatePath("/admin/forum");
  return {};
}

export async function deleteCategoryAction(id: string): Promise<{ error?: string }> {
  await requireMod().catch(() => null);
  await deleteForumCategory(id);
  revalidatePath("/forum");
  revalidatePath("/admin/forum");
  return {};
}

// ─── Modération : validation des sujets ──────────────────────────────────────

export async function approveTopicAction(topicId: string): Promise<{ error?: string }> {
  await requireMod();
  const topic = await getForumTopic(topicId);
  if (!topic) return { error: "Sujet introuvable." };
  await approveForumTopic(topicId);
  revalidatePath(`/forum/${topic.categorySlug}`);
  revalidatePath(`/forum/${topic.categorySlug}/${topicId}`);
  revalidatePath("/admin/forum/moderation");
  return {};
}

export async function rejectTopicAction(topicId: string, reason: string): Promise<{ error?: string }> {
  await requireMod();
  const topic = await getForumTopic(topicId);
  if (!topic) return { error: "Sujet introuvable." };
  await rejectForumTopic(topicId, reason);
  revalidatePath(`/forum/${topic.categorySlug}`);
  revalidatePath("/admin/forum/moderation");
  return {};
}

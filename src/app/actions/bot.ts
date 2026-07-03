"use server";

import { redirect } from "next/navigation";
import { requireAdminAccess } from "@/lib/auth-check";
import {
  createBotCommand,
  updateBotCommand,
  deleteBotCommand,
  getBotCommand,
  createLog,
  type BotCommandField,
} from "@/lib/db";

type State = { error: string } | undefined;

function parseFields(raw: FormDataEntryValue | null): BotCommandField[] {
  try { return JSON.parse(String(raw ?? "[]")); } catch { return []; }
}

function extractData(formData: FormData) {
  return {
    name:               String(formData.get("name")               ?? "").trim(),
    usage:              String(formData.get("usage")              ?? "").trim(),
    description:        String(formData.get("description")        ?? "").trim(),
    category:           String(formData.get("category")           ?? "Général").trim(),
    previewTitle:       String(formData.get("previewTitle")       ?? "").trim(),
    previewColor:       String(formData.get("previewColor")       ?? "#5865f2").trim(),
    previewDescription: String(formData.get("previewDescription") ?? "").trim(),
    previewFields:      parseFields(formData.get("previewFields")),
    previewFooter:      String(formData.get("previewFooter")      ?? "").trim(),
    hasImage:           formData.get("hasImage") === "1",
    imageUrl:           String(formData.get("imageUrl")           ?? "").trim(),
    orderIndex:         Number(formData.get("orderIndex") ?? 0),
  };
}

export async function createBotCommandAction(_: State, formData: FormData): Promise<State> {
  const session = await requireAdminAccess();
  const data    = extractData(formData);
  if (!data.name) return { error: "Le nom de la commande est requis." };

  const cmd = await createBotCommand(data);
  await createLog({
    userId:   session.userId,
    username: session.username,
    role:     session.role,
    action:   "bot.command_create",
    target:   `/${data.name}`,
    targetId: cmd.id,
    meta:     { category: data.category, ...(data.description ? { description: data.description.slice(0, 80) } : {}) },
  });
  redirect("/admin/parametres?tab=bot");
}

export async function updateBotCommandAction(id: string, _: State, formData: FormData): Promise<State> {
  const session = await requireAdminAccess();
  const data    = extractData(formData);
  if (!data.name) return { error: "Le nom de la commande est requis." };

  await updateBotCommand(id, data);
  await createLog({
    userId:   session.userId,
    username: session.username,
    role:     session.role,
    action:   "bot.command_update",
    target:   `/${data.name}`,
    targetId: id,
    meta:     { category: data.category },
  });
  redirect("/admin/parametres?tab=bot");
}

export async function deleteBotCommandAction(id: string): Promise<void> {
  const session = await requireAdminAccess();
  const cmd     = await getBotCommand(id);

  await deleteBotCommand(id);
  await createLog({
    userId:   session.userId,
    username: session.username,
    role:     session.role,
    action:   "bot.command_delete",
    target:   cmd ? `/${cmd.name}` : undefined,
    targetId: id,
  });
  redirect("/admin/parametres?tab=bot");
}

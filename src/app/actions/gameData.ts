"use server";

import { getSession } from "@/lib/session";
import { syncGame } from "@/lib/game-data";
import { revalidatePath } from "next/cache";

export async function syncGameDataAction(game: string): Promise<{ error?: string; count?: number }> {
  const session = await getSession();
  if (!session || session.role !== "admin") return { error: "Accès refusé." };

  const result = await syncGame(game);
  if (!result.success) return { error: result.error ?? "Erreur inconnue." };

  revalidatePath(`/${game === "aom" ? "aom-retold" : game}/civilisations`);
  revalidatePath("/admin/game-data");
  return { count: result.count };
}

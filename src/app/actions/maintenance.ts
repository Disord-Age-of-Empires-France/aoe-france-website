"use server";

import { revalidateTag } from "next/cache";
import { updateSettings } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function disableMaintenanceAction() {
  // Vérifie que le timer a bien expiré (ou que c'est un admin qui désactive)
  const session = await getSession();
  const isAdmin = session?.role === "admin";

  const settings = await import("@/lib/db").then((m) => m.getSettings());
  const expired =
    settings.maintenance.endAt &&
    new Date(settings.maintenance.endAt).getTime() <= Date.now();

  if (!isAdmin && !expired) return;

  await updateSettings({ maintenance_mode: false, maintenance_end: "" });
  revalidateTag("maintenance", { expire: 0 });
}

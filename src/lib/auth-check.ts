import { redirect } from "next/navigation";
import { getSession, getPending2FA } from "@/lib/session";
import { getUser } from "@/lib/db";
import type { UserRole } from "@/lib/session";

interface BOSession {
  userId:   string;
  username: string;
  role:     UserRole;
}

// À appeler au début de chaque page admin (pas dans le layout — le layout
// ne se re-exécute pas côté serveur lors des navigations douces).
export async function requireBOAccess(): Promise<BOSession> {
  const session = await getSession();
  if (!session) {
    // Si un pending 2FA existe, renvoyer vers la page de vérification
    const pending = await getPending2FA();
    if (pending) redirect("/2fa");
    redirect("/admin/login");
  }

  const user = await getUser(session.userId);
  if (!user || user.role === "member") redirect("/force-logout");

  // Rôle changé en base (promotion ou changement admin ↔ editor) : re-émettre le JWT
  if (user.role !== session.role) redirect("/session-refresh");

  return session;
}

export async function requireAdminAccess(): Promise<BOSession> {
  const session = await requireBOAccess();
  if (session.role !== "admin") redirect("/admin");
  return session;
}

// Accessible à tout utilisateur connecté, quel que soit son rôle.
export async function requireSelfAccess(): Promise<BOSession> {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  const user = await getUser(session.userId);
  if (!user) redirect("/force-logout");
  if (user.role !== session.role) redirect("/session-refresh");
  return session;
}

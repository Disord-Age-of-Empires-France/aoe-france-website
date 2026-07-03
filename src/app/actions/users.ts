"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSession, destroySession, type UserRole } from "@/lib/session";
import {
  createUser, updateUser, updateUserSteam, updateUserXbox, deleteUser, getUser,
  getUserByUsername, countAdminUsers, createLog,
} from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/password";

function parseRole(v: FormDataEntryValue | null): UserRole {
  if (v === "admin")  return "admin";
  if (v === "editor") return "editor";
  return "member";
}

// ─── Create ───────────────────────────────────────────────────────────────────

export async function createUserAction(
  _prev: unknown,
  formData: FormData
): Promise<{ error: string } | undefined> {
  const session = await getSession();
  if (session?.role !== "admin") return { error: "Accès refusé." };

  const username    = (formData.get("username")        as string).trim();
  const displayName = (formData.get("displayName")     as string).trim();
  const email       = (formData.get("email")           as string).trim();
  const role        = parseRole(formData.get("role"));
  const password    = (formData.get("password")        as string);
  const confirm     = (formData.get("confirmPassword") as string);

  if (!username)            return { error: "Le nom d'utilisateur est requis." };
  if (!password)            return { error: "Le mot de passe est requis." };
  if (password.length < 8)  return { error: "Le mot de passe doit faire au moins 8 caractères." };
  if (password !== confirm)  return { error: "Les mots de passe ne correspondent pas." };

  const existing = await getUserByUsername(username);
  if (existing) return { error: "Ce nom d'utilisateur est déjà utilisé." };

  await createUser({ username, passwordHash: hashPassword(password), displayName, email, role });
  await createLog({
    userId:   session?.userId ?? null,
    username: session?.username ?? "inconnu",
    role:     session?.role ?? "",
    action:   "user.create",
    target:   username,
    meta:     { role, ...(email ? { email } : {}) },
  });
  revalidatePath("/admin/utilisateurs");
  redirect("/admin/utilisateurs");
}

// ─── Update ───────────────────────────────────────────────────────────────────

export async function updateUserAction(
  id: string,
  _prev: unknown,
  formData: FormData
): Promise<{ error: string } | undefined> {
  const session = await getSession();
  if (session?.role !== "admin") return { error: "Accès refusé." };

  const username    = (formData.get("username")        as string).trim();
  const displayName = (formData.get("displayName")     as string).trim();
  const email       = (formData.get("email")           as string).trim();
  const role        = parseRole(formData.get("role"));
  const password    = (formData.get("password")        as string);
  const confirm     = (formData.get("confirmPassword") as string);

  if (!username) return { error: "Le nom d'utilisateur est requis." };

  if (password) {
    if (password.length < 8)  return { error: "Le mot de passe doit faire au moins 8 caractères." };
    if (password !== confirm)  return { error: "Les mots de passe ne correspondent pas." };
  }

  const conflict = await getUserByUsername(username);
  if (conflict && conflict.id !== id) return { error: "Ce nom d'utilisateur est déjà utilisé." };

  const currentUser = await getUser(id);

  // Prevent removing the last admin
  if (role !== "admin" && currentUser?.role === "admin" && (await countAdminUsers()) <= 1) {
    return { error: "Impossible de rétrograder le dernier administrateur." };
  }

  const updates: Parameters<typeof updateUser>[1] = { username, displayName, email, role };
  if (password) updates.passwordHash = hashPassword(password);

  await updateUser(id, updates);

  const logBase = {
    userId:   session?.userId ?? null,
    username: session?.username ?? "inconnu",
    role:     session?.role ?? "",
    targetId: id,
  };

  if (currentUser && currentUser.role !== role) {
    await createLog({
      ...logBase,
      action: "user.role_change",
      target: username,
      meta:   { from: currentUser.role, to: role },
    });
  } else {
    await createLog({ ...logBase, action: "user.update", target: username });
  }

  revalidatePath("/admin/utilisateurs");
  redirect("/admin/utilisateurs");
}

// ─── Delete ───────────────────────────────────────────────────────────────────

export async function deleteUserAction(id: string): Promise<{ error: string } | undefined> {
  const session = await getSession();
  if (session?.role !== "admin") return { error: "Accès refusé." };
  if (session.userId === id)     return { error: "Vous ne pouvez pas supprimer votre propre compte." };

  const user = await getUser(id);
  if (user?.role === "admin" && (await countAdminUsers()) <= 1) {
    return { error: "Impossible de supprimer le dernier administrateur." };
  }

  await deleteUser(id);
  await createLog({
    userId:   session.userId,
    username: session.username,
    role:     session.role,
    action:   "user.delete",
    target:   user?.username ?? id,
    targetId: id,
    meta:     user ? { role: user.role } : undefined,
  });
  revalidatePath("/admin/utilisateurs");
}

// ─── Profile (self) ───────────────────────────────────────────────────────────

const DISPLAY_NAME_COOLDOWN_DAYS = 120;

export async function updateProfileAction(
  _prev: unknown,
  formData: FormData
): Promise<{ success?: boolean; error?: string }> {
  const session = await getSession();
  if (!session) return { error: "Non authentifié." };

  const displayName = (formData.get("displayName") as string).trim();
  const avatar      = (formData.get("avatar")      as string).trim();
  const bio         = (formData.get("bio")         as string).slice(0, 280);
  const location    = (formData.get("location")    as string).trim();
  const currentPw   = (formData.get("currentPassword") as string);
  const newPw       = (formData.get("newPassword")     as string);
  const confirmPw   = (formData.get("confirmPassword") as string);

  const rawLinks = [0, 1, 2].map((i) => ({
    type: (formData.get(`socialType${i}`) as string ?? "").trim(),
    url:  (formData.get(`socialUrl${i}`)  as string ?? "").trim(),
  })).filter((l) => l.type && l.url);
  const socialLinks   = JSON.stringify(rawLinks);
  const profilePublic = formData.get("profile_public") === "1" ? "1" : "0";

  const user = await getUser(session.userId);
  if (!user) return { error: "Utilisateur introuvable." };

  const updates: Parameters<typeof updateUser>[1] = { displayName, avatar, bio, location, socialLinks, profilePublic };

  // Cooldown on display name changes
  if (displayName !== user.displayName) {
    if (user.displayNameChangedAt) {
      const nextAllowed = new Date(
        new Date(user.displayNameChangedAt).getTime() + DISPLAY_NAME_COOLDOWN_DAYS * 24 * 60 * 60 * 1000
      );
      if (new Date() < nextAllowed) {
        const formatted = nextAllowed.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
        return { error: `Vous ne pouvez pas changer votre nom affiché avant le ${formatted}.` };
      }
    }
    updates.displayNameChangedAt = new Date().toISOString();
  }

  if (newPw) {
    if (!currentPw)                       return { error: "Le mot de passe actuel est requis." };
    if (newPw.length < 12)                return { error: "Le mot de passe doit contenir au moins 12 caractères." };
    if (!/[A-Z]/.test(newPw))            return { error: "Le mot de passe doit contenir au moins une lettre majuscule." };
    if (!/[a-z]/.test(newPw))            return { error: "Le mot de passe doit contenir au moins une lettre minuscule." };
    if (!/[0-9]/.test(newPw))            return { error: "Le mot de passe doit contenir au moins un chiffre." };
    if (!/[^A-Za-z0-9]/.test(newPw))     return { error: "Le mot de passe doit contenir au moins un caractère spécial." };
    if (newPw !== confirmPw)              return { error: "Les nouveaux mots de passe ne correspondent pas." };
    if (!verifyPassword(currentPw, user.passwordHash)) {
      await new Promise((r) => setTimeout(r, 500));
      return { error: "Mot de passe actuel incorrect." };
    }
    updates.passwordHash = hashPassword(newPw);
  }

  await updateUser(session.userId, updates);
  revalidatePath("/profil");
  revalidatePath("/admin/profil");
  return { success: true };
}

// ─── Steam ────────────────────────────────────────────────────────────────────

export async function steamUnlinkAction(): Promise<{ error?: string }> {
  const session = await getSession();
  if (!session) return { error: "Non authentifié." };
  await updateUserSteam(session.userId, null, "", "");
  revalidatePath("/profil");
  return {};
}

export async function xboxSaveAction(gamertag: string): Promise<{ error?: string }> {
  const session = await getSession();
  if (!session) return { error: "Non authentifié." };
  const clean = gamertag.trim().slice(0, 52);
  if (!clean) return { error: "Gamertag invalide." };
  await updateUserXbox(session.userId, clean, clean, "");
  revalidatePath("/profil");
  return {};
}

export async function xboxUnlinkAction(): Promise<{ error?: string }> {
  const session = await getSession();
  if (!session) return { error: "Non authentifié." };
  await updateUserXbox(session.userId, null, "", "");
  revalidatePath("/profil");
  return {};
}

// ─── Delete own account ───────────────────────────────────────────────────────

export async function deleteOwnAccountAction(): Promise<{ error: string } | undefined> {
  const session = await getSession();
  if (!session) return { error: "Non authentifié." };

  const user = await getUser(session.userId);
  if (!user) return { error: "Compte introuvable." };

  if (user.role === "admin" && (await countAdminUsers()) <= 1) {
    return { error: "Impossible de supprimer le dernier compte administrateur." };
  }

  await createLog({
    userId:   session.userId,
    username: session.username,
    role:     session.role,
    action:   "user.delete_self",
    target:   session.username,
    targetId: session.userId,
  });
  await deleteUser(session.userId);
  await destroySession();
  redirect("/");
}

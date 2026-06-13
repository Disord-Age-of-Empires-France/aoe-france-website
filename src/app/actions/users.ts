"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSession, type UserRole } from "@/lib/session";
import {
  createUser, updateUser, deleteUser, getUser,
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
): Promise<{ error: string } | void> {
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
  });
  revalidatePath("/admin/utilisateurs");
  redirect("/admin/utilisateurs");
}

// ─── Update ───────────────────────────────────────────────────────────────────

export async function updateUserAction(
  id: string,
  _prev: unknown,
  formData: FormData
): Promise<{ error: string } | void> {
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
      target: `${username}: ${currentUser.role} → ${role}`,
    });
  } else {
    await createLog({ ...logBase, action: "user.update", target: username });
  }

  revalidatePath("/admin/utilisateurs");
  redirect("/admin/utilisateurs");
}

// ─── Delete ───────────────────────────────────────────────────────────────────

export async function deleteUserAction(id: string): Promise<{ error: string } | void> {
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
  });
  revalidatePath("/admin/utilisateurs");
}

// ─── Profile (self) ───────────────────────────────────────────────────────────

export async function updateProfileAction(
  _prev: unknown,
  formData: FormData
): Promise<{ success?: boolean; error?: string }> {
  const session = await getSession();
  if (!session) return { error: "Non authentifié." };

  const displayName = (formData.get("displayName")     as string).trim();
  const email       = (formData.get("email")           as string).trim();
  const currentPw   = (formData.get("currentPassword") as string);
  const newPw       = (formData.get("newPassword")     as string);
  const confirmPw   = (formData.get("confirmPassword") as string);

  const updates: Parameters<typeof updateUser>[1] = { displayName, email };

  if (newPw) {
    if (!currentPw)           return { error: "Le mot de passe actuel est requis." };
    if (newPw.length < 8)     return { error: "Le nouveau mot de passe doit faire au moins 8 caractères." };
    if (newPw !== confirmPw)  return { error: "Les nouveaux mots de passe ne correspondent pas." };

    const user = await getUser(session.userId);
    if (!user || !verifyPassword(currentPw, user.passwordHash)) {
      await new Promise((r) => setTimeout(r, 500));
      return { error: "Mot de passe actuel incorrect." };
    }
    updates.passwordHash = hashPassword(newPw);
  }

  await updateUser(session.userId, updates);
  revalidatePath("/admin/profil");
  return { success: true };
}

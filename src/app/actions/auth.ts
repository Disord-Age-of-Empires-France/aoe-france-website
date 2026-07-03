"use server";

import { redirect } from "next/navigation";
import { createSession, destroySession, getSession, createPending2FA, getTrustedDeviceToken } from "@/lib/session";
import { getUserByUsername, updateUserLastLogin, createLog, getUser, isTrustedDevice, getWebAuthnCredentials } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { hashDeviceToken } from "@/lib/totp";

export async function login(
  _prev: unknown,
  formData: FormData
): Promise<{ error: string } | undefined> {
  const username = ((formData.get("username") as string) ?? "").trim();
  const password  =  (formData.get("password") as string) ?? "";

  const user  = await getUserByUsername(username);
  const valid = user ? verifyPassword(password, user.passwordHash) : false;

  if (!user || !valid) {
    await new Promise((r) => setTimeout(r, 1000));
    return { error: "Identifiants incorrects." };
  }

  // Vérifier si la 2FA est requise (TOTP ou clé de sécurité)
  const webAuthnCreds = await getWebAuthnCredentials(user.id);
  const needs2FA = user.totpEnabled || webAuthnCreds.length > 0;

  if (needs2FA) {
    // L'appareil est-il déjà de confiance ?
    const deviceToken = await getTrustedDeviceToken();
    if (deviceToken) {
      const trusted = await isTrustedDevice(user.id, hashDeviceToken(deviceToken));
      if (trusted) {
        await createSession({ userId: user.id, username: user.username, role: user.role });
        await updateUserLastLogin(user.id);
        await createLog({ userId: user.id, username: user.username, role: user.role, action: "auth.login.trusted" });
        redirect(user.role === "member" ? "/profil" : "/admin");
      }
    }
    await createPending2FA(user.id);
    redirect("/2fa");
  }

  await createSession({ userId: user.id, username: user.username, role: user.role });
  await updateUserLastLogin(user.id);
  await createLog({
    userId:   user.id,
    username: user.username,
    role:     user.role,
    action:   "auth.login",
  });
  redirect(user.role === "member" ? "/profil" : "/admin");
}

export async function refreshSession(): Promise<void> {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  const user = await getUser(session.userId);
  if (!user) redirect("/force-logout");

  await createSession({ userId: user.id, username: user.username, role: user.role });
  redirect(user.role === "member" ? "/profil" : "/admin");
}

export async function logout(): Promise<void> {
  const session = await getSession();
  if (session) {
    await createLog({
      userId:   session.userId,
      username: session.username,
      role:     session.role,
      action:   "auth.logout",
    });
  }
  await destroySession();
  redirect("/admin/login");
}

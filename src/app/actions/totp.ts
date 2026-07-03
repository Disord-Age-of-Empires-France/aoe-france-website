"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import {
  getPending2FA, destroyPending2FA, createSession,
  setTrustedDeviceCookie, getTrustedDeviceToken,
} from "@/lib/session";
import {
  getUser, enableTOTP, disableTOTP, updateTOTPBackupCodes,
  storePendingTOTPSecret, createTrustedDevice, isTrustedDevice,
  deleteAllTrustedDevices, createLog, updateUserLastLogin,
} from "@/lib/db";
import {
  generateTOTPSecret, generateQRCodeDataURL, verifyTOTP,
  generateBackupCodes, verifyBackupCode, generateDeviceToken, hashDeviceToken,
} from "@/lib/totp";

// ── Étape 1 : générer le secret + QR code (retourné au composant client) ───────

export async function initTOTPSetupAction(): Promise<
  { error: string } | { qrCode: string; secret: string }
> {
  const session = await getSession();
  if (!session) return { error: "Non authentifié." };

  const user = await getUser(session.userId);
  if (!user) return { error: "Utilisateur introuvable." };
  if (user.totpEnabled) return { error: "La 2FA est déjà activée." };

  const { secret, otpauthUrl } = generateTOTPSecret(user.username);
  await storePendingTOTPSecret(user.id, secret);
  const qrCode = await generateQRCodeDataURL(otpauthUrl);

  return { qrCode, secret };
}

// ── Étape 2 : confirmer avec le premier code → activer + générer backup codes ──

export async function confirmTOTPSetupAction(
  _prev: unknown,
  formData: FormData,
): Promise<{ error: string } | { backupCodes: string[] }> {
  const session = await getSession();
  if (!session) return { error: "Non authentifié." };

  const user = await getUser(session.userId);
  if (!user || !user.totpSecret) return { error: "Aucune configuration 2FA en cours." };

  const code = ((formData.get("code") as string) ?? "").replace(/\s/g, "");
  if (!verifyTOTP(user.totpSecret, code)) {
    return { error: "Code incorrect. Vérifiez votre application d'authentification." };
  }

  const { plain, hashed } = generateBackupCodes();
  await enableTOTP(user.id, user.totpSecret, hashed);
  await createLog({ userId: user.id, username: user.username, role: user.role, action: "auth.2fa.enable" });

  return { backupCodes: plain };
}

// ── Désactiver la 2FA (requiert le code TOTP ou un backup code actuel) ──────────

export async function disableTOTPAction(
  _prev: unknown,
  formData: FormData,
): Promise<{ error: string } | { success: true }> {
  const session = await getSession();
  if (!session) return { error: "Non authentifié." };

  const user = await getUser(session.userId);
  if (!user || !user.totpEnabled || !user.totpSecret) return { error: "La 2FA n'est pas activée." };

  const code = ((formData.get("code") as string) ?? "").replace(/\s/g, "");
  const validTotp = verifyTOTP(user.totpSecret, code);

  if (!validTotp) {
    const { valid, remaining } = verifyBackupCode(code, user.totpBackupCodes);
    if (!valid) return { error: "Code incorrect." };
    await updateTOTPBackupCodes(user.id, remaining);
  }

  await disableTOTP(user.id);
  await deleteAllTrustedDevices(user.id);
  await createLog({ userId: user.id, username: user.username, role: user.role, action: "auth.2fa.disable" });

  return { success: true };
}

// ── Vérification 2FA au login (page /2fa) ────────────────────────────────────

export async function verify2FAAction(
  _prev: unknown,
  formData: FormData,
): Promise<{ error: string } | undefined> {
  const pending = await getPending2FA();
  if (!pending) redirect("/connexion");

  const user = await getUser(pending.userId);
  if (!user || !user.totpEnabled || !user.totpSecret) redirect("/connexion");

  const code           = ((formData.get("code") as string) ?? "").replace(/\s/g, "");
  const rememberDevice = formData.get("remember_device") === "1";

  let valid = verifyTOTP(user.totpSecret, code);

  if (!valid) {
    const result = verifyBackupCode(code, user.totpBackupCodes);
    if (result.valid) {
      valid = true;
      await updateTOTPBackupCodes(user.id, result.remaining);
    }
  }

  if (!valid) {
    await new Promise(r => setTimeout(r, 600));
    return { error: "Code incorrect. Vérifiez votre application ou utilisez un code de secours." };
  }

  await destroyPending2FA();
  await createSession({ userId: user.id, username: user.username, role: user.role });
  await updateUserLastLogin(user.id);
  await createLog({ userId: user.id, username: user.username, role: user.role, action: "auth.2fa.login" });

  if (rememberDevice) {
    const { plain, hash } = generateDeviceToken();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const reqHeaders = await headers();
    const userAgent  = reqHeaders.get("user-agent") ?? "";
    await createTrustedDevice(user.id, hash, expiresAt, userAgent);
    await setTrustedDeviceCookie(plain);
  }

  redirect(user.role === "member" ? "/profil" : "/admin");
}

// ── Reset 2FA par un admin (depuis la page utilisateur) ────────────────────────

export async function adminReset2FAAction(
  _prev: unknown,
  formData: FormData,
): Promise<{ error: string } | { success: true }> {
  const session = await getSession();
  if (!session || session.role !== "admin") return { error: "Non autorisé." };

  const targetId = (formData.get("userId") as string) ?? "";
  const user     = await getUser(targetId);
  if (!user) return { error: "Utilisateur introuvable." };

  await disableTOTP(targetId);
  await deleteAllTrustedDevices(targetId);
  await createLog({
    userId:   session.userId,
    username: session.username,
    role:     session.role,
    action:   "admin.2fa.reset",
    target:   user.username,
  });

  return { success: true };
}

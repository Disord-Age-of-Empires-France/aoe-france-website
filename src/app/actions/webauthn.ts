"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from "@simplewebauthn/server";
import type {
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
  AuthenticatorTransportFuture,
} from "@simplewebauthn/server";
import {
  getSession, getPending2FA, destroyPending2FA, createSession,
  setWebAuthnChallenge, getAndClearWebAuthnChallenge, setTrustedDeviceCookie,
} from "@/lib/session";
import {
  getUser, getWebAuthnCredentials, getWebAuthnCredentialByCredentialId,
  createWebAuthnCredential, updateWebAuthnCredentialCounter,
  renameWebAuthnCredential, deleteWebAuthnCredential, deleteAllWebAuthnCredentials,
  createTrustedDevice, createLog, updateUserLastLogin,
} from "@/lib/db";
import { getRpId, getOrigin, RP_NAME } from "@/lib/webauthn";
import { generateDeviceToken, hashDeviceToken } from "@/lib/totp";

// ── Enregistrement : étape 1 — générer les options ────────────────────────────

export async function initWebAuthnRegistrationAction(): Promise<
  { error: string } | { options: PublicKeyCredentialCreationOptionsJSON }
> {
  const session = await getSession();
  if (!session) return { error: "Non authentifié." };

  const user = await getUser(session.userId);
  if (!user) return { error: "Utilisateur introuvable." };

  const existingCreds = await getWebAuthnCredentials(user.id);

  const options = await generateRegistrationOptions({
    rpName:          RP_NAME,
    rpID:            getRpId(),
    userName:        user.username,
    userDisplayName: user.displayName || user.username,
    userID:          Buffer.from(user.id),
    attestationType: "none",
    authenticatorSelection: {
      residentKey:             "preferred",
      userVerification:        "preferred",
      authenticatorAttachment: "cross-platform",
    },
    excludeCredentials: existingCreds.map(c => ({
      id:         c.credentialId,
      transports: c.transports as AuthenticatorTransportFuture[],
    })),
  });

  await setWebAuthnChallenge(options.challenge);

  return { options };
}

// ── Enregistrement : étape 2 — vérifier + stocker ────────────────────────────

export async function verifyWebAuthnRegistrationAction(
  credentialJSON: string,
  name: string,
): Promise<{ error: string } | { success: true }> {
  const session = await getSession();
  if (!session) return { error: "Non authentifié." };

  const challenge = await getAndClearWebAuthnChallenge();
  if (!challenge) return { error: "Session expirée. Réessayez." };

  let credential: RegistrationResponseJSON;
  try { credential = JSON.parse(credentialJSON); } catch { return { error: "Réponse invalide." }; }

  let verification;
  try {
    verification = await verifyRegistrationResponse({
      response:          credential,
      expectedChallenge: challenge,
      expectedOrigin:    getOrigin(),
      expectedRPID:      getRpId(),
    });
  } catch (err) {
    return { error: `Vérification échouée : ${(err as Error).message}` };
  }

  if (!verification.verified || !verification.registrationInfo) {
    return { error: "Clé non vérifiée." };
  }

  const { credential: cred, credentialDeviceType, credentialBackedUp } = verification.registrationInfo;

  await createWebAuthnCredential({
    userId:       session.userId,
    name:         name.trim() || "Clé de sécurité",
    credentialId: cred.id,
    publicKey:    Buffer.from(cred.publicKey).toString("base64url"),
    counter:      cred.counter,
    deviceType:   credentialDeviceType,
    backedUp:     credentialBackedUp,
    transports:   (cred.transports ?? []) as string[],
  });

  await createLog({
    userId:   session.userId,
    username: session.username,
    role:     session.role,
    action:   "auth.webauthn.register",
    meta:     { name: name.trim() || "Clé de sécurité" },
  });

  return { success: true };
}

// ── Authentification : étape 1 — générer le challenge ────────────────────────

export async function initWebAuthnAuthAction(): Promise<
  { error: string } | { options: PublicKeyCredentialRequestOptionsJSON }
> {
  const pending = await getPending2FA();
  if (!pending) return { error: "Session expirée. Reconnectez-vous." };

  const creds = await getWebAuthnCredentials(pending.userId);
  if (creds.length === 0) return { error: "Aucune clé de sécurité enregistrée." };

  const options = await generateAuthenticationOptions({
    rpID: getRpId(),
    allowCredentials: creds.map(c => ({
      id:         c.credentialId,
      transports: c.transports as AuthenticatorTransportFuture[],
    })),
    userVerification: "preferred",
  });

  await setWebAuthnChallenge(options.challenge);

  return { options };
}

// ── Authentification : étape 2 — vérifier + créer la session ─────────────────

export async function verifyWebAuthnAuthAction(
  credentialJSON: string,
  rememberDevice = false,
): Promise<{ error: string } | undefined> {
  const pending = await getPending2FA();
  if (!pending) redirect("/connexion");

  const user = await getUser(pending.userId);
  if (!user) redirect("/connexion");

  const challenge = await getAndClearWebAuthnChallenge();
  if (!challenge) return { error: "Session expirée. Réessayez." };

  let credential: AuthenticationResponseJSON;
  try { credential = JSON.parse(credentialJSON); } catch { return { error: "Réponse invalide." }; }

  const storedCred = await getWebAuthnCredentialByCredentialId(credential.id);
  if (!storedCred || storedCred.userId !== user.id) {
    return { error: "Clé non reconnue." };
  }

  let verification;
  try {
    verification = await verifyAuthenticationResponse({
      response:          credential,
      expectedChallenge: challenge,
      expectedOrigin:    getOrigin(),
      expectedRPID:      getRpId(),
      credential: {
        id:         storedCred.credentialId,
        publicKey:  Buffer.from(storedCred.publicKey, "base64url"),
        counter:    storedCred.counter,
        transports: storedCred.transports as AuthenticatorTransportFuture[],
      },
    });
  } catch (err) {
    return { error: `Vérification échouée : ${(err as Error).message}` };
  }

  if (!verification.verified) return { error: "Clé non vérifiée." };

  await updateWebAuthnCredentialCounter(storedCred.id, verification.authenticationInfo.newCounter);
  await destroyPending2FA();
  await createSession({ userId: user.id, username: user.username, role: user.role });
  await updateUserLastLogin(user.id);
  await createLog({ userId: user.id, username: user.username, role: user.role, action: "auth.webauthn.login" });

  if (rememberDevice) {
    const { plain, hash } = generateDeviceToken();
    const expiresAt  = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const reqHeaders = await headers();
    const userAgent  = reqHeaders.get("user-agent") ?? "";
    await createTrustedDevice(user.id, hash, expiresAt, userAgent);
    await setTrustedDeviceCookie(plain);
  }

  redirect(user.role === "member" ? "/profil" : "/admin");
}

// ── Supprimer une clé (depuis le profil) ─────────────────────────────────────

export async function removeWebAuthnCredentialAction(
  _prev: unknown,
  formData: FormData,
): Promise<{ error: string } | { success: true }> {
  const session = await getSession();
  if (!session) return { error: "Non authentifié." };

  const credId = (formData.get("credId") as string) ?? "";
  if (!credId) return { error: "Identifiant manquant." };

  await deleteWebAuthnCredential(credId, session.userId);
  await createLog({
    userId:   session.userId,
    username: session.username,
    role:     session.role,
    action:   "auth.webauthn.remove",
  });

  return { success: true };
}

// ── Renommer une clé (depuis le profil) ──────────────────────────────────────

export async function renameWebAuthnCredentialAction(
  _prev: unknown,
  formData: FormData,
): Promise<{ error: string } | { success: true }> {
  const session = await getSession();
  if (!session) return { error: "Non authentifié." };

  const credId = (formData.get("credId") as string) ?? "";
  const name   = ((formData.get("name") as string) ?? "").trim();
  if (!credId || !name) return { error: "Données manquantes." };

  await renameWebAuthnCredential(credId, session.userId, name);
  return { success: true };
}

// ── Reset WebAuthn par un admin ───────────────────────────────────────────────

export async function adminResetWebAuthnAction(
  _prev: unknown,
  formData: FormData,
): Promise<{ error: string } | { success: true }> {
  const session = await getSession();
  if (!session || session.role !== "admin") return { error: "Non autorisé." };

  const targetId = (formData.get("userId") as string) ?? "";
  const user     = await getUser(targetId);
  if (!user) return { error: "Utilisateur introuvable." };

  await deleteAllWebAuthnCredentials(targetId);
  await createLog({
    userId:   session.userId,
    username: session.username,
    role:     session.role,
    action:   "admin.webauthn.reset",
    target:   user.username,
  });

  return { success: true };
}

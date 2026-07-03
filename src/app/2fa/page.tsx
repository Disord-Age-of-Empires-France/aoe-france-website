import { redirect } from "next/navigation";
import { getPending2FA } from "@/lib/session";
import { getUser, getWebAuthnCredentials } from "@/lib/db";
import TwoFAClient from "./TwoFAClient";

export const metadata = { title: "Vérification en deux étapes" };

export default async function TwoFAPage() {
  const pending = await getPending2FA();
  if (!pending) redirect("/connexion");

  const user = await getUser(pending.userId);
  if (!user) redirect("/connexion");

  const webAuthnCreds = await getWebAuthnCredentials(user.id);

  const hasTOTP     = user.totpEnabled;
  const hasWebAuthn = webAuthnCreds.length > 0;

  if (!hasTOTP && !hasWebAuthn) redirect("/connexion");

  return <TwoFAClient hasTOTP={hasTOTP} hasWebAuthn={hasWebAuthn} />;
}

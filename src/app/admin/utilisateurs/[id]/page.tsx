import { notFound } from "next/navigation";
import { ArrowLeft, ShieldCheck, ShieldOff } from "lucide-react";
import Link from "next/link";
import { getUser, getWebAuthnCredentials } from "@/lib/db";
import { requireAdminAccess } from "@/lib/auth-check";
import { updateUserAction } from "@/app/actions/users";
import UserForm from "@/components/admin/UserForm";
import Reset2FA from "@/components/admin/Reset2FA";
import ResetWebAuthn from "@/components/admin/ResetWebAuthn";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const user = await getUser(id);
  return { title: user ? `Modifier : ${user.username}` : "Utilisateur introuvable" };
}

export default async function EditUserPage({ params }: Props) {
  const { id } = await params;
  const [user, session, webAuthnCreds] = await Promise.all([getUser(id), requireAdminAccess(), getWebAuthnCredentials(id)]);
  if (!user) notFound();

  const boundAction = updateUserAction.bind(null, id);
  const isSelf = session?.userId === id;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/utilisateurs"
          className="inline-flex items-center gap-1.5 text-faint hover:text-foreground text-sm mb-4 transition-colors"
        >
          <ArrowLeft size={14} />
          Retour aux utilisateurs
        </Link>
        <h1 className="text-2xl font-bold text-foreground tracking-wide">Modifier l&apos;utilisateur</h1>
        <p className="text-faint text-sm mt-1">@{user.username}</p>
      </div>

      <div className="bg-surface border border-border-site rounded-lg p-6">
        <UserForm action={boundAction} user={user} mode="edit" isSelf={isSelf} />
      </div>

      {/* Sécurité 2FA */}
      <div className="bg-surface border border-border-site rounded-lg p-6 space-y-4">
        <h2 className="text-sm font-bold text-foreground tracking-wide">Double authentification</h2>

        {/* TOTP */}
        <div className="flex items-center gap-3">
          {user.totpEnabled ? (
            <>
              <div className="flex items-center gap-2 text-sm text-emerald-400">
                <ShieldCheck size={15} />
                Code TOTP actif
              </div>
              {!isSelf && (
                <Reset2FA userId={user.id} username={user.username} />
              )}
            </>
          ) : (
            <div className="flex items-center gap-2 text-sm text-faint">
              <ShieldOff size={15} />
              Pas de code TOTP
            </div>
          )}
        </div>

        {/* WebAuthn */}
        <div className="flex items-center gap-3">
          {webAuthnCreds.length > 0 ? (
            <>
              <div className="flex items-center gap-2 text-sm text-emerald-400">
                <ShieldCheck size={15} />
                {webAuthnCreds.length} clé{webAuthnCreds.length > 1 ? "s" : ""} de sécurité enregistrée{webAuthnCreds.length > 1 ? "s" : ""}
              </div>
              {!isSelf && (
                <ResetWebAuthn userId={user.id} username={user.username} />
              )}
            </>
          ) : (
            <div className="flex items-center gap-2 text-sm text-faint">
              <ShieldOff size={15} />
              Aucune clé de sécurité
            </div>
          )}
        </div>

        {isSelf && (user.totpEnabled || webAuthnCreds.length > 0) && (
          <p className="text-xs text-faint">Pour gérer votre propre 2FA, rendez-vous dans <Link href="/profil?tab=profil" className="text-[#c8a32e] hover:underline">Mon profil</Link>.</p>
        )}
      </div>
    </div>
  );
}

"use client";

import { useActionState } from "react";
import { Save, CheckCircle, AlertCircle } from "lucide-react";
import { updateProfileAction } from "@/app/actions/users";
import type { User } from "@/lib/db";

interface Props {
  user: User;
}

const INPUT = "w-full bg-background border border-border-site focus:border-[#c8a32e] focus:outline-none rounded px-4 py-3 text-foreground placeholder-faint text-sm transition-colors disabled:opacity-60";

export default function ProfileForm({ user }: Props) {
  const [state, action, pending] = useActionState(updateProfileAction, undefined);

  return (
    <form action={action} className="space-y-6">
      {state?.success && (
        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 rounded px-4 py-3 text-emerald-400 text-sm">
          <CheckCircle size={15} />
          Profil mis à jour.
        </div>
      )}
      {state?.error && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded px-4 py-3 text-red-400 text-sm">
          <AlertCircle size={15} />
          {state.error}
        </div>
      )}

      {/* Informations */}
      <div className="bg-surface border border-border-site rounded-lg p-6 space-y-5">
        <h2 className="font-bold text-foreground text-sm tracking-wide border-b border-border-site pb-4">
          Informations
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold tracking-wider text-muted uppercase">
              Identifiant
            </label>
            <div className="px-4 py-3 bg-surface-3 border border-border-site rounded text-sm text-faint">
              {user.username}
              <span className="ml-2 text-[11px] text-faint">(non modifiable)</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold tracking-wider text-muted uppercase">
              Rôle
            </label>
            <div className="px-4 py-3 bg-surface-3 border border-border-site rounded text-sm text-faint">
              {user.role === "admin" ? "Administrateur" : "Éditeur"}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold tracking-wider text-muted uppercase">
              Nom affiché
            </label>
            <input
              name="displayName"
              type="text"
              defaultValue={user.displayName}
              disabled={pending}
              className={INPUT}
              placeholder="Prénom Nom"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold tracking-wider text-muted uppercase">
              Email
            </label>
            <input
              name="email"
              type="email"
              defaultValue={user.email}
              disabled={pending}
              className={INPUT}
              placeholder="email@exemple.com"
            />
          </div>
        </div>
      </div>

      {/* Changer le mot de passe */}
      <div className="bg-surface border border-border-site rounded-lg p-6 space-y-5">
        <h2 className="font-bold text-foreground text-sm tracking-wide border-b border-border-site pb-4">
          Changer le mot de passe
          <span className="ml-2 text-faint text-xs font-normal normal-case">(optionnel)</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold tracking-wider text-muted uppercase">
              Mot de passe actuel
            </label>
            <input
              name="currentPassword"
              type="password"
              autoComplete="current-password"
              disabled={pending}
              className={INPUT}
              placeholder="••••••••"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold tracking-wider text-muted uppercase">
              Nouveau mot de passe
            </label>
            <input
              name="newPassword"
              type="password"
              autoComplete="new-password"
              minLength={8}
              disabled={pending}
              className={INPUT}
              placeholder="Min. 8 caractères"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold tracking-wider text-muted uppercase">
              Confirmer
            </label>
            <input
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              disabled={pending}
              className={INPUT}
              placeholder="••••••••"
            />
          </div>
        </div>
      </div>

      <div>
        <button
          type="submit"
          disabled={pending}
          className="flex items-center gap-2 bg-[#c8a32e] hover:bg-[#b8922a] disabled:opacity-60 disabled:cursor-not-allowed text-[#080e1a] font-bold text-sm tracking-wider px-6 py-3 rounded transition-colors"
        >
          <Save size={15} />
          {pending ? "Enregistrement…" : "ENREGISTRER"}
        </button>
      </div>
    </form>
  );
}

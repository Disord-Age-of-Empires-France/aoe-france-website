"use client";

import { useActionState, useState } from "react";
import { Save, ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { User } from "@/lib/db";
import DiscordIcon from "@/components/DiscordIcon";
import CustomSelect from "./CustomSelect";

const ROLE_OPTIONS = [
  { value: "admin",  label: "Administrateur", description: "Accès complet" },
  { value: "editor", label: "Éditeur",        description: "Articles uniquement" },
  { value: "member", label: "Membre",          description: "Accès public (Discord)" },
] as const;

type State = { error: string } | undefined;
type Action = (prev: State, formData: FormData) => Promise<State>;

interface Props {
  action: Action;
  user?: User;
  mode: "create" | "edit";
  isSelf?: boolean;
}

const INPUT = "w-full bg-background border border-border-site focus:border-[#c8a32e] focus:outline-none rounded px-4 py-3 text-foreground placeholder-faint text-sm transition-colors disabled:opacity-60";

const ROLE_SELECT = ROLE_OPTIONS.map((o) => ({ value: o.value, label: o.label, description: o.description }));

export default function UserForm({ action, user, mode, isSelf = false }: Props) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const [roleValue, setRoleValue] = useState<string>(user?.role ?? "editor");

  return (
    <form action={formAction} className="space-y-6">
      {state?.error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded px-4 py-3 text-red-400 text-sm">
          {state.error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Username */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold tracking-wider text-muted uppercase">
            Identifiant <span className="text-red-400">*</span>
          </label>
          <input
            name="username"
            type="text"
            required
            autoComplete="off"
            defaultValue={user?.username ?? ""}
            disabled={pending}
            className={INPUT}
            placeholder="username"
          />
        </div>

        {/* Display name */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold tracking-wider text-muted uppercase">
            Nom affiché
          </label>
          <input
            name="displayName"
            type="text"
            defaultValue={user?.displayName ?? ""}
            disabled={pending}
            className={INPUT}
            placeholder="Prénom Nom"
          />
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold tracking-wider text-muted uppercase">
            Email
          </label>
          <input
            name="email"
            type="email"
            defaultValue={user?.email ?? ""}
            disabled={pending}
            className={INPUT}
            placeholder="email@exemple.com"
          />
        </div>

        {/* Role */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold tracking-wider text-muted uppercase">
            Rôle
          </label>
          {isSelf ? (
            <div className="px-4 py-3 bg-surface-3 border border-border-site rounded text-sm text-faint">
              {user?.role === "admin" ? "Administrateur" : user?.role === "member" ? "Membre" : "Éditeur"}
              <span className="ml-2 text-[11px] text-faint">(non modifiable sur votre propre compte)</span>
            </div>
          ) : (
            <CustomSelect
              name="role"
              value={roleValue}
              onChange={setRoleValue}
              options={ROLE_SELECT}
              disabled={pending}
            />
          )}
        </div>

        {/* Discord ID — read only, only when set */}
        {mode === "edit" && user?.discordId && (
          <div className="md:col-span-2 space-y-1.5">
            <label className="block text-xs font-semibold tracking-wider text-muted uppercase">
              Identifiant Discord
            </label>
            <div className="flex items-center gap-2 px-4 py-3 bg-background border border-indigo-900/40 rounded">
              <DiscordIcon size={14} className="text-indigo-400 shrink-0" />
              <span className="text-indigo-300 text-sm font-mono select-all">{user.discordId}</span>
              <span className="ml-auto text-[11px] text-faint">(non modifiable)</span>
            </div>
          </div>
        )}

        {/* Password */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold tracking-wider text-muted uppercase">
            Mot de passe {mode === "edit" && <span className="text-faint normal-case font-normal">(laisser vide pour ne pas modifier)</span>}
            {mode === "create" && <span className="text-red-400"> *</span>}
          </label>
          <input
            name="password"
            type="password"
            autoComplete="new-password"
            required={mode === "create"}
            minLength={8}
            disabled={pending}
            className={INPUT}
            placeholder={mode === "create" ? "Min. 8 caractères" : "••••••••"}
          />
        </div>

        {/* Confirm password */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold tracking-wider text-muted uppercase">
            Confirmer le mot de passe
            {mode === "create" && <span className="text-red-400"> *</span>}
          </label>
          <input
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required={mode === "create"}
            disabled={pending}
            className={INPUT}
            placeholder="••••••••"
          />
        </div>
      </div>

      <div className="flex items-center gap-4 pt-2 border-t border-border-site">
        <button
          type="submit"
          disabled={pending}
          className="flex items-center gap-2 bg-[#c8a32e] hover:bg-[#b8922a] disabled:opacity-60 disabled:cursor-not-allowed text-[#080e1a] font-bold text-sm tracking-wider px-6 py-3 rounded transition-colors"
        >
          <Save size={15} />
          {pending ? "Enregistrement…" : mode === "create" ? "CRÉER L'UTILISATEUR" : "ENREGISTRER"}
        </button>
        <Link
          href="/admin/utilisateurs"
          className="flex items-center gap-2 text-muted hover:text-foreground text-sm font-medium transition-colors"
        >
          <ArrowLeft size={15} />
          Annuler
        </Link>
      </div>
    </form>
  );
}

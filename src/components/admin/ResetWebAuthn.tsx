"use client";

import { useActionState } from "react";
import { Key, Loader2, Check, AlertCircle } from "lucide-react";
import { adminResetWebAuthnAction } from "@/app/actions/webauthn";

interface Props {
  userId:   string;
  username: string;
}

export default function ResetWebAuthn({ userId, username }: Props) {
  const [state, action, pending] = useActionState(adminResetWebAuthnAction, undefined);

  if (state && "success" in state) {
    return (
      <div className="flex items-center gap-2 text-emerald-400 text-sm bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-4 py-3">
        <Check size={14} />
        Clés supprimées pour @{username}.
      </div>
    );
  }

  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="userId" value={userId} />
      {state && "error" in state && (
        <div className="flex items-center gap-2 text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
          <AlertCircle size={12} /> {state.error}
        </div>
      )}
      <button
        type="submit"
        disabled={pending}
        className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-semibold hover:bg-red-500/15 disabled:opacity-50 transition-colors"
      >
        {pending ? <Loader2 size={14} className="animate-spin" /> : <Key size={14} />}
        Supprimer les clés
      </button>
    </form>
  );
}

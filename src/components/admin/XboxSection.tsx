"use client";

import { useState, useTransition } from "react";
import { ExternalLink, Unlink, Check, X } from "lucide-react";
import { xboxSaveAction, xboxUnlinkAction } from "@/app/actions/users";

interface Props {
  xboxId:       string | null;
  xboxGamertag: string;
  xboxAvatar:   string;
}

export function XboxLogo({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="white" aria-hidden>
      <path d="M16 2C8.3 2 2 8.3 2 16s6.3 14 14 14 14-6.3 14-14S23.7 2 16 2zm-4.5 4.8c1.3.3 3.5 1.8 4.5 2.8 1-1 3.2-2.5 4.5-2.8 2.7 1.6 4.5 4.5 4.8 7.8-1.2 2.1-4.8 6.5-9.3 8.8-4.5-2.3-8.1-6.7-9.3-8.8.3-3.3 2.1-6.2 4.8-7.8z"/>
    </svg>
  );
}

export default function XboxSection({ xboxId, xboxGamertag }: Props) {
  const [linked,   setLinked]   = useState(!!xboxId);
  const [gamertag, setGamertag] = useState(xboxGamertag);
  const [editing,  setEditing]  = useState(false);
  const [input,    setInput]    = useState("");
  const [error,    setError]    = useState("");
  const [pending, startTransition] = useTransition();

  function startEdit() { setInput(gamertag); setEditing(true); setError(""); }
  function cancelEdit() { setEditing(false); setError(""); }

  function save() {
    if (!input.trim()) { setError("Gamertag invalide."); return; }
    startTransition(async () => {
      const result = await xboxSaveAction(input.trim());
      if (result?.error) { setError(result.error); return; }
      setGamertag(input.trim());
      setLinked(true);
      setEditing(false);
      setError("");
    });
  }

  function unlink() {
    startTransition(async () => {
      const result = await xboxUnlinkAction();
      if (!result?.error) { setLinked(false); setGamertag(""); setEditing(false); }
    });
  }

  return (
    <div className="flex items-center justify-between gap-4 p-3 bg-background border border-border-site rounded-lg">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* Icône Xbox */}
        <div className="w-8 h-8 rounded-md bg-[#107c10] flex items-center justify-center shrink-0">
          <XboxLogo />
        </div>

        {editing ? (
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <input
              type="text"
              value={input}
              onChange={e => { setInput(e.target.value); setError(""); }}
              onKeyDown={e => { if (e.key === "Enter") save(); if (e.key === "Escape") cancelEdit(); }}
              placeholder="Votre Gamertag Xbox"
              maxLength={52}
              autoFocus
              className="flex-1 min-w-0 bg-surface border border-[#107c10]/50 focus:border-[#107c10] focus:outline-none rounded px-3 py-1.5 text-sm text-foreground placeholder-faint transition-colors"
            />
            {error && <p className="text-[11px] text-red-400 shrink-0">{error}</p>}
          </div>
        ) : linked ? (
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground leading-tight">{gamertag}</p>
            <a
              href={`https://www.xbox.com/fr-FR/play/user/${encodeURIComponent(gamertag)}`}
              target="_blank" rel="noopener noreferrer"
              className="text-[11px] text-faint hover:text-[#c8a32e] transition-colors flex items-center gap-1"
            >
              <ExternalLink size={10} /> Voir le profil Xbox
            </a>
          </div>
        ) : (
          <div>
            <p className="text-sm font-semibold text-foreground">Xbox</p>
            <p className="text-[11px] text-faint">Non connecté</p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 shrink-0">
        {editing ? (
          <>
            <button type="button" onClick={save} disabled={pending}
              className="flex items-center gap-1 px-3 py-1.5 rounded border border-[#107c10]/40 bg-[#107c10]/10 text-[#4caf50] text-xs font-semibold hover:bg-[#107c10]/20 transition-colors disabled:opacity-50">
              <Check size={11} /> Enregistrer
            </button>
            <button type="button" onClick={cancelEdit} disabled={pending}
              className="p-1.5 rounded border border-border-site text-faint hover:text-foreground transition-colors">
              <X size={12} />
            </button>
          </>
        ) : linked ? (
          <>
            <button type="button" onClick={startEdit} disabled={pending}
              className="px-3 py-1.5 rounded border border-border-site text-faint text-xs font-semibold hover:text-foreground transition-colors disabled:opacity-50">
              Modifier
            </button>
            <button type="button" onClick={unlink} disabled={pending}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-red-500/30 text-red-400 text-xs font-semibold hover:bg-red-500/10 transition-colors disabled:opacity-50">
              <Unlink size={11} /> Délier
            </button>
          </>
        ) : (
          <button type="button" onClick={startEdit} disabled={pending}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-[#107c10]/60 bg-[#107c10]/10 text-[#4caf50] text-xs font-semibold hover:bg-[#107c10]/20 transition-colors">
            <XboxLogo className="w-3.5 h-3.5" /> Ajouter
          </button>
        )}
      </div>
    </div>
  );
}

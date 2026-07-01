"use client";

import { useState, useTransition } from "react";
import { Trash2, TriangleAlert, X } from "lucide-react";
import { deleteOwnAccountAction } from "@/app/actions/users";

interface Props {
  username: string;
}

export default function DeleteAccountSection({ username }: Props) {
  const [showModal, setShowModal]     = useState(false);
  const [pending, startTransition]    = useTransition();
  const [error, setError]             = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState("");

  const confirmed = confirmation === username;

  function handleOpen() {
    setConfirmation("");
    setError(null);
    setShowModal(true);
  }

  function handleClose() {
    if (pending) return;
    setShowModal(false);
    setConfirmation("");
    setError(null);
  }

  function handleConfirm() {
    if (!confirmed) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteOwnAccountAction();
      if (result?.error) setError(result.error);
    });
  }

  return (
    <>
      <div className="bg-surface border border-red-900/30 rounded-lg p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-red-400 mb-1">Supprimer mon compte</h3>
            <p className="text-xs text-faint leading-relaxed">
              Supprime définitivement votre compte et toutes vos données. Cette action est irréversible.
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpen}
            className="shrink-0 flex items-center gap-2 border border-red-800/50 text-red-400 hover:bg-red-500/10 hover:border-red-600/60 text-sm font-semibold px-4 py-2 rounded transition-colors"
          >
            <Trash2 size={14} />
            Supprimer
          </button>
        </div>
      </div>

      {showModal && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-[2px] p-4"
          onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
        >
          <div className="bg-surface border border-border-site rounded-xl shadow-2xl w-full max-w-md">

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-border-site">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center justify-center shrink-0">
                  <TriangleAlert size={17} className="text-red-400" />
                </div>
                <h2 className="font-black text-foreground tracking-tight">Supprimer mon compte</h2>
              </div>
              <button
                type="button"
                onClick={handleClose}
                disabled={pending}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-faint hover:text-foreground hover:bg-surface-2 transition-colors disabled:opacity-40"
              >
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4">
              <div className="bg-red-500/8 border border-red-500/20 rounded-lg px-4 py-3 space-y-1">
                <p className="text-sm font-bold text-red-400">Cette action est irréversible</p>
                <p className="text-xs text-red-400/70 leading-relaxed">
                  Votre compte, votre profil et toutes vos données seront supprimés définitivement.
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-xs text-muted leading-relaxed">
                  Tapez votre nom d&apos;utilisateur{" "}
                  <span className="font-mono font-bold text-foreground">@{username}</span>{" "}
                  pour confirmer
                </label>
                <input
                  type="text"
                  value={confirmation}
                  onChange={(e) => setConfirmation(e.target.value)}
                  disabled={pending}
                  placeholder={username}
                  autoFocus
                  autoComplete="off"
                  className="w-full bg-background border border-border-site focus:border-red-500/60 focus:outline-none rounded px-4 py-2.5 text-foreground placeholder-faint text-sm transition-colors disabled:opacity-60 font-mono"
                />
              </div>

              {error && (
                <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded px-3 py-2">
                  {error}
                </p>
              )}
            </div>

            {/* Footer */}
            <div className="flex gap-3 px-6 pb-6">
              <button
                type="button"
                onClick={handleClose}
                disabled={pending}
                className="flex-1 border border-border-site text-muted hover:text-foreground hover:border-muted/40 text-sm font-semibold py-2.5 rounded transition-colors disabled:opacity-40"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={!confirmed || pending}
                className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm py-2.5 rounded transition-colors"
              >
                <Trash2 size={14} />
                {pending ? "Suppression…" : "Supprimer définitivement"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

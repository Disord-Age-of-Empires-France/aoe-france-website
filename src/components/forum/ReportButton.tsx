"use client";

import { useState, useTransition } from "react";
import { Flag, X } from "lucide-react";
import { reportPostAction } from "@/app/actions/forum";

interface Props {
  targetId:      string;
  targetType:    "topic" | "reply";
  currentUserId?: string;
}

export default function ReportButton({ targetId, targetType, currentUserId }: Props) {
  const [open,    setOpen]    = useState(false);
  const [reason,  setReason]  = useState("");
  const [success, setSuccess] = useState(false);
  const [error,   setError]   = useState("");
  const [pending, start]      = useTransition();

  function handleOpen() {
    if (!currentUserId) {
      window.dispatchEvent(new CustomEvent("open-login"));
      return;
    }
    setOpen(true);
  }

  function close() {
    setOpen(false);
    setReason("");
    setError("");
    setSuccess(false);
  }

  function submit() {
    if (!reason.trim()) { setError("Veuillez préciser la raison."); return; }
    start(async () => {
      const res = await reportPostAction(targetId, targetType, reason);
      if (res.error) { setError(res.error); return; }
      setSuccess(true);
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        title="Signaler ce contenu"
        className="flex items-center gap-1 text-[11px] text-faint hover:text-red-400 transition-colors"
      >
        <Flag size={11} />
        Signaler
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-surface border border-border-site rounded-xl shadow-xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border-site">
              <div className="flex items-center gap-2">
                <Flag size={16} className="text-red-400" />
                <span className="font-semibold text-foreground text-sm">Signaler ce contenu</span>
              </div>
              <button type="button" onClick={close} className="text-faint hover:text-foreground">
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {success ? (
                <div className="text-center py-4 space-y-2">
                  <p className="text-sm font-semibold text-foreground">Signalement envoyé</p>
                  <p className="text-xs text-faint">Les modérateurs examineront ce contenu.</p>
                  <button
                    type="button"
                    onClick={close}
                    className="mt-3 px-4 py-2 rounded-lg bg-surface-2 text-sm text-muted hover:text-foreground transition-colors"
                  >
                    Fermer
                  </button>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-muted mb-1.5">
                      Raison du signalement
                    </label>
                    <textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value.slice(0, 500))}
                      placeholder="Décrivez pourquoi ce contenu est problématique…"
                      rows={4}
                      className="w-full px-3 py-2 rounded-lg border border-border-site bg-background text-sm text-foreground placeholder-faint resize-none focus:outline-none focus:border-[#c8a32e]/50"
                    />
                    <div className="flex justify-between mt-1">
                      {error && <p className="text-xs text-red-400">{error}</p>}
                      <span className="text-[10px] text-faint ml-auto">{reason.length}/500</span>
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end">
                    <button
                      type="button"
                      onClick={close}
                      className="px-4 py-2 rounded-lg text-sm text-muted hover:text-foreground border border-border-site hover:border-border-site/80 transition-colors"
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      onClick={submit}
                      disabled={pending || !reason.trim()}
                      className="px-4 py-2 rounded-lg text-sm font-semibold bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {pending ? "Envoi…" : "Signaler"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

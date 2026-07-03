"use client";

import { useState, useTransition } from "react";
import { Pin, PinOff, Lock, Unlock, Trash2, X } from "lucide-react";
import { togglePinAction, toggleLockAction, deleteTopicAction, deleteReplyAction } from "@/app/actions/forum";

// ─── Topic moderation ─────────────────────────────────────────────────────────

interface TopicModProps {
  topicId: string;
  pinned:  boolean;
  locked:  boolean;
  canMod:  boolean;
  canDelete: boolean;
}

export function TopicModBar({ topicId, pinned, locked, canMod, canDelete }: TopicModProps) {
  const [, start] = useTransition();
  const [showModal, setShowModal] = useState(false);

  if (!canMod && !canDelete) return null;

  function handlePin()  { start(async () => { await togglePinAction(topicId); }); }
  function handleLock() { start(async () => { await toggleLockAction(topicId); }); }

  function handleDelete() {
    if (canMod) {
      setShowModal(true);
    } else {
      if (!confirm("Supprimer ce sujet ?")) return;
      start(async () => { await deleteTopicAction(topicId, ""); });
    }
  }

  return (
    <>
      <div className="flex items-center gap-1">
        {canMod && (
          <>
            <button type="button" onClick={handlePin} title={pinned ? "Désépingler" : "Épingler"}
              className="p-1.5 rounded text-faint hover:text-[#c8a32e] hover:bg-[#c8a32e]/10 transition-colors">
              {pinned ? <PinOff size={14} /> : <Pin size={14} />}
            </button>
            <button type="button" onClick={handleLock} title={locked ? "Déverrouiller" : "Verrouiller"}
              className="p-1.5 rounded text-faint hover:text-amber-400 hover:bg-amber-400/10 transition-colors">
              {locked ? <Unlock size={14} /> : <Lock size={14} />}
            </button>
          </>
        )}
        {canDelete && (
          <button type="button" onClick={handleDelete} title={canMod ? "Désactiver le sujet" : "Supprimer le sujet"}
            className="p-1.5 rounded text-faint hover:text-red-400 hover:bg-red-500/10 transition-colors">
            <Trash2 size={14} />
          </button>
        )}
      </div>

      {showModal && (
        <DeleteTopicModal topicId={topicId} onClose={() => setShowModal(false)} />
      )}
    </>
  );
}

function DeleteTopicModal({ topicId, onClose }: { topicId: string; onClose: () => void }) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [pending, startDelete] = useTransition();

  function handleSubmit() {
    const trimmed = reason.trim();
    if (!trimmed) { setError("La raison est obligatoire."); return; }
    startDelete(async () => { await deleteTopicAction(topicId, trimmed); });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-surface border border-border-site rounded-xl p-6 w-full max-w-md mx-4 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-foreground">Désactiver ce sujet</h2>
          <button type="button" onClick={onClose} className="p-1 rounded text-faint hover:text-foreground transition-colors">
            <X size={16} />
          </button>
        </div>
        <p className="text-sm text-muted mb-4">
          Le sujet sera masqué du public mais conservé dans la base. Précisez la raison.
        </p>
        <textarea
          value={reason}
          onChange={(e) => { setReason(e.target.value); setError(""); }}
          placeholder="Ex : Contenu non conforme aux règles du forum…"
          rows={3}
          className="w-full bg-background border border-border-site rounded-lg px-3 py-2 text-sm text-foreground resize-none focus:outline-none focus:border-[#c8a32e]/50"
        />
        {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
        <div className="flex items-center justify-end gap-2 mt-4">
          <button type="button" onClick={onClose} disabled={pending}
            className="px-4 py-2 rounded-lg border border-border-site text-muted hover:text-foreground text-sm transition-colors disabled:opacity-50">
            Annuler
          </button>
          <button type="button" onClick={handleSubmit} disabled={pending}
            className="px-4 py-2 rounded-lg bg-red-500/15 text-red-400 hover:bg-red-500/25 text-sm font-semibold transition-colors disabled:opacity-50">
            {pending ? "Désactivation…" : "Désactiver"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Reply delete ─────────────────────────────────────────────────────────────

export function DeleteReplyButton({ replyId }: { replyId: string }) {
  const [, start] = useTransition();

  function handle() {
    if (!confirm("Supprimer cette réponse ?")) return;
    start(async () => { await deleteReplyAction(replyId); });
  }

  return (
    <button type="button" onClick={handle} title="Supprimer"
      className="flex items-center gap-1 text-[11px] text-faint hover:text-red-400 transition-colors">
      <Trash2 size={11} />
      Supprimer
    </button>
  );
}

"use client";

import { useState, useTransition } from "react";
import { Check, X } from "lucide-react";
import { approveTopicAction, rejectTopicAction } from "@/app/actions/forum";

interface Props {
  topicId:      string;
  categorySlug: string;
  approveOnly?: boolean;
  approveLabel?: string;
}

export default function ApproveRejectButtons({ topicId, approveOnly = false, approveLabel = "Approuver" }: Props) {
  const [, start]       = useTransition();
  const [modalOpen, setModalOpen] = useState(false);
  const [reason, setReason]       = useState("");
  const [error, setError]         = useState("");

  function handleApprove() {
    start(async () => { await approveTopicAction(topicId); });
  }

  function openRejectModal() {
    setReason("");
    setError("");
    setModalOpen(true);
  }

  function handleReject() {
    if (!reason.trim()) { setError("La raison est obligatoire."); return; }
    setModalOpen(false);
    start(async () => { await rejectTopicAction(topicId, reason.trim()); });
  }

  return (
    <>
      <button
        type="button"
        onClick={handleApprove}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 text-[12px] font-semibold transition-colors"
      >
        <Check size={12} />
        {approveLabel}
      </button>

      {!approveOnly && (
        <button
          type="button"
          onClick={openRejectModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/15 text-red-400 hover:bg-red-500/25 text-[12px] font-semibold transition-colors"
        >
          <X size={12} />
          Rejeter
        </button>
      )}

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="w-full max-w-md bg-surface border border-border-site rounded-xl shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-border-site">
              <div className="flex items-center gap-2">
                <X size={15} className="text-red-400" />
                <span className="font-semibold text-foreground text-sm">Rejeter ce sujet</span>
              </div>
              <button type="button" onClick={() => setModalOpen(false)} className="text-faint hover:text-foreground">
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted mb-1.5">
                  Raison du refus <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={reason}
                  onChange={e => { setReason(e.target.value.slice(0, 500)); setError(""); }}
                  placeholder="Expliquez pourquoi ce sujet est refusé…"
                  rows={4}
                  autoFocus
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
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-sm text-muted hover:text-foreground border border-border-site transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleReject}
                  className="px-4 py-2 rounded-lg text-sm font-semibold bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 transition-colors"
                >
                  Confirmer le rejet
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

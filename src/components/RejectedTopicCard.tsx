"use client";

import { useState } from "react";
import { XCircle, Clock, X } from "lucide-react";

interface Props {
  title:           string;
  content:         string;
  categoryName:    string;
  createdAt:       string;
  status:          "pending" | "rejected";
  rejectedReason?: string | null;
}

const STATUS = {
  pending:  {
    label:      "En attente",
    Icon:       Clock,
    chip:       "bg-amber-500/10 text-amber-400 border-amber-500/20",
    hover:      "hover:border-amber-500/30",
    arrowHover: "group-hover:text-amber-400",
    note:       "En attente de validation par un administrateur",
    noteColor:  "text-amber-400/70",
  },
  rejected: {
    label:      "Rejeté",
    Icon:       XCircle,
    chip:       "bg-red-500/10 text-red-400 border-red-500/20",
    hover:      "hover:border-red-500/30",
    arrowHover: "group-hover:text-red-400",
    note:       "Ce sujet n'a pas été accepté par la modération",
    noteColor:  "text-red-400/70",
  },
} as const;

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const m  = Math.floor(ms / 60_000);
  if (m < 1)  return "À l'instant";
  if (m < 60) return `Il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `Il y a ${h}h`;
  const d = Math.floor(h / 24);
  if (d < 30) return `Il y a ${d}j`;
  return `Il y a ${Math.floor(d / 30)} mois`;
}

export default function RejectedTopicCard({ title, content, categoryName, createdAt, status, rejectedReason }: Props) {
  const [open, setOpen] = useState(false);
  const cfg = STATUS[status];
  const { Icon } = cfg;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`w-full text-left bg-surface border border-border-site rounded-xl px-4 py-4 ${cfg.hover} transition-colors group cursor-pointer`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${cfg.chip}`}>
                <Icon size={9} />
                {cfg.label}
              </span>
              <span className="text-xs text-faint">{categoryName}</span>
            </div>

            <p className="text-sm font-semibold leading-snug text-foreground transition-colors">
              {title}
            </p>

            <div className="flex items-center gap-3 mt-2 text-xs text-faint flex-wrap">
              <span>{timeAgo(createdAt)}</span>
              <span className={cfg.noteColor}>{cfg.note}</span>
            </div>
          </div>

          <span className={`text-faint ${cfg.arrowHover} transition-colors shrink-0 mt-0.5 text-sm`}>→</span>
        </div>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-2xl bg-surface border border-border-site rounded-xl shadow-xl max-h-[80vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-border-site shrink-0">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${cfg.chip}`}>
                    <Icon size={9} />
                    {cfg.label}
                  </span>
                  <span className="text-xs text-faint">{categoryName}</span>
                </div>
                <h2 className="text-sm font-bold text-foreground leading-snug">{title}</h2>
                <p className="text-xs text-faint mt-0.5">{timeAgo(createdAt)}</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-faint hover:text-foreground transition-colors shrink-0"
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-5 py-4 overflow-y-auto space-y-4">
              {status === "rejected" && rejectedReason && (
                <div className="rounded-lg bg-red-500/8 border border-red-500/20 px-4 py-3">
                  <p className="text-[11px] text-red-400 uppercase tracking-wider mb-1 font-semibold">Raison du refus</p>
                  <p className="text-sm text-red-300/80 leading-relaxed">{rejectedReason}</p>
                </div>
              )}
              <div>
                <p className="text-[11px] text-faint uppercase tracking-wider mb-2 font-semibold">Contenu soumis</p>
                <p className="text-sm text-muted leading-relaxed whitespace-pre-line">{content}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

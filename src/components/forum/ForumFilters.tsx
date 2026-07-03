"use client";

import { useState } from "react";
import Link from "next/link";
import { SlidersHorizontal, X } from "lucide-react";

const STATUTS = [
  { value: "épinglés",    label: "ÉPINGLÉS"    },
  { value: "verrouillés", label: "VERROUILLÉS"  },
  { value: "ouverts",     label: "OUVERTS"      },
];

interface Props {
  slug:    string;
  statut?: string;
}

const FILTER_BTN = (active: boolean) =>
  `shrink-0 px-4 py-1.5 rounded text-[11px] font-bold tracking-wider border transition-colors ${
    active
      ? "bg-[#c8a32e] text-[#080e1a] border-[#c8a32e]"
      : "border-border-site text-muted hover:border-[#c8a32e]/50 hover:text-[#c8a32e]"
  }`;

function buildUrl(slug: string, statut?: string): string {
  return statut ? `/forum/${slug}?statut=${encodeURIComponent(statut)}` : `/forum/${slug}`;
}

export default function ForumFilters({ slug, statut }: Props) {
  const [open, setOpen] = useState(false);
  const isFiltered = !!statut;

  return (
    <div className="mb-6">

      {/* ── Mobile : bouton + panneau collapsible ──────────────────────── */}
      <div className="lg:hidden">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setOpen(v => !v)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded border text-sm font-semibold tracking-wide transition-colors ${
              open || isFiltered
                ? "border-[#c8a32e] text-[#c8a32e] bg-[#c8a32e]/5"
                : "border-border-site text-muted hover:border-[#c8a32e]/40 hover:text-foreground"
            }`}
          >
            <SlidersHorizontal size={14} />
            Filtres
            {isFiltered && (
              <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-[#c8a32e] text-[#080e1a] text-[10px] font-bold">
                1
              </span>
            )}
          </button>
          {isFiltered && (
            <Link
              href={`/forum/${slug}`}
              className="flex items-center gap-1 text-xs text-faint hover:text-muted transition-colors"
            >
              <X size={12} />
              Réinitialiser
            </Link>
          )}
        </div>

        {open && (
          <div className="mt-3 rounded-lg border border-border-site bg-surface p-4">
            <p className="text-[10px] font-bold tracking-widest text-faint uppercase mb-2.5">Statut</p>
            <div className="flex flex-wrap gap-2">
              <Link href={`/forum/${slug}`} className={FILTER_BTN(!statut)} onClick={() => setOpen(false)}>
                TOUS
              </Link>
              {STATUTS.map(s => (
                <Link
                  key={s.value}
                  href={buildUrl(slug, statut === s.value ? undefined : s.value)}
                  className={FILTER_BTN(statut === s.value)}
                  onClick={() => setOpen(false)}
                >
                  {s.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Desktop : ligne horizontale ─────────────────────────────────── */}
      <div className="hidden lg:flex items-center gap-2">
        <span className="shrink-0 text-[10px] font-bold tracking-widest text-faint uppercase">STATUT</span>
        <Link href={`/forum/${slug}`} className={FILTER_BTN(!statut)}>TOUS</Link>
        {STATUTS.map(s => (
          <Link
            key={s.value}
            href={buildUrl(slug, statut === s.value ? undefined : s.value)}
            className={FILTER_BTN(statut === s.value)}
          >
            {s.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { SlidersHorizontal, X } from "lucide-react";

type Category = { value: string; label: string };

interface Props {
  jeu?: string;
  type?: string;
  gameCategories: Category[];
  tagCategories: Category[];
}

function buildUrl(params: { jeu?: string; type?: string }): string {
  const search = new URLSearchParams();
  if (params.jeu)  search.set("jeu",  params.jeu);
  if (params.type) search.set("type", params.type);
  const qs = search.toString();
  return `/actualites${qs ? `?${qs}` : ""}`;
}

const FILTER_BTN = (active: boolean) =>
  `shrink-0 px-4 py-1.5 rounded text-[11px] font-bold tracking-wider border transition-colors ${
    active
      ? "bg-[#c8a32e] text-[#080e1a] border-[#c8a32e]"
      : "border-border-site text-muted hover:border-[#c8a32e]/50 hover:text-[#c8a32e]"
  }`;

export default function ActualitesFilters({ jeu, type, gameCategories, tagCategories }: Props) {
  const [open, setOpen] = useState(false);
  const activeCount = (jeu ? 1 : 0) + (type ? 1 : 0);

  return (
    <div className="mb-10">

      {/* ── Mobile : bouton + panneau collapsible ──────────────────────── */}
      <div className="lg:hidden">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setOpen(v => !v)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded border text-sm font-semibold tracking-wide transition-colors ${
              open || activeCount > 0
                ? "border-[#c8a32e] text-[#c8a32e] bg-[#c8a32e]/5"
                : "border-border-site text-muted hover:border-[#c8a32e]/40 hover:text-foreground"
            }`}
          >
            <SlidersHorizontal size={14} />
            Filtres
            {activeCount > 0 && (
              <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-[#c8a32e] text-[#080e1a] text-[10px] font-bold">
                {activeCount}
              </span>
            )}
          </button>
          {activeCount > 0 && (
            <Link
              href="/actualites"
              className="flex items-center gap-1 text-xs text-faint hover:text-muted transition-colors"
            >
              <X size={12} />
              Réinitialiser
            </Link>
          )}
        </div>

        {open && (
          <div className="mt-3 rounded-lg border border-border-site bg-surface p-4 space-y-5">
            <div>
              <p className="text-[10px] font-bold tracking-widest text-faint uppercase mb-2.5">Jeu</p>
              <div className="flex flex-wrap gap-2">
                <Link href={buildUrl({ type })} className={FILTER_BTN(!jeu)} onClick={() => setOpen(false)}>TOUS</Link>
                {gameCategories.map(cat => (
                  <Link
                    key={cat.value}
                    href={buildUrl({ jeu: jeu === cat.value ? undefined : cat.value, type })}
                    className={FILTER_BTN(jeu === cat.value)}
                    onClick={() => setOpen(false)}
                  >
                    {cat.label}
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold tracking-widest text-faint uppercase mb-2.5">Type</p>
              <div className="flex flex-wrap gap-2">
                <Link href={buildUrl({ jeu })} className={FILTER_BTN(!type)} onClick={() => setOpen(false)}>TOUS</Link>
                {tagCategories.map(cat => (
                  <Link
                    key={cat.value}
                    href={buildUrl({ jeu, type: type === cat.value ? undefined : cat.value })}
                    className={FILTER_BTN(type === cat.value)}
                    onClick={() => setOpen(false)}
                  >
                    {cat.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Desktop : lignes horizontales inchangées ───────────────────── */}
      <div className="hidden lg:block space-y-2">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <span className="shrink-0 text-[10px] font-bold tracking-widest text-faint uppercase w-10">JEU</span>
          <Link href={buildUrl({ type })} className={FILTER_BTN(!jeu)}>TOUS</Link>
          {gameCategories.map(cat => (
            <Link key={cat.value} href={buildUrl({ jeu: jeu === cat.value ? undefined : cat.value, type })} className={FILTER_BTN(jeu === cat.value)}>
              {cat.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <span className="shrink-0 text-[10px] font-bold tracking-widest text-faint uppercase w-10">TYPE</span>
          <Link href={buildUrl({ jeu })} className={FILTER_BTN(!type)}>TOUS</Link>
          {tagCategories.map(cat => (
            <Link key={cat.value} href={buildUrl({ jeu, type: type === cat.value ? undefined : cat.value })} className={FILTER_BTN(type === cat.value)}>
              {cat.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

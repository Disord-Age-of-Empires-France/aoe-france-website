"use client";

import { useState } from "react";
import Link from "next/link";
import { SlidersHorizontal, X } from "lucide-react";

interface Item {
  slug: string;
  name: string;
  icon: string;
  href: string;
}

interface Props {
  items:   Item[];
  allHref: string;
  active?: string;
}

const FILTER_BTN = (active: boolean) =>
  `shrink-0 flex items-center gap-1.5 px-4 py-1.5 rounded text-[11px] font-bold tracking-wider border transition-colors ${
    active
      ? "bg-[#c8a32e] text-[#080e1a] border-[#c8a32e]"
      : "border-border-site text-muted hover:border-[#c8a32e]/50 hover:text-[#c8a32e]"
  }`;

export default function ForumCategoryFilters({ items, allHref, active }: Props) {
  const [open, setOpen] = useState(false);
  const isFiltered     = !!active;
  const activeItem     = items.find(i => i.slug === active);

  return (
    <div className="mb-8">

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
            {isFiltered
              ? <span className="flex items-center gap-1">{activeItem?.icon} {activeItem?.name}</span>
              : "Section"
            }
            {isFiltered && (
              <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-[#c8a32e] text-[#080e1a] text-[10px] font-bold">
                1
              </span>
            )}
          </button>
          {isFiltered && (
            <Link href={allHref} className="flex items-center gap-1 text-xs text-faint hover:text-muted transition-colors">
              <X size={12} />
              Réinitialiser
            </Link>
          )}
        </div>

        {open && (
          <div className="mt-3 rounded-lg border border-border-site bg-surface p-4">
            <p className="text-[10px] font-bold tracking-widest text-faint uppercase mb-2.5">Section</p>
            <div className="flex flex-wrap gap-2">
              <Link href={allHref} className={FILTER_BTN(!active)} onClick={() => setOpen(false)}>
                TOUTES
              </Link>
              {items.map(item => (
                <Link
                  key={item.slug}
                  href={item.href}
                  className={FILTER_BTN(active === item.slug)}
                  onClick={() => setOpen(false)}
                >
                  <span>{item.icon}</span>
                  {item.name.toUpperCase()}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Desktop : ligne horizontale ─────────────────────────────────── */}
      <div className="hidden lg:flex items-center gap-2 flex-wrap">
        <span className="shrink-0 text-[10px] font-bold tracking-widest text-faint uppercase">SECTION</span>
        <Link href={allHref} className={FILTER_BTN(!active)}>TOUTES</Link>
        {items.map(item => (
          <Link key={item.slug} href={item.href} className={FILTER_BTN(active === item.slug)}>
            <span>{item.icon}</span>
            {item.name.toUpperCase()}
          </Link>
        ))}
      </div>
    </div>
  );
}

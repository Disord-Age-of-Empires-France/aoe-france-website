"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid } from "lucide-react";
import type { ForumCategory } from "@/lib/db";

const COLOR_MAP: Record<string, string> = {
  amber:  "bg-[#c8a32e]/15 text-[#c8a32e]",
  blue:   "bg-blue-500/15 text-blue-400",
  green:  "bg-emerald-500/15 text-emerald-400",
  red:    "bg-red-500/15 text-red-400",
  purple: "bg-purple-500/15 text-purple-400",
  slate:  "bg-slate-500/15 text-slate-400",
};

interface Props {
  categories: Pick<ForumCategory, "id" | "slug" | "name" | "icon" | "color" | "topicCount">[];
}

export default function ForumSidebar({ categories }: Props) {
  const pathname = usePathname();
  const activeSlug = pathname.startsWith("/forum/") ? pathname.split("/")[2] : null;
  const isIndex = pathname === "/forum";

  return (
    <>
      {/* ── Desktop : sidebar verticale ── */}
      <nav className="hidden lg:block w-52 shrink-0 self-start sticky top-24">
        <div className="bg-surface border border-border-site rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border-site">
            <span className="text-[10px] font-bold text-faint uppercase tracking-widest">Forum</span>
          </div>
          <div className="p-2 space-y-0.5">
            {/* Toutes les catégories */}
            <Link
              href="/forum"
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-colors ${
                isIndex
                  ? "bg-[#c8a32e]/10 text-[#c8a32e] font-semibold"
                  : "text-muted hover:text-foreground hover:bg-surface-2"
              }`}
            >
              <LayoutGrid size={13} className="shrink-0" />
              <span>Toutes</span>
            </Link>

            {/* Catégories */}
            {categories.map((cat) => {
              const isActive = activeSlug === cat.slug;
              const iconBg = COLOR_MAP[cat.color] ?? COLOR_MAP.amber;
              return (
                <Link
                  key={cat.id}
                  href={`/forum/${cat.slug}`}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-colors ${
                    isActive
                      ? "bg-[#c8a32e]/10 text-[#c8a32e] font-semibold"
                      : "text-muted hover:text-foreground hover:bg-surface-2"
                  }`}
                >
                  <span className={`w-5 h-5 rounded flex items-center justify-center text-[11px] shrink-0 ${iconBg}`}>
                    {cat.icon || "💬"}
                  </span>
                  <span className="truncate flex-1">{cat.name}</span>
                  <span className="text-[10px] text-faint tabular-nums">{cat.topicCount}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* ── Mobile : chips horizontales scrollables ── */}
      <div className="lg:hidden -mx-4 px-4 overflow-x-auto scrollbar-none">
        <div className="flex gap-2 pb-1 min-w-max">
          <Link
            href="/forum"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold whitespace-nowrap border transition-colors ${
              isIndex
                ? "bg-[#c8a32e]/10 text-[#c8a32e] border-[#c8a32e]/30"
                : "text-muted border-border-site hover:text-foreground"
            }`}
          >
            <LayoutGrid size={11} />
            Toutes
          </Link>
          {categories.map((cat) => {
            const isActive = activeSlug === cat.slug;
            return (
              <Link
                key={cat.id}
                href={`/forum/${cat.slug}`}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold whitespace-nowrap border transition-colors ${
                  isActive
                    ? "bg-[#c8a32e]/10 text-[#c8a32e] border-[#c8a32e]/30"
                    : "text-muted border-border-site hover:text-foreground"
                }`}
              >
                <span className="text-[11px]">{cat.icon || "💬"}</span>
                {cat.name}
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}

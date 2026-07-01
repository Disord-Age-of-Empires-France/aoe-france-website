"use client";

import { useState } from "react";
import Link from "next/link";
import { Clock, ExternalLink, Pencil, Search, X } from "lucide-react";
import type { Article } from "@/lib/db";
import { ARTICLE_CATEGORIES } from "@/lib/categories";
import DeleteButton from "./DeleteButton";

const BADGE_CLASSES: Record<string, string> = {
  blue:   "bg-blue-800/60 text-blue-300",
  green:  "bg-green-800/60 text-green-300",
  amber:  "bg-amber-800/60 text-amber-300",
  purple: "bg-purple-800/60 text-purple-300",
  red:    "bg-red-800/60 text-red-300",
};

const STATUS_STYLE: Record<string, string> = {
  published: "bg-emerald-900/50 text-emerald-400",
  draft:     "bg-gray-800/50 text-gray-400",
  archived:  "bg-orange-900/40 text-orange-400",
};

const STATUS_LABEL: Record<string, string> = {
  published: "Publié",
  draft:     "Brouillon",
  archived:  "Archivé",
};

const CHIP = "px-3 py-1.5 rounded text-[11px] font-bold tracking-wider border transition-colors cursor-pointer";
const CHIP_OFF = `${CHIP} border-border-site text-faint hover:border-[#c8a32e]/50 hover:text-muted`;
const CHIP_ON  = `${CHIP} border-[#c8a32e]/40 bg-[#c8a32e]/10 text-[#c8a32e]`;

const STATUS_FILTERS = [
  { value: "all",       label: "Tous"       },
  { value: "published", label: "Publiés"    },
  { value: "draft",     label: "Brouillons" },
  { value: "scheduled", label: "Programmés" },
  { value: "archived",  label: "Archivés"   },
] as const;

type StatusFilter = typeof STATUS_FILTERS[number]["value"];

interface Props {
  articles: Article[];
  isAdmin:  boolean;
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", year: "numeric" }).format(new Date(iso));
}

export default function ArticleFilters({ articles, isAdmin }: Props) {
  const [search,        setSearch]        = useState("");
  const [statusFilter,  setStatusFilter]  = useState<StatusFilter>("all");
  const [gameFilter,    setGameFilter]    = useState("all");
  const [typeFilter,    setTypeFilter]    = useState("all");
  const [creatorFilter, setCreatorFilter] = useState("all");

  const GAMES = ARTICLE_CATEGORIES.filter((c) => c.group === "game");
  const TAGS  = ARTICLE_CATEGORIES.filter((c) => c.group === "tag");

  const creators = [...new Set(
    articles.map((a) => a.createdBy).filter((c): c is string => !!c)
  )].sort();

  const filtered = articles.filter((a) => {
    if (search && !a.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter === "scheduled") {
      if (!(a.status === "draft" && a.scheduledAt)) return false;
    } else if (statusFilter !== "all") {
      if (statusFilter === "draft") {
        if (a.status !== "draft" || a.scheduledAt) return false;
      } else {
        if (a.status !== statusFilter) return false;
      }
    }
    if (gameFilter !== "all" && !a.categories.includes(gameFilter)) return false;
    if (typeFilter !== "all" && !a.categories.includes(typeFilter)) return false;
    if (creatorFilter !== "all" && a.createdBy !== creatorFilter) return false;
    return true;
  });

  const hasFilters = search || statusFilter !== "all" || gameFilter !== "all" || typeFilter !== "all" || creatorFilter !== "all";

  function resetFilters() {
    setSearch(""); setStatusFilter("all"); setGameFilter("all");
    setTypeFilter("all"); setCreatorFilter("all");
  }

  return (
    <div className="bg-surface border border-border-site rounded-lg overflow-hidden">
      {/* Search + creator */}
      <div className="px-4 py-3 border-b border-border-site flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-44">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par titre…"
            className="w-full bg-background border border-border-site rounded pl-8 pr-4 py-2 text-sm text-foreground placeholder-faint focus:outline-none focus:border-[#c8a32e] transition-colors"
          />
        </div>

        {creators.length > 0 && (
          <select
            value={creatorFilter}
            onChange={(e) => setCreatorFilter(e.target.value)}
            className="bg-background border border-border-site rounded px-3 py-2 text-sm text-foreground focus:outline-none focus:border-[#c8a32e] transition-colors"
          >
            <option value="all">Tous les auteurs</option>
            {creators.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        )}

        {hasFilters && (
          <button
            type="button"
            onClick={resetFilters}
            className="flex items-center gap-1 text-[11px] text-faint hover:text-red-400 transition-colors"
          >
            <X size={12} />Réinitialiser
          </button>
        )}
      </div>

      {/* Status chips */}
      <div className="px-4 py-2.5 border-b border-border-site flex flex-wrap gap-2 items-center">
        <span className="text-[10px] font-bold tracking-widest text-faint uppercase mr-1 shrink-0">Statut</span>
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setStatusFilter(f.value)}
            className={statusFilter === f.value ? CHIP_ON : CHIP_OFF}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Game + type chips */}
      <div className="px-4 py-2.5 border-b border-border-site flex flex-wrap gap-2 items-center">
        <span className="text-[10px] font-bold tracking-widest text-faint uppercase mr-1 shrink-0">Jeu</span>
        <button type="button" onClick={() => setGameFilter("all")} className={gameFilter === "all" ? CHIP_ON : CHIP_OFF}>Tous</button>
        {GAMES.map((g) => (
          <button key={g.value} type="button" onClick={() => setGameFilter(g.value)}
            className={gameFilter === g.value ? CHIP_ON : CHIP_OFF}>{g.label}</button>
        ))}
        <span className="w-px h-4 bg-border-site mx-1 shrink-0" />
        <span className="text-[10px] font-bold tracking-widest text-faint uppercase mr-1 shrink-0">Type</span>
        <button type="button" onClick={() => setTypeFilter("all")} className={typeFilter === "all" ? CHIP_ON : CHIP_OFF}>Tous</button>
        {TAGS.map((t) => (
          <button key={t.value} type="button" onClick={() => setTypeFilter(t.value)}
            className={typeFilter === t.value ? CHIP_ON : CHIP_OFF}>{t.label}</button>
        ))}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="px-6 py-12 text-center text-faint text-sm">
          {hasFilters
            ? "Aucun article ne correspond aux filtres."
            : <>Aucun article. <Link href="/admin/actualites/nouveau" className="text-[#c8a32e] hover:underline">Créer le premier →</Link></>
          }
        </div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-site">
              <th className="text-left px-5 py-3.5 text-xs font-semibold tracking-wider text-faint uppercase">Titre</th>
              <th className="text-left px-4 py-3.5 text-xs font-semibold tracking-wider text-faint uppercase hidden sm:table-cell">Catégories</th>
              <th className="text-left px-4 py-3.5 text-xs font-semibold tracking-wider text-faint uppercase hidden lg:table-cell">Auteur</th>
              <th className="text-left px-4 py-3.5 text-xs font-semibold tracking-wider text-faint uppercase hidden md:table-cell">Date</th>
              <th className="text-left px-4 py-3.5 text-xs font-semibold tracking-wider text-faint uppercase">Statut</th>
              <th className="px-4 py-3.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border-site">
            {filtered.map((article) => (
              <tr key={article.id} className="hover:bg-surface-2 transition-colors">
                <td className="px-5 py-4">
                  <span className="text-foreground font-medium leading-snug line-clamp-1">{article.title}</span>
                </td>
                <td className="px-4 py-4 hidden sm:table-cell">
                  <div className="flex flex-wrap gap-1">
                    {article.categories.length > 0
                      ? article.categories.map((cat) => (
                          <span key={cat} className={`text-[10px] font-bold tracking-wider px-2 py-0.5 rounded ${BADGE_CLASSES[article.badgeColor] ?? BADGE_CLASSES.blue}`}>
                            {cat}
                          </span>
                        ))
                      : <span className="text-faint text-xs">—</span>
                    }
                  </div>
                </td>
                <td className="px-4 py-4 hidden lg:table-cell">
                  <span className="text-faint text-xs">{article.createdBy ?? "—"}</span>
                </td>
                <td className="px-4 py-4 hidden md:table-cell">
                  <span className="text-faint text-xs">{formatDate(article.publishedAt ?? article.date)}</span>
                </td>
                <td className="px-4 py-4">
                  {article.status === "draft" && article.scheduledAt ? (
                    <span
                      title={`Publication programmée le ${new Date(article.scheduledAt).toLocaleString("fr-FR", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}`}
                      className="text-[10px] font-semibold px-2.5 py-1 rounded bg-blue-900/40 text-blue-400 flex items-center gap-1 w-fit cursor-default"
                    >
                      <Clock size={10} />Programmé
                    </span>
                  ) : (
                    <span className={`text-[10px] font-semibold px-2.5 py-1 rounded ${STATUS_STYLE[article.status] ?? STATUS_STYLE.draft}`}>
                      {STATUS_LABEL[article.status] ?? "Brouillon"}
                    </span>
                  )}
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-4 justify-end">
                    {article.status === "published" && (
                      <a
                        href={`/actualites/${article.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-faint hover:text-[#c8a32e] text-sm font-medium transition-colors"
                        title="Voir sur le site"
                      >
                        <ExternalLink size={13} />Voir
                      </a>
                    )}
                    <Link
                      href={`/admin/actualites/${article.id}`}
                      className="flex items-center gap-1.5 text-faint hover:text-[#c8a32e] text-sm font-medium transition-colors"
                    >
                      <Pencil size={13} />Modifier
                    </Link>
                    {isAdmin && <DeleteButton id={article.id} />}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {hasFilters && filtered.length > 0 && (
        <div className="px-5 py-2.5 border-t border-border-site text-[11px] text-faint">
          {filtered.length} résultat{filtered.length !== 1 ? "s" : ""} sur {articles.length}
        </div>
      )}
    </div>
  );
}

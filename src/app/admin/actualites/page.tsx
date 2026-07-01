import Link from "next/link";
import { getArticles } from "@/lib/db";
import { requireBOAccess } from "@/lib/auth-check";
import { Plus, Newspaper, CheckCircle, FileText, Archive, CalendarDays } from "lucide-react";
import { ARTICLE_CATEGORIES } from "@/lib/categories";
import ArticleFilters from "@/components/admin/ArticleFilters";

export const metadata = { title: "Actualités" };

const BADGE_CLASSES: Record<string, string> = {
  blue:   "bg-blue-800/60 text-blue-300",
  green:  "bg-green-800/60 text-green-300",
  amber:  "bg-amber-800/60 text-amber-300",
  purple: "bg-purple-800/60 text-purple-300",
  red:    "bg-red-800/60 text-red-300",
};

const BAR_CLASSES: Record<string, string> = {
  blue:   "bg-blue-500",
  green:  "bg-green-500",
  amber:  "bg-amber-400",
  purple: "bg-purple-500",
  red:    "bg-red-500",
};

export default async function ActualitesPage() {
  const [articles, session] = await Promise.all([getArticles(), requireBOAccess()]);
  const isAdmin = session?.role === "admin";

  const published  = articles.filter((a) => a.status === "published").length;
  const drafts     = articles.filter((a) => a.status === "draft").length;
  const archived   = articles.filter((a) => a.status === "archived").length;
  const thisMonth  = articles.filter((a) => {
    const d = a.publishedAt ?? a.date;
    if (!d) return false;
    const now = new Date();
    const pub = new Date(d.length === 10 ? d + "T12:00:00" : d);
    return pub.getFullYear() === now.getFullYear() && pub.getMonth() === now.getMonth();
  }).length;

  const GAMES = ARTICLE_CATEGORIES.filter((c) => c.group === "game");
  const TAGS  = ARTICLE_CATEGORIES.filter((c) => c.group === "tag");

  const gameCounts = GAMES.map((g) => ({
    ...g,
    count: articles.filter((a) => a.categories.includes(g.value)).length,
  }));
  const tagCounts = TAGS.map((t) => ({
    ...t,
    count: articles.filter((a) => a.categories.includes(t.value)).length,
  }));

  const maxGame = Math.max(...gameCounts.map((g) => g.count), 1);
  const maxTag  = Math.max(...tagCounts.map((t) => t.count), 1);

  const stats = [
    { label: "Total",           value: articles.length, icon: Newspaper,     color: "text-[#c8a32e] bg-[#c8a32e]/10" },
    { label: "Publiés",         value: published,        icon: CheckCircle,   color: "text-emerald-400 bg-emerald-400/10" },
    { label: "Brouillons",      value: drafts,           icon: FileText,      color: "text-muted bg-border-site/30" },
    { label: "Archivés",        value: archived,         icon: Archive,       color: "text-orange-400 bg-orange-400/10" },
    { label: "Ce mois",         value: thisMonth,        icon: CalendarDays,  color: "text-blue-400 bg-blue-400/10" },
  ] as const;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-wide">Actualités</h1>
          <p className="text-faint text-sm mt-1">
            {articles.length} article{articles.length !== 1 ? "s" : ""} au total
          </p>
        </div>
        <Link
          href="/admin/actualites/nouveau"
          className="flex items-center gap-2 bg-[#c8a32e] hover:bg-[#b8922a] text-[#080e1a] font-bold text-sm tracking-wider px-5 py-2.5 rounded transition-colors"
        >
          <Plus size={15} />
          Nouvel article
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-surface border border-border-site rounded-lg px-4 py-4 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
              <Icon size={17} />
            </div>
            <div>
              <div className="text-xl font-bold text-foreground">{value}</div>
              <div className="text-[11px] text-faint font-medium tracking-wide">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Distribution par jeu et par type */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Par jeu */}
        <div className="bg-surface border border-border-site rounded-lg p-4 space-y-3">
          <p className="text-[11px] font-bold tracking-widest text-faint uppercase">Par jeu</p>
          <div className="space-y-2.5">
            {gameCounts.map(({ value, label, color, count }) => (
              <div key={value} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-bold tracking-wider px-2 py-0.5 rounded ${BADGE_CLASSES[color] ?? BADGE_CLASSES.blue}`}>
                    {label}
                  </span>
                  <span className="text-xs font-semibold text-muted tabular-nums">{count}</span>
                </div>
                <div className="h-1 bg-border-site/40 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${BAR_CLASSES[color] ?? BAR_CLASSES.blue}`}
                    style={{ width: `${(count / maxGame) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Par type */}
        <div className="bg-surface border border-border-site rounded-lg p-4 space-y-3">
          <p className="text-[11px] font-bold tracking-widest text-faint uppercase">Par type</p>
          <div className="space-y-2.5">
            {tagCounts.map(({ value, label, color, count }) => (
              <div key={value} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-bold tracking-wider px-2 py-0.5 rounded ${BADGE_CLASSES[color] ?? BADGE_CLASSES.blue}`}>
                    {label}
                  </span>
                  <span className="text-xs font-semibold text-muted tabular-nums">{count}</span>
                </div>
                <div className="h-1 bg-border-site/40 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${BAR_CLASSES[color] ?? BAR_CLASSES.blue}`}
                    style={{ width: `${(count / maxTag) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <ArticleFilters articles={articles} isAdmin={isAdmin} />
    </div>
  );
}

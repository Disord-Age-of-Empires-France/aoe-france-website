import Link from "next/link";
import { Calendar, ChevronRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getPublishedArticles, getSettings } from "@/lib/db";
import { getSession } from "@/lib/session";
import { gateFeature } from "@/lib/public-access";
import { ARTICLE_CATEGORIES } from "@/lib/categories";
import ActualitesFilters from "@/components/ActualitesFilters";
import ShareButton from "@/components/ShareButton";

export const metadata = { title: "Actualités — Age of Empires France" };

const BADGE_CLASSES: Record<string, string> = {
  blue:   "bg-blue-800/70 text-blue-200",
  amber:  "bg-amber-800/70 text-amber-200",
  green:  "bg-green-800/70 text-green-200",
  red:    "bg-red-800/70 text-red-200",
  purple: "bg-purple-800/70 text-purple-200",
};

const BORDER_ACCENT: Record<string, string> = {
  blue:   "hover:border-blue-600/50",
  amber:  "hover:border-amber-600/50",
  green:  "hover:border-green-600/50",
  red:    "hover:border-red-600/50",
  purple: "hover:border-purple-600/50",
};

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("fr-FR", {
      day: "numeric", month: "long", year: "numeric",
    }).format(new Date(iso.length === 10 ? iso + "T12:00:00" : iso));
  } catch { return iso; }
}

interface Props {
  searchParams: Promise<{ jeu?: string; type?: string }>;
}

export default async function ActualitesPage({ searchParams }: Props) {
  const { jeu, type } = await searchParams;
  const [articles, settings, session] = await Promise.all([
    getPublishedArticles(),
    getSettings(),
    getSession(),
  ]);
  gateFeature(settings, session, settings.features.news);

  const filtered = articles.filter((a) => {
    if (jeu  && !a.categories.includes(jeu))  return false;
    if (type && !a.categories.includes(type)) return false;
    return true;
  });

  const featured = filtered[0];
  const rest     = filtered.slice(1);

  const gameCategories = ARTICLE_CATEGORIES.filter((c) => c.group === "game");
  const tagCategories  = ARTICLE_CATEGORIES.filter((c) => c.group === "tag");

  return (
    <>
      <Navbar discordInvite={settings.discordInvite} session={session} features={{ ...settings.features, navItems: settings.navItems }} maintenanceActive={settings.maintenance.active}
        maintenanceEndAt={settings.maintenance.endAt} />

      {/* Page hero */}
      <div className="pt-16 bg-background border-b border-border-site">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <p className="text-[#c8a32e] text-xs font-bold tracking-[0.3em] mb-3">AOE FRANCE</p>
          <h1 className="text-4xl md:text-5xl font-bold tracking-wide text-foreground mb-2">ACTUALITÉS</h1>
          <div className="w-12 h-0.5 bg-[#c8a32e] mb-6" />
          <p className="text-muted text-sm max-w-xl">
            Retrouvez toutes les news, mises à jour, guides et événements de la communauté Age of Empires francophone.
          </p>
        </div>
      </div>

      <main className="flex-1 bg-background">
        <div className="max-w-7xl mx-auto px-4 py-10">

          <ActualitesFilters
            jeu={jeu}
            type={type}
            gameCategories={gameCategories}
            tagCategories={tagCategories}
          />

          {filtered.length === 0 ? (
            <div className="text-center py-24 text-faint">
              <p className="text-lg font-semibold">Aucun article pour ces filtres.</p>
              <Link href="/actualites" className="mt-4 inline-block text-[#c8a32e] text-sm hover:underline">
                Voir toutes les actualités →
              </Link>
            </div>
          ) : (
            <div className="space-y-10">

              {/* Featured article */}
              {featured && (
                <div className="relative">
                <Link
                  href={`/actualites/${featured.id}`}
                  className={`group block rounded-lg overflow-hidden border border-border-site ${BORDER_ACCENT[featured.badgeColor] ?? "hover:border-[#c8a32e]/40"} transition-all`}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 md:h-72">
                    {/* Thumbnail */}
                    <div className="relative h-56 md:h-full bg-surface overflow-hidden">
                      {featured.thumbnail ? (
                        <img
                          src={featured.thumbnail}
                          alt={featured.title}
                          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className={`text-4xl font-black tracking-widest opacity-20 ${BADGE_CLASSES[featured.badgeColor]?.split(" ")[1] ?? "text-faint"}`}>
                            {featured.badge}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="bg-surface p-8 flex flex-col justify-center overflow-hidden">
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {featured.categories.map((cat) => (
                          <span key={cat} className={`text-[10px] font-bold tracking-wider px-2.5 py-0.5 rounded ${BADGE_CLASSES[featured.badgeColor] ?? BADGE_CLASSES.blue}`}>
                            {cat}
                          </span>
                        ))}
                        <span className="text-[10px] font-bold tracking-wider px-2.5 py-0.5 rounded bg-[#c8a32e]/10 text-[#c8a32e] border border-[#c8a32e]/20">
                          À LA UNE
                        </span>
                      </div>
                      <h2 className="text-2xl font-bold text-foreground group-hover:text-[#c8a32e] transition-colors leading-snug mb-3">
                        {featured.title}
                      </h2>
                      <p className="text-muted text-sm leading-relaxed mb-6 line-clamp-3">
                        {featured.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-faint text-xs">
                          <Calendar size={12} />
                          {formatDate(featured.date)}
                        </span>
                        <span className="flex items-center gap-1 text-[#c8a32e] text-xs font-bold tracking-wider group-hover:gap-2 transition-all">
                          LIRE L&apos;ARTICLE <ChevronRight size={13} />
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
                <div className="absolute top-3 right-3 z-10">
                  <ShareButton path={`/actualites/${featured.id}`} title={featured.title} compact />
                </div>
                </div>
              )}

              {/* Article grid */}
              {rest.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {rest.map((article) => (
                    <div key={article.id} className="relative">
                    <Link
                      href={`/actualites/${article.id}`}
                      className={`group flex flex-col rounded-lg overflow-hidden border border-border-site ${BORDER_ACCENT[article.badgeColor] ?? "hover:border-[#c8a32e]/40"} bg-surface transition-all hover:bg-surface-2`}
                    >
                      {/* Thumbnail */}
                      <div className="relative h-40 bg-background overflow-hidden shrink-0">
                        {article.thumbnail ? (
                          <img
                            src={article.thumbnail}
                            alt={article.title}
                            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className={`text-3xl font-black tracking-widest opacity-10 ${BADGE_CLASSES[article.badgeColor]?.split(" ")[1] ?? "text-faint"}`}>
                              {article.badge}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex flex-col flex-1 p-5">
                        <div className="flex flex-wrap gap-1 mb-3">
                          {article.categories.map((cat) => (
                            <span key={cat} className={`text-[10px] font-bold tracking-wider px-2 py-0.5 rounded ${BADGE_CLASSES[article.badgeColor] ?? BADGE_CLASSES.blue}`}>
                              {cat}
                            </span>
                          ))}
                        </div>
                        <h3 className="font-bold text-foreground group-hover:text-[#c8a32e] transition-colors leading-snug mb-2 line-clamp-2">
                          {article.title}
                        </h3>
                        <p className="text-faint text-xs leading-relaxed line-clamp-3 flex-1">
                          {article.description}
                        </p>
                        <div className="flex items-center justify-between mt-4 pt-3 border-t border-border-site">
                          <span className="flex items-center gap-1.5 text-faint text-[11px]">
                            <Calendar size={11} />
                            {formatDate(article.date)}
                          </span>
                          <span className="text-[#c8a32e] text-[11px] font-bold tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">
                            LIRE →
                          </span>
                        </div>
                      </div>
                    </Link>
                    <div className="absolute top-3 right-3 z-10">
                      <ShareButton path={`/actualites/${article.id}`} title={article.title} compact />
                    </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}

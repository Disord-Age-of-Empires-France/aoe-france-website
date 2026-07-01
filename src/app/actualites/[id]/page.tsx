import { notFound } from "next/navigation";
import Link from "next/link";
import { Calendar, ArrowLeft, ChevronRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getArticle, getPublishedArticles, getSettings } from "@/lib/db";
import { getSession } from "@/lib/session";
import { gateFeature } from "@/lib/public-access";
import { renderMarkdown } from "@/lib/markdown";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const article = await getArticle(id);
  if (!article) return { title: "Article introuvable" };
  return {
    title: `${article.title} — Age of Empires France`,
    description: article.description,
    openGraph: {
      title: article.title,
      description: article.description,
      images: article.thumbnail ? [{ url: article.thumbnail }] : [],
    },
  };
}

const BADGE_CLASSES: Record<string, string> = {
  blue:   "bg-blue-800/80 text-blue-200",
  amber:  "bg-amber-800/80 text-amber-200",
  green:  "bg-green-800/80 text-green-200",
  red:    "bg-red-800/80 text-red-200",
  purple: "bg-purple-800/80 text-purple-200",
};

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("fr-FR", {
      day: "numeric", month: "long", year: "numeric",
    }).format(new Date(iso.length === 10 ? iso + "T12:00:00" : iso));
  } catch { return iso; }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ArticlePage({ params }: Props) {
  const { id } = await params;
  const [article, settings, session, allArticles] = await Promise.all([
    getArticle(id),
    getSettings(),
    getSession(),
    getPublishedArticles(),
  ]);

  gateFeature(settings, session, settings.features.news);
  if (!article || article.status !== "published") notFound();

  const related = allArticles
    .filter((a) => a.id !== article.id && a.categories.some((c) => article.categories.includes(c)))
    .slice(0, 3);

  return (
    <>
      <Navbar discordInvite={settings.discordInvite} session={session} features={{ ...settings.features, navItems: settings.navItems }} maintenanceActive={settings.maintenance.active}
        maintenanceEndAt={settings.maintenance.endAt} />

      {/* ── Hero banner ─────────────────────────────────────────────────── */}
      <div className="pt-16 bg-[#080e1a]">
        <div className="relative h-64 md:h-80 overflow-hidden bg-[#0a1020]">
          {article.thumbnail && (
            <>
              <img
                src={article.thumbnail}
                alt=""
                aria-hidden
                className="absolute inset-0 w-full h-full object-cover object-center opacity-30"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#080e1a] via-[#080e1a]/60 to-transparent" />
            </>
          )}

          {/* Meta at bottom of banner */}
          <div className="absolute bottom-0 left-0 right-0 px-4 pb-7 max-w-5xl mx-auto w-full">
            <Link
              href="/actualites"
              className="inline-flex items-center gap-1.5 text-gray-400 hover:text-white text-xs mb-4 transition-colors"
            >
              <ArrowLeft size={12} />
              Retour aux actualités
            </Link>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {article.categories.map((cat) => (
                <Link
                  key={cat}
                  href={`/actualites?categorie=${encodeURIComponent(cat)}`}
                  className={`text-[10px] font-bold tracking-wider px-2.5 py-0.5 rounded ${BADGE_CLASSES[article.badgeColor] ?? BADGE_CLASSES.blue}`}
                >
                  {cat}
                </Link>
              ))}
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white leading-tight tracking-wide max-w-3xl">
              {article.title}
            </h1>
          </div>
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────────────────────── */}
      <main className="bg-[#080e1a] border-t border-[#1c2d47]">
        <div className="max-w-5xl mx-auto px-4 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-10">

            {/* Article */}
            <article className="min-w-0">
              {/* Meta row */}
              <div className="flex items-center gap-3 pb-6 border-b border-[#1c2d47] mb-2">
                <span className="flex items-center gap-1.5 text-gray-500 text-xs">
                  <Calendar size={12} />
                  {formatDate(article.date)}
                </span>
              </div>

              {/* Description */}
              {article.description && (
                <p className="text-gray-400 text-base leading-relaxed mt-6 mb-2 font-medium border-l-2 border-[#c8a32e] pl-4">
                  {article.description}
                </p>
              )}

              {/* Body */}
              <div className="mt-6 space-y-0 [&>h2]:mt-10 [&>h3]:mt-7 [&>p+ul]:mt-0 [&>p+ol]:mt-0">
                {renderMarkdown(article.content)}
              </div>
            </article>

            {/* Sidebar */}
            <aside className="space-y-5 lg:pt-0 pt-6 lg:border-t-0 border-t border-[#1c2d47]">

              {related.length > 0 && (
                <div className="bg-[#0d1527] border border-[#1c2d47] rounded-lg p-5">
                  <h3 className="text-[10px] font-bold tracking-[0.2em] text-[#c8a32e] uppercase mb-4">
                    Articles liés
                  </h3>
                  <div className="space-y-4">
                    {related.map((a) => (
                      <Link key={a.id} href={`/actualites/${a.id}`} className="group flex gap-3">
                        <div className="shrink-0 w-14 h-12 rounded overflow-hidden bg-[#080e1a] border border-[#1c2d47]">
                          {a.thumbnail && (
                            <img src={a.thumbnail} alt="" className="w-full h-full object-cover" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-300 text-xs font-semibold leading-snug group-hover:text-[#c8a32e] transition-colors line-clamp-2">
                            {a.title}
                          </p>
                          <p className="text-gray-600 text-[11px] mt-1">{formatDate(a.date)}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                  <Link
                    href="/actualites"
                    className="mt-4 flex items-center gap-1 text-[10px] font-bold tracking-wider text-gray-500 hover:text-[#c8a32e] transition-colors"
                  >
                    Toutes les actualités <ChevronRight size={11} />
                  </Link>
                </div>
              )}

              <div className="bg-[#0d1527] border border-[#1c2d47] rounded-lg p-5">
                <h3 className="text-[10px] font-bold tracking-[0.2em] text-[#c8a32e] uppercase mb-3">
                  Catégories
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {article.categories.map((cat) => (
                    <Link
                      key={cat}
                      href={`/actualites?categorie=${encodeURIComponent(cat)}`}
                      className={`text-[10px] font-bold tracking-wider px-2.5 py-1 rounded hover:opacity-80 transition-opacity ${BADGE_CLASSES[article.badgeColor] ?? BADGE_CLASSES.blue}`}
                    >
                      {cat}
                    </Link>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}

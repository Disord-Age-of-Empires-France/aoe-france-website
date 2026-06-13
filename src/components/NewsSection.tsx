import Link from "next/link";
import { MessageCircle, Users, BookOpen, Trophy, Calendar } from "lucide-react";
import DiscordIcon from "@/components/DiscordIcon";
import { getPublishedArticles, getSettings } from "@/lib/db";

const BADGE_CLASSES: Record<string, string> = {
  blue:   "bg-blue-800 text-blue-200",
  amber:  "bg-amber-800 text-amber-200",
  green:  "bg-green-800 text-green-200",
  red:    "bg-red-800 text-red-200",
  purple: "bg-purple-800 text-purple-200",
};

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date(iso + "T12:00:00"));
  } catch {
    return iso;
  }
}

const discordStats = [
  { icon: <Users size={14} />, text: "Plus de 4 000 membres" },
  { icon: <BookOpen size={14} />, text: "Channels dédiés à chaque jeu" },
  { icon: <Trophy size={14} />, text: "Aide, coaching et conseils" },
  { icon: <Calendar size={14} />, text: "Tournois et événements réguliers" },
];

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h2 className="text-xl font-bold tracking-[0.15em] text-foreground">{children}</h2>
      <div className="mt-2 w-10 h-0.5 bg-[#c8a32e]" />
    </div>
  );
}

function DiscordSectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h2 className="text-lg font-bold tracking-[0.12em] text-[#c8a32e]">{children}</h2>
      <div className="mt-2 w-8 h-0.5 bg-[#c8a32e]" />
    </div>
  );
}

export default async function NewsSection() {
  const [articles, { discordInvite }] = await Promise.all([
    getPublishedArticles(),
    getSettings(),
  ]);

  return (
    <section className="bg-background py-16 px-4 border-t border-border-site">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* News list — 3/5 */}
          <div className="lg:col-span-3">
            <SectionTitle>ACTUALITÉS RÉCENTES</SectionTitle>

            {articles.length === 0 ? (
              <p className="text-faint text-sm">Aucune actualité publiée pour l&apos;instant.</p>
            ) : (
              <div className="space-y-1">
                {articles.map((article) => {
                  const badgeClass = BADGE_CLASSES[article.badgeColor] ?? BADGE_CLASSES.blue;
                  return (
                    <Link
                      key={article.id}
                      href={`/actualites/${article.id}`}
                      className="flex gap-4 p-4 rounded bg-surface border border-border-site hover:border-[#c8a32e]/40 transition-all group"
                    >
                      {/* Thumbnail */}
                      <div className="shrink-0 w-20 h-16 rounded bg-surface-2 border border-border-site overflow-hidden">
                        {article.thumbnail && (
                          <img
                            src={article.thumbnail}
                            alt={article.title}
                            loading="lazy"
                            className="w-full h-full object-cover object-center"
                          />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className={`text-[10px] font-bold tracking-wider px-2 py-0.5 rounded ${badgeClass}`}>
                            {article.badge}
                          </span>
                        </div>
                        <h3 className="font-bold text-sm text-foreground group-hover:text-[#c8a32e] transition-colors leading-snug mb-1">
                          {article.title}
                        </h3>
                        <p className="text-muted text-xs leading-relaxed line-clamp-2">
                          {article.description}
                        </p>
                        <div className="flex items-center gap-3 mt-2 text-[11px] text-faint">
                          <span>{formatDate(article.date)}</span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}

            <Link
              href="/actualites"
              className="mt-6 inline-block border border-border-site hover:border-[#c8a32e] text-muted hover:text-[#c8a32e] text-[11px] font-bold tracking-wider px-5 py-2.5 rounded transition-colors"
            >
              VOIR TOUTES LES ACTUALITÉS
            </Link>
          </div>

          {/* Discord CTA — 2/5 */}
          <div className="lg:col-span-2">
            <DiscordSectionTitle>REJOIGNEZ-NOUS SUR DISCORD</DiscordSectionTitle>

            <div className="bg-surface border border-border-site rounded-lg p-6">
              <div className="flex items-start gap-4 mb-5">
                <div className="w-14 h-14 rounded-xl bg-[#5865f2] flex items-center justify-center shrink-0 text-white">
                  <DiscordIcon size={28} />
                </div>
                <p className="text-muted text-sm leading-relaxed">
                  Notre serveur Discord est le cœur de la communauté. Trouvez des partenaires de jeu, participez aux événements et discutez de votre passion pour Age of Empires&nbsp;!
                </p>
              </div>

              <ul className="space-y-2.5 mb-6">
                {discordStats.map((stat, i) => (
                  <li key={i} className="flex items-center gap-2.5 text-muted text-sm">
                    <span className="text-[#c8a32e]">{stat.icon}</span>
                    {stat.text}
                  </li>
                ))}
              </ul>

              <a
                href={discordInvite}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2.5 bg-[#5865f2] hover:bg-[#4752c4] text-white font-bold text-sm tracking-wider px-5 py-3.5 rounded w-full transition-colors"
              >
                <DiscordIcon size={18} />
                REJOINDRE LE DISCORD
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

import Link from "next/link";
import { MessageSquare, Users, Clock, Pin } from "lucide-react";
import { getForumCategories } from "@/lib/db";
import { getSession } from "@/lib/session";
import LoginButton from "@/components/LoginButton";

export const metadata = { title: "Forum — Age of Empires France" };

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

const COLOR_MAP: Record<string, string> = {
  amber:  "bg-[#c8a32e]/15 text-[#c8a32e]",
  blue:   "bg-blue-500/15 text-blue-400",
  green:  "bg-emerald-500/15 text-emerald-400",
  red:    "bg-red-500/15 text-red-400",
  purple: "bg-purple-500/15 text-purple-400",
  slate:  "bg-slate-500/15 text-slate-400",
};

export default async function ForumPage() {
  const [categories, session] = await Promise.all([
    getForumCategories(),
    getSession(),
  ]);

  const totalTopics  = categories.reduce((sum, c) => sum + c.topicCount, 0);
  const totalReplies = categories.reduce((sum, c) => sum + c.replyCount, 0);

  return (
    <div>

        {/* En-tête */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground tracking-wide">Forum</h1>
          <p className="text-muted mt-1 text-sm">
            Discussions, stratégies et communauté Age of Empires France.
          </p>
        </div>

        {/* Stats globales */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { label: "Catégories", value: categories.length, icon: MessageSquare },
            { label: "Sujets",     value: totalTopics,        icon: Pin           },
            { label: "Réponses",   value: totalReplies,       icon: Users         },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="bg-surface border border-border-site rounded-lg px-4 py-3 flex items-center gap-3">
              <Icon size={16} className="text-faint shrink-0" />
              <div>
                <div className="text-lg font-bold text-foreground tabular-nums">{value}</div>
                <div className="text-[10px] text-faint uppercase tracking-wider">{label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Catégories */}
        <div className="space-y-3">
          {categories.length === 0 && (
            <div className="text-center py-16 text-faint text-sm">
              Aucune catégorie pour le moment.
            </div>
          )}
          {categories.map((cat) => {
            const colorClass = COLOR_MAP[cat.color] ?? COLOR_MAP.amber;
            return (
              <Link
                key={cat.id}
                href={`/forum/${cat.slug}`}
                className="block bg-surface border border-border-site rounded-xl p-5 hover:border-[#c8a32e]/30 transition-colors group"
              >
                <div className="flex items-start gap-4">
                  {/* Icône */}
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg shrink-0 ${colorClass}`}>
                    {cat.icon || "💬"}
                  </div>

                  {/* Contenu principal */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-foreground text-base group-hover:text-[#c8a32e] transition-colors">
                        {cat.name}
                      </span>
                    </div>
                    {cat.description && (
                      <p className="text-sm text-faint mt-0.5 truncate">{cat.description}</p>
                    )}
                    {cat.lastTopicTitle && (
                      <p className="text-xs text-faint mt-2 flex items-center gap-1.5">
                        <Clock size={10} />
                        <span className="truncate">
                          <span className="text-muted">{cat.lastUsername}</span>
                          {" · "}
                          <span className="italic">{cat.lastTopicTitle}</span>
                          {cat.lastActivity && (
                            <span className="ml-1">· {timeAgo(cat.lastActivity)}</span>
                          )}
                        </span>
                      </p>
                    )}
                  </div>

                  {/* Compteurs */}
                  <div className="shrink-0 text-right space-y-1 hidden sm:block">
                    <div className="text-sm font-semibold text-foreground tabular-nums">{cat.topicCount}</div>
                    <div className="text-[10px] text-faint uppercase tracking-wider">Sujets</div>
                    <div className="text-sm font-semibold text-foreground tabular-nums mt-2">{cat.replyCount}</div>
                    <div className="text-[10px] text-faint uppercase tracking-wider">Réponses</div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* CTA connexion */}
        {!session && (
          <div className="mt-8 bg-surface border border-border-site rounded-xl p-6 text-center">
            <p className="text-muted text-sm mb-3">Connectez-vous pour participer aux discussions.</p>
            <div className="flex gap-3 justify-center">
              <LoginButton className="px-5 py-2 rounded-lg bg-[#c8a32e] hover:bg-[#b8922a] text-[#080e1a] font-bold text-sm transition-colors">
                Se connecter
              </LoginButton>
              <LoginButton className="px-5 py-2 rounded-lg border border-border-site text-muted hover:text-foreground text-sm transition-colors">
                S&apos;inscrire
              </LoginButton>
            </div>
          </div>
        )}
    </div>
  );
}

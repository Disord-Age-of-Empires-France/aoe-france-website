import Link from "next/link";
import { getArticles, getUsers, getLogs, getSettings } from "@/lib/db";
import { requireBOAccess } from "@/lib/auth-check";
import { Newspaper, Settings, Plus, ExternalLink, Users, Clock, CheckCircle, XCircle } from "lucide-react";
import DiscordIcon from "@/components/DiscordIcon";

export const metadata = { title: "Tableau de bord" };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso.length === 10 ? iso + "T12:00:00" : iso).getTime();
  const m  = Math.floor(ms / 60_000);
  if (m < 1)   return "À l'instant";
  if (m < 60)  return `Il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `Il y a ${h}h`;
  const d = Math.floor(h / 24);
  if (d < 30)  return `Il y a ${d} jour${d > 1 ? "s" : ""}`;
  const mo = Math.floor(d / 30);
  return `Il y a ${mo} mois`;
}

// ─── Components ───────────────────────────────────────────────────────────────

function StatCard({
  label, value, icon: Icon, color = "gold",
}: {
  label: string;
  value: number | string;
  icon:  React.ComponentType<{ size?: number; className?: string }>;
  color?: "gold" | "green" | "blue" | "gray";
}) {
  const colors = {
    gold:  "text-[#c8a32e] bg-[#c8a32e]/10",
    green: "text-emerald-400 bg-emerald-400/10",
    blue:  "text-blue-400 bg-blue-400/10",
    gray:  "text-muted bg-border-site/30",
  };
  return (
    <div className="bg-surface border border-border-site rounded-lg p-5 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-lg flex items-center justify-center shrink-0 ${colors[color]}`}>
        <Icon size={20} />
      </div>
      <div className="min-w-0">
        <div className="text-2xl font-bold text-foreground truncate">{value}</div>
        <div className="text-xs text-faint font-medium tracking-wide">{label}</div>
      </div>
    </div>
  );
}

function DistributionPanel({
  title, items, barColor,
}: {
  title:    string;
  items:    { label: string; count: number }[];
  barColor: string;
}) {
  const max = Math.max(...items.map((i) => i.count), 1);
  return (
    <div className="bg-surface border border-border-site rounded-lg p-5 flex flex-col">
      <h2 className="font-bold text-foreground text-sm tracking-wide mb-4">{title}</h2>
      <div className="flex flex-col flex-1 justify-between gap-3">
        {items.map((item) => (
          <div key={item.label} className="space-y-1">
            <div className="flex justify-between text-[11px]">
              <span className="text-muted font-medium">{item.label}</span>
              <span className="text-faint tabular-nums">{item.count}</span>
            </div>
            <div className="h-1.5 bg-surface-2 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                style={{ width: `${(item.count / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Constants ────────────────────────────────────────────────────────────────

const BADGE_CLASSES: Record<string, string> = {
  blue:   "bg-blue-800/60 text-blue-300",
  green:  "bg-green-800/60 text-green-300",
  amber:  "bg-amber-800/60 text-amber-300",
  purple: "bg-purple-800/60 text-purple-300",
  red:    "bg-red-800/60 text-red-300",
};

const GAME_CATS  = ["AOE II", "AOE III", "AOE IV", "AOM: RETOLD"] as const;
const TYPE_CATS  = ["GUIDE", "TOURNOI", "ÉVÉNEMENT", "MIS À JOUR"] as const;

const ACTION_MAP: Record<string, { verb: string; color: string }> = {
  "article.create":     { verb: "a créé l'article",             color: "text-emerald-400" },
  "article.update":     { verb: "a modifié l'article",          color: "text-blue-400"    },
  "article.publish":    { verb: "a publié l'article",           color: "text-emerald-400" },
  "article.archive":    { verb: "a archivé l'article",          color: "text-amber-400"   },
  "article.unpublish":  { verb: "a dépublié l'article",         color: "text-amber-400"   },
  "article.delete":     { verb: "a supprimé l'article",         color: "text-red-400"     },
  "article.schedule":   { verb: "a programmé l'article",        color: "text-blue-400"    },
  "settings.update":    { verb: "a mis à jour les paramètres",  color: "text-blue-400"    },
  "bot.command_create": { verb: "a créé la commande bot",       color: "text-emerald-400" },
  "bot.command_update": { verb: "a modifié la commande bot",    color: "text-blue-400"    },
  "bot.command_delete": { verb: "a supprimé la commande bot",   color: "text-red-400"     },
  "user.create":        { verb: "a créé le compte",             color: "text-emerald-400" },
  "user.role_change":   { verb: "a changé le rôle →",          color: "text-amber-400"   },
  "user.update":        { verb: "a modifié le compte",          color: "text-blue-400"    },
  "user.delete":        { verb: "a supprimé le compte",         color: "text-red-400"     },
  "auth.login":         { verb: "s'est connecté",               color: "text-sky-400"     },
  "auth.login_discord": { verb: "s'est connecté via Discord",   color: "text-indigo-400"  },
  "auth.logout":        { verb: "s'est déconnecté",             color: "text-slate-400"   },
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  await requireBOAccess();
  const [articles, users, logs, settings] = await Promise.all([
    getArticles(),
    getUsers(),
    getLogs(5),
    getSettings(),
  ]);

  const published   = articles.filter((a) => a.status === "published");
  const lastPub     = published
    .filter((a) => a.publishedAt)
    .sort((a, b) => new Date(b.publishedAt!).getTime() - new Date(a.publishedAt!).getTime())[0]
    ?? published[0];
  const discordOk   = settings.discordInvite !== "#discord";
  const recent = [...articles]
    .sort((a, b) => {
      if (!a.createdAt) return 1;
      if (!b.createdAt) return -1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    })
    .slice(0, 7);

  const byGame = GAME_CATS.map((g) => ({
    label: g,
    count: articles.filter((a) => a.categories.includes(g)).length,
  }));
  const byType = TYPE_CATS.map((t) => ({
    label: t,
    count: articles.filter((a) => a.categories.includes(t)).length,
  }));

  return (
    <div className="space-y-6">

      {/* ── En-tête ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-wide">Tableau de bord</h1>
          <p className="text-faint text-sm mt-1">
            Bienvenue dans l&apos;espace d&apos;administration d&apos;Age of Empires France.
          </p>
        </div>
        <Link
          href="/admin/actualites/nouveau"
          className="hidden sm:flex items-center gap-2 bg-[#c8a32e] hover:bg-[#b8922a] text-[#080e1a] font-bold text-sm tracking-wider px-5 py-2.5 rounded transition-colors"
        >
          <Plus size={15} />Nouvel article
        </Link>
      </div>

      {/* ── Ligne 1 : 4 cartes ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Articles */}
        <StatCard label="Articles" value={articles.length} icon={Newspaper} color="gold" />

        {/* Utilisateurs */}
        <StatCard label="Utilisateurs" value={users.length} icon={Users} color="blue" />

        {/* Dernière publication */}
        <div className="bg-surface border border-border-site rounded-lg p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0 text-[#c8a32e] bg-[#c8a32e]/10">
            <Clock size={20} />
          </div>
          <div className="min-w-0">
            {lastPub ? (
              <>
                <div className="text-lg font-bold text-foreground truncate leading-tight">
                  {timeAgo(lastPub.publishedAt ?? lastPub.date)}
                </div>
                <div className="text-[11px] text-faint font-medium tracking-wide truncate mt-0.5">
                  {lastPub.title}
                </div>
              </>
            ) : (
              <div className="text-sm text-faint">Aucune publication</div>
            )}
            <div className="text-[10px] text-faint tracking-wide mt-0.5">Dernière publication</div>
          </div>
        </div>

        {/* Discord */}
        <div className="bg-surface border border-border-site rounded-lg p-5 flex items-center gap-4">
          <div className={`w-11 h-11 rounded-lg flex items-center justify-center shrink-0 ${discordOk ? "text-indigo-400 bg-indigo-400/10" : "text-amber-400 bg-amber-400/10"}`}>
            <DiscordIcon size={20} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              {discordOk
                ? <CheckCircle size={13} className="text-emerald-400 shrink-0" />
                : <XCircle    size={13} className="text-amber-400  shrink-0" />
              }
              <span className={`text-sm font-bold ${discordOk ? "text-emerald-400" : "text-amber-400"}`}>
                {discordOk ? "Configuré" : "Non configuré"}
              </span>
            </div>
            {discordOk
              ? <div className="text-[11px] text-faint truncate mt-0.5">{settings.discordInvite}</div>
              : <Link href="/admin/parametres" className="text-[11px] text-amber-400 hover:underline mt-0.5 block">Configurer →</Link>
            }
            <div className="text-[10px] text-faint tracking-wide mt-0.5">Discord</div>
          </div>
        </div>
      </div>

      {/* ── Ligne 2 : Distributions + Actions rapides ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <DistributionPanel title="Par jeu"  items={byGame} barColor="bg-[#c8a32e]"   />
        <DistributionPanel title="Par type" items={byType} barColor="bg-blue-500/70" />

        {/* Actions rapides */}
        <div className="bg-surface border border-border-site rounded-lg p-5">
          <h2 className="font-bold text-foreground text-sm tracking-wide mb-4">Actions rapides</h2>
          <div className="space-y-2">
            <Link href="/admin/actualites/nouveau" className="flex items-center gap-2.5 w-full bg-[#c8a32e]/10 hover:bg-[#c8a32e]/20 border border-[#c8a32e]/30 text-[#c8a32e] text-sm font-semibold px-4 py-2.5 rounded transition-colors">
              <Plus size={15} />Nouvel article
            </Link>
            <Link href="/admin/actualites" className="flex items-center gap-2.5 w-full bg-surface-2 border border-border-site text-muted hover:text-foreground text-sm font-semibold px-4 py-2.5 rounded transition-colors">
              <Newspaper size={15} />Gérer les articles
            </Link>
            <Link href="/admin/parametres" className="flex items-center gap-2.5 w-full bg-surface-2 border border-border-site text-muted hover:text-foreground text-sm font-semibold px-4 py-2.5 rounded transition-colors">
              <Settings size={15} />Paramètres
            </Link>
            <a href="/" target="_blank" className="flex items-center gap-2.5 w-full bg-surface-2 border border-border-site text-muted hover:text-foreground text-sm font-semibold px-4 py-2.5 rounded transition-colors">
              <ExternalLink size={15} />Voir le site
            </a>
          </div>
        </div>
      </div>

      {/* ── Ligne 3 : Derniers articles + Activité récente ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Derniers articles */}
        <div className="lg:col-span-2 bg-surface border border-border-site rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border-site">
            <h2 className="font-bold text-foreground text-sm tracking-wide">Derniers articles</h2>
            <Link href="/admin/actualites" className="text-[#c8a32e] hover:text-[#d4b040] text-xs font-medium transition-colors">
              Voir tout
            </Link>
          </div>
          <div className="divide-y divide-border-site">
            {recent.length === 0 && (
              <p className="px-5 py-8 text-center text-faint text-sm">Aucun article.</p>
            )}
            {recent.map((article) => (
              <div key={article.id} className="flex items-center gap-3 px-5 py-3.5">
                <span className={`text-[10px] font-bold tracking-wider px-2 py-0.5 rounded shrink-0 ${BADGE_CLASSES[article.badgeColor] ?? BADGE_CLASSES.blue}`}>
                  {article.badge}
                </span>
                <span className="flex-1 text-sm text-muted truncate">{article.title}</span>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded shrink-0 ${article.status === "published" ? "bg-emerald-900/50 text-emerald-400" : "bg-gray-800/50 text-gray-400"}`}>
                  {article.status === "published" ? "Publié" : "Brouillon"}
                </span>
                <Link href={`/admin/actualites/${article.id}`} className="text-faint hover:text-[#c8a32e] transition-colors shrink-0">
                  <ExternalLink size={13} />
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Activité récente */}
        <div className="bg-surface border border-border-site rounded-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-border-site">
            <h2 className="font-bold text-foreground text-sm tracking-wide">Activité récente</h2>
          </div>
          <div className="divide-y divide-border-site">
            {logs.length === 0 && (
              <p className="px-5 py-6 text-center text-faint text-xs">Aucune activité.</p>
            )}
            {logs.map((log) => {
              const mapped = ACTION_MAP[log.action];
              return (
                <div key={log.id} className="px-5 py-3 flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-[#c8a32e]/15 text-[#c8a32e] flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                    {log.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] leading-snug">
                      <span className="font-semibold text-foreground">{log.username}</span>
                      {" "}
                      <span className={mapped?.color ?? "text-faint"}>
                        {mapped?.verb ?? log.action}
                      </span>
                    </p>
                    {log.target && (
                      <p className="text-[11px] text-muted italic truncate mt-0.5">
                        &laquo;{log.target}&raquo;
                      </p>
                    )}
                    <p className="text-[10px] text-faint mt-0.5">{timeAgo(log.createdAt)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

    </div>
  );
}

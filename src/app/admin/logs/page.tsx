import Link from "next/link";
import { Clock, User, Tag, Search, X } from "lucide-react";
import { requireAdminAccess } from "@/lib/auth-check";
import { getLogs } from "@/lib/db";
import type { Log } from "@/lib/db";

export const metadata = { title: "Logs — Administration" };

function formatDateTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
    }).format(new Date(iso));
  } catch { return iso; }
}

const ACTION_CONFIG: Record<string, { label: string; color: string }> = {
  "auth.login":            { label: "Connexion",             color: "text-emerald-400 bg-emerald-900/30 border-emerald-700/40" },
  "auth.login_discord":    { label: "Connexion Discord",     color: "text-indigo-400 bg-indigo-900/30 border-indigo-700/40" },
  "auth.logout":           { label: "Déconnexion",           color: "text-gray-400 bg-gray-800/40 border-gray-700/40" },
  "article.create":        { label: "Article créé",          color: "text-blue-400 bg-blue-900/30 border-blue-700/40" },
  "article.schedule":      { label: "Article planifié",      color: "text-violet-400 bg-violet-900/30 border-violet-700/40" },
  "article.update":        { label: "Article modifié",       color: "text-cyan-400 bg-cyan-900/30 border-cyan-700/40" },
  "article.publish":       { label: "Article publié",        color: "text-emerald-400 bg-emerald-900/30 border-emerald-700/40" },
  "article.archive":       { label: "Article archivé",       color: "text-orange-400 bg-orange-900/30 border-orange-700/40" },
  "article.unpublish":     { label: "Article dépublié",      color: "text-yellow-400 bg-yellow-900/30 border-yellow-700/40" },
  "article.delete":        { label: "Article supprimé",      color: "text-red-400 bg-red-900/30 border-red-700/40" },
  "user.create":           { label: "Utilisateur créé",      color: "text-violet-400 bg-violet-900/30 border-violet-700/40" },
  "user.update":           { label: "Utilisateur modifié",   color: "text-purple-400 bg-purple-900/30 border-purple-700/40" },
  "user.role_change":      { label: "Rôle modifié",          color: "text-amber-400 bg-amber-900/30 border-amber-700/40" },
  "user.delete":           { label: "Utilisateur supprimé",  color: "text-rose-400 bg-rose-900/30 border-rose-700/40" },
  "user.delete_self":      { label: "Compte supprimé",       color: "text-rose-400 bg-rose-900/30 border-rose-700/40" },
  "settings.update":       { label: "Paramètres modifiés",   color: "text-sky-400 bg-sky-900/30 border-sky-700/40" },
  "bot.command_create":    { label: "Commande bot créée",    color: "text-teal-400 bg-teal-900/30 border-teal-700/40" },
  "bot.command_update":    { label: "Commande bot modifiée", color: "text-teal-400 bg-teal-900/30 border-teal-700/40" },
  "bot.command_delete":    { label: "Commande bot supprimée",color: "text-red-400 bg-red-900/30 border-red-700/40" },
  "forum.topic_approve":   { label: "Sujet approuvé",        color: "text-emerald-400 bg-emerald-900/30 border-emerald-700/40" },
  "forum.topic_reject":    { label: "Sujet rejeté",          color: "text-orange-400 bg-orange-900/30 border-orange-700/40" },
  "forum.topic_delete":    { label: "Sujet supprimé",        color: "text-red-400 bg-red-900/30 border-red-700/40" },
  "forum.report_resolve":  { label: "Signalement résolu",    color: "text-sky-400 bg-sky-900/30 border-sky-700/40" },
};

const ROLE_COLORS: Record<string, string> = {
  admin:  "bg-amber-800/60 text-amber-300",
  editor: "bg-blue-800/60 text-blue-300",
  member: "bg-gray-800/60 text-gray-400",
};

const LOG_CATEGORIES = [
  { id: "tous",     label: "Tous"         },
  { id: "auth",     label: "Auth"         },
  { id: "article",  label: "Articles"     },
  { id: "user",     label: "Utilisateurs" },
  { id: "settings", label: "Paramètres"   },
  { id: "bot",      label: "Bot"          },
  { id: "forum",    label: "Forum"        },
];

function MetaDetail({ log }: { log: Log }) {
  const m = log.meta;
  if (!m) return null;

  // Settings: render as a bullet list of changes
  if (Array.isArray(m.changes) && (m.changes as string[]).length > 0) {
    return (
      <ul className="mt-1.5 space-y-0.5">
        {(m.changes as string[]).map((change, i) => (
          <li key={i} className="text-[11px] text-faint flex items-start gap-1">
            <span className="text-[#c8a32e]/60 shrink-0 mt-px">·</span>
            {change}
          </li>
        ))}
      </ul>
    );
  }

  const parts: { key: string; value: string }[] = [];
  const seen = new Set<string>();
  function add(key: string, value: string) {
    if (!seen.has(key)) { seen.add(key); parts.push({ key, value }); }
  }

  if (m.previousStatus && m.status) {
    add("statut", `${m.previousStatus} → ${m.status}`);
  } else if (m.status) {
    add("statut", String(m.status));
  }
  if (Array.isArray(m.categories) && m.categories.length > 0) {
    add("jeux", (m.categories as string[]).join(", "));
  }
  if (m.scheduledAt) {
    try {
      add("planifié", new Date(String(m.scheduledAt)).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }));
    } catch { /* ignore */ }
  }
  if (m.from && m.to) {
    add("rôle", `${m.from} → ${m.to}`);
  } else if (m.role) {
    add("rôle", String(m.role));
  }
  if (m.email) add("email", String(m.email));
  if (m.category) add("catégorie", String(m.category));
  if (m.description) add("description", String(m.description));
  if (m.author) add("auteur", String(m.author));
  if (m.reason) add("raison", String(m.reason).slice(0, 100));
  if (m.reporter) add("signalé par", String(m.reporter));
  if (m.targetType) add("type", m.targetType === "topic" ? "sujet" : "réponse");

  if (parts.length === 0) return null;

  return (
    <div className="mt-1.5 flex flex-wrap gap-1.5">
      {parts.map(({ key, value }) => (
        <span key={key} className="inline-flex items-center gap-1 text-[11px] text-faint bg-surface-3/60 border border-border-site/60 rounded px-1.5 py-0.5">
          <span className="text-faint/60">{key}:</span>
          <span className="text-muted">{value}</span>
        </span>
      ))}
    </div>
  );
}

interface Props {
  searchParams: Promise<{ cat?: string; user?: string }>;
}

export default async function LogsPage({ searchParams }: Props) {
  await requireAdminAccess();

  const { cat = "tous", user = "" } = await searchParams;
  const activeCategory = LOG_CATEGORIES.some((c) => c.id === cat) ? cat : "tous";
  const userFilter = user.trim();

  const logs = await getLogs(500, {
    category: activeCategory !== "tous" ? activeCategory : undefined,
    username: userFilter || undefined,
  });

  const hasFilter = activeCategory !== "tous" || Boolean(userFilter);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-wide">Logs d&apos;activité</h1>
        <p className="text-faint text-sm mt-1">
          {logs.length} entrée{logs.length !== 1 ? "s" : ""}
          {logs.length === 500 && " (limite atteinte)"}
          {hasFilter && " — filtrées"}
        </p>
      </div>

      {/* Barre de filtres */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1.5 flex-wrap">
          {LOG_CATEGORIES.map(({ id, label }) => (
            <Link
              key={id}
              href={`/admin/logs?cat=${id}${userFilter ? `&user=${encodeURIComponent(userFilter)}` : ""}`}
              className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors ${
                activeCategory === id
                  ? "bg-[#c8a32e] text-[#080e1a]"
                  : "bg-surface border border-border-site text-muted hover:text-foreground"
              }`}
            >
              {label}
            </Link>
          ))}
        </div>

        <form method="GET" className="flex items-center gap-2 ml-auto">
          <input type="hidden" name="cat" value={activeCategory} />
          <div className="relative">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-faint pointer-events-none" />
            <input
              name="user"
              type="search"
              defaultValue={userFilter}
              placeholder="Utilisateur…"
              className="pl-8 pr-3 py-1.5 bg-surface border border-border-site rounded text-xs text-foreground placeholder-faint focus:border-[#c8a32e] focus:outline-none w-40 transition-colors"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 bg-surface border border-border-site rounded text-xs text-muted hover:text-foreground transition-colors"
          >
            Filtrer
          </button>
          {hasFilter && (
            <Link
              href="/admin/logs"
              className="flex items-center gap-1 text-xs text-faint hover:text-red-400 transition-colors"
            >
              <X size={11} /> Effacer
            </Link>
          )}
        </form>
      </div>

      {logs.length === 0 ? (
        <div className="bg-surface border border-border-site rounded-lg p-12 text-center text-faint">
          Aucune action correspondant aux filtres.
        </div>
      ) : (
        <div className="bg-surface border border-border-site rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-site text-[10px] font-bold tracking-wider text-faint uppercase">
                <th className="px-4 py-3 text-left w-36">
                  <span className="flex items-center gap-1.5"><Clock size={11} /> Date</span>
                </th>
                <th className="px-4 py-3 text-left w-36">
                  <span className="flex items-center gap-1.5"><User size={11} /> Utilisateur</span>
                </th>
                <th className="px-4 py-3 text-left">
                  <span className="flex items-center gap-1.5"><Tag size={11} /> Action &amp; détails</span>
                </th>
                <th className="px-4 py-3 text-left w-56">Cible</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-site">
              {logs.map((log) => {
                const cfg = ACTION_CONFIG[log.action];
                return (
                  <tr key={log.id} className="hover:bg-surface-2 transition-colors align-top">
                    <td className="px-4 py-3 text-faint text-xs font-mono whitespace-nowrap">
                      {formatDateTime(log.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-muted font-medium text-sm">{log.username}</span>
                        {log.role && (
                          <span className={`text-[9px] font-bold tracking-wider px-1.5 py-0.5 rounded self-start ${ROLE_COLORS[log.role] ?? ROLE_COLORS.member}`}>
                            {log.role}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex text-[11px] font-bold tracking-wider px-2.5 py-1 rounded border ${cfg?.color ?? "text-gray-400 bg-gray-800/40 border-gray-700/40"}`}>
                        {cfg?.label ?? log.action}
                      </span>
                      <MetaDetail log={log} />
                    </td>
                    <td className="px-4 py-3 text-muted text-xs max-w-[14rem] truncate">
                      {log.target ?? <span className="text-faint">—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

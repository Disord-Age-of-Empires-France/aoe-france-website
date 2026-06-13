import { Clock, User, Tag, FileText } from "lucide-react";
import { requireAdminAccess } from "@/lib/auth-check";
import { getLogs } from "@/lib/db";

export const metadata = { title: "Logs — Administration" };

function formatDateTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
    }).format(new Date(iso));
  } catch { return iso; }
}

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  "auth.login":          { label: "Connexion",             color: "text-emerald-400 bg-emerald-900/30 border-emerald-700/40" },
  "auth.login_discord":  { label: "Connexion Discord",     color: "text-indigo-400 bg-indigo-900/30 border-indigo-700/40" },
  "auth.logout":         { label: "Déconnexion",           color: "text-gray-400 bg-gray-800/40 border-gray-700/40" },
  "article.create":      { label: "Article créé",          color: "text-blue-400 bg-blue-900/30 border-blue-700/40" },
  "article.update":      { label: "Article modifié",       color: "text-cyan-400 bg-cyan-900/30 border-cyan-700/40" },
  "article.publish":     { label: "Article publié",        color: "text-emerald-400 bg-emerald-900/30 border-emerald-700/40" },
  "article.archive":     { label: "Article archivé",       color: "text-orange-400 bg-orange-900/30 border-orange-700/40" },
  "article.unpublish":   { label: "Article dépublié",      color: "text-yellow-400 bg-yellow-900/30 border-yellow-700/40" },
  "article.delete":      { label: "Article supprimé",      color: "text-red-400 bg-red-900/30 border-red-700/40" },
  "user.create":         { label: "Utilisateur créé",      color: "text-violet-400 bg-violet-900/30 border-violet-700/40" },
  "user.update":         { label: "Utilisateur modifié",   color: "text-purple-400 bg-purple-900/30 border-purple-700/40" },
  "user.role_change":    { label: "Rôle modifié",          color: "text-amber-400 bg-amber-900/30 border-amber-700/40" },
  "user.delete":         { label: "Utilisateur supprimé",  color: "text-rose-400 bg-rose-900/30 border-rose-700/40" },
  "settings.update":       { label: "Paramètres modifiés",    color: "text-sky-400 bg-sky-900/30 border-sky-700/40" },
  "bot.command_create":    { label: "Commande bot créée",     color: "text-teal-400 bg-teal-900/30 border-teal-700/40" },
  "bot.command_update":    { label: "Commande bot modifiée",  color: "text-teal-400 bg-teal-900/30 border-teal-700/40" },
  "bot.command_delete":    { label: "Commande bot supprimée", color: "text-red-400 bg-red-900/30 border-red-700/40" },
};

const ROLE_COLORS: Record<string, string> = {
  admin:  "bg-amber-800/60 text-amber-300",
  editor: "bg-blue-800/60 text-blue-300",
  member: "bg-gray-800/60 text-gray-400",
};

export default async function LogsPage() {
  await requireAdminAccess();

  const logs = await getLogs(500);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-wide">Logs d&apos;activité</h1>
        <p className="text-faint text-sm mt-1">
          {logs.length} entrée{logs.length !== 1 ? "s" : ""} — 500 dernières actions
        </p>
      </div>

      {logs.length === 0 ? (
        <div className="bg-surface border border-border-site rounded-lg p-12 text-center text-faint">
          Aucune action enregistrée pour le moment.
        </div>
      ) : (
        <div className="bg-surface border border-border-site rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-site text-[10px] font-bold tracking-wider text-faint uppercase">
                <th className="px-4 py-3 text-left">
                  <span className="flex items-center gap-1.5"><Clock size={11} /> Date</span>
                </th>
                <th className="px-4 py-3 text-left">
                  <span className="flex items-center gap-1.5"><User size={11} /> Utilisateur</span>
                </th>
                <th className="px-4 py-3 text-left">
                  <span className="flex items-center gap-1.5"><Tag size={11} /> Action</span>
                </th>
                <th className="px-4 py-3 text-left">
                  <span className="flex items-center gap-1.5"><FileText size={11} /> Cible</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-site">
              {logs.map((log) => {
                const meta = ACTION_LABELS[log.action];
                return (
                  <tr key={log.id} className="hover:bg-surface-2 transition-colors">
                    <td className="px-4 py-3 text-faint text-xs font-mono whitespace-nowrap">
                      {formatDateTime(log.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-muted font-medium">{log.username}</span>
                        {log.role && (
                          <span className={`text-[9px] font-bold tracking-wider px-1.5 py-0.5 rounded ${ROLE_COLORS[log.role] ?? ROLE_COLORS.member}`}>
                            {log.role}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[11px] font-bold tracking-wider px-2.5 py-1 rounded border ${meta?.color ?? "text-gray-400 bg-gray-800/40 border-gray-700/40"}`}>
                        {meta?.label ?? log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted text-xs max-w-xs truncate">
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

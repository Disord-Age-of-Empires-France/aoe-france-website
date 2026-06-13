import Link from "next/link";
import { getUsers } from "@/lib/db";
import { requireBOAccess } from "@/lib/auth-check";
import { Plus, Pencil, Shield, UserIcon } from "lucide-react";
import DiscordIcon from "@/components/DiscordIcon";
import UserDeleteButton from "@/components/admin/UserDeleteButton";

export const metadata = { title: "Utilisateurs" };

const ROLE_BADGE: Record<string, string> = {
  admin:  "bg-amber-800/60 text-amber-300",
  editor: "bg-blue-800/60 text-blue-300",
  member: "bg-gray-800/60 text-gray-400",
};

const ROLE_LABEL: Record<string, string> = {
  admin:  "Admin",
  editor: "Éditeur",
  member: "Membre",
};

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric", month: "short", year: "numeric",
  }).format(new Date(iso));
}

export default async function UsersPage() {
  const [users, session] = await Promise.all([getUsers(), requireBOAccess()]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-wide">Utilisateurs</h1>
          <p className="text-faint text-sm mt-1">
            {users.length} utilisateur{users.length !== 1 ? "s" : ""} au total
          </p>
        </div>
        <Link
          href="/admin/utilisateurs/nouveau"
          className="flex items-center gap-2 bg-[#c8a32e] hover:bg-[#b8922a] text-[#080e1a] font-bold text-sm tracking-wider px-5 py-2.5 rounded transition-colors"
        >
          <Plus size={15} />
          Nouvel utilisateur
        </Link>
      </div>

      <div className="bg-surface border border-border-site rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-site">
              <th className="text-left px-5 py-3.5 text-xs font-semibold tracking-wider text-faint uppercase">Utilisateur</th>
              <th className="text-left px-4 py-3.5 text-xs font-semibold tracking-wider text-faint uppercase hidden sm:table-cell">Rôle</th>
              <th className="text-left px-4 py-3.5 text-xs font-semibold tracking-wider text-faint uppercase hidden md:table-cell">Email</th>
              <th className="text-left px-4 py-3.5 text-xs font-semibold tracking-wider text-faint uppercase hidden lg:table-cell">Dernière connexion</th>
              <th className="px-4 py-3.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border-site">
            {users.map((user) => {
              const isSelf = session?.userId === user.id;
              return (
                <tr key={user.id} className="hover:bg-surface-2 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-surface-2 border border-border-site flex items-center justify-center text-muted shrink-0">
                        {user.role === "admin"
                          ? <Shield size={14} />
                          : <UserIcon size={14} />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 text-foreground font-medium">
                          {user.displayName || user.username}
                          {isSelf && (
                            <span className="text-[10px] font-semibold tracking-wider text-[#c8a32e] bg-[#c8a32e]/10 px-1.5 py-0.5 rounded">
                              VOUS
                            </span>
                          )}
                          {user.discordId && (
                            <span
                              title={`Discord ID : ${user.discordId}`}
                              className="flex items-center gap-1 text-[10px] font-semibold text-indigo-400 bg-indigo-900/30 border border-indigo-800/40 px-1.5 py-0.5 rounded cursor-default select-all"
                            >
                              <DiscordIcon size={10} />
                              {user.discordId}
                            </span>
                          )}
                        </div>
                        <div className="text-faint text-xs">@{user.username}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 hidden sm:table-cell">
                    <span className={`text-[10px] font-bold tracking-wider px-2 py-0.5 rounded ${ROLE_BADGE[user.role] ?? ROLE_BADGE.member}`}>
                      {ROLE_LABEL[user.role] ?? "Membre"}
                    </span>
                  </td>
                  <td className="px-4 py-4 hidden md:table-cell">
                    <span className="text-faint text-xs">{user.email || "—"}</span>
                  </td>
                  <td className="px-4 py-4 hidden lg:table-cell">
                    <span className="text-faint text-xs">{formatDate(user.lastLogin)}</span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-4 justify-end">
                      <Link
                        href={`/admin/utilisateurs/${user.id}`}
                        className="flex items-center gap-1.5 text-faint hover:text-[#c8a32e] text-sm font-medium transition-colors"
                      >
                        <Pencil size={13} />Modifier
                      </Link>
                      {!isSelf && (
                        <UserDeleteButton id={user.id} username={user.displayName || user.username} />
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

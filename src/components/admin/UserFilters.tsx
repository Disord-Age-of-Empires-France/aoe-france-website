"use client";

import { useState } from "react";
import Link from "next/link";
import { Calendar, Eye, EyeOff, Globe, Lock, MapPin, Pencil, Search, Shield, UserIcon, X } from "lucide-react";
import type { User } from "@/lib/db";
import DiscordIcon from "@/components/DiscordIcon";
import UserDeleteButton from "./UserDeleteButton";

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

const CHIP = "px-3 py-1.5 rounded text-[11px] font-bold tracking-wider border transition-colors cursor-pointer";
const CHIP_OFF = `${CHIP} border-border-site text-faint hover:border-[#c8a32e]/50 hover:text-muted`;
const CHIP_ON  = `${CHIP} border-[#c8a32e]/40 bg-[#c8a32e]/10 text-[#c8a32e]`;

const ROLE_FILTERS = [
  { value: "all",    label: "Tous"      },
  { value: "admin",  label: "Admins"    },
  { value: "editor", label: "Éditeurs"  },
  { value: "member", label: "Membres"   },
] as const;

type RoleFilter = typeof ROLE_FILTERS[number]["value"];

interface Props {
  users:         User[];
  currentUserId: string;
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", year: "numeric" }).format(new Date(iso));
}

export default function UserFilters({ users, currentUserId }: Props) {
  const [search,      setSearch]      = useState("");
  const [roleFilter,  setRoleFilter]  = useState<RoleFilter>("all");
  const [previewUser, setPreviewUser] = useState<User | null>(null);

  const filtered = users.filter((u) => {
    if (roleFilter !== "all" && u.role !== roleFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const name = `${u.username} ${u.displayName} ${u.email}`.toLowerCase();
      if (!name.includes(q)) return false;
    }
    return true;
  });

  const hasFilters = search || roleFilter !== "all";

  return (
    <div className="bg-surface border border-border-site rounded-lg overflow-hidden">
      {/* Search + role chips */}
      <div className="px-4 py-3 border-b border-border-site flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-44">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par nom, email…"
            className="w-full bg-background border border-border-site rounded pl-8 pr-4 py-2 text-sm text-foreground placeholder-faint focus:outline-none focus:border-[#c8a32e] transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-bold tracking-widest text-faint uppercase shrink-0">Rôle</span>
          {ROLE_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setRoleFilter(f.value)}
              className={roleFilter === f.value ? CHIP_ON : CHIP_OFF}
            >
              {f.label}
            </button>
          ))}
        </div>

        {hasFilters && (
          <button
            type="button"
            onClick={() => { setSearch(""); setRoleFilter("all"); }}
            className="flex items-center gap-1 text-[11px] text-faint hover:text-red-400 transition-colors"
          >
            <X size={12} />Réinitialiser
          </button>
        )}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="px-6 py-12 text-center text-faint text-sm">
          Aucun utilisateur ne correspond aux filtres.
        </div>
      ) : (
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
            {filtered.map((user) => {
              const isSelf = currentUserId === user.id;
              return (
                <tr key={user.id} className="hover:bg-surface-2 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-surface-2 border border-border-site flex items-center justify-center text-muted shrink-0">
                        {user.role === "admin" ? <Shield size={14} /> : <UserIcon size={14} />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 text-foreground font-medium">
                          {user.displayName || user.username}
                          {isSelf && (
                            <span className="text-[10px] font-semibold tracking-wider text-[#c8a32e] bg-[#c8a32e]/10 px-1.5 py-0.5 rounded">VOUS</span>
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
                      <button
                        type="button"
                        onClick={() => setPreviewUser(user)}
                        className="flex items-center gap-1.5 text-faint hover:text-[#c8a32e] text-sm font-medium transition-colors"
                        title={user.profilePublic ? "Profil public" : "Profil privé"}
                      >
                        {user.profilePublic ? <Eye size={13} /> : <EyeOff size={13} />}
                        Profil
                      </button>
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
      )}

      {hasFilters && filtered.length > 0 && (
        <div className="px-5 py-2.5 border-t border-border-site text-[11px] text-faint">
          {filtered.length} résultat{filtered.length !== 1 ? "s" : ""} sur {users.length}
        </div>
      )}

      {previewUser && (
        <UserProfileModal user={previewUser} onClose={() => setPreviewUser(null)} />
      )}
    </div>
  );
}

// ─── Modale profil ─────────────────────────────────────────────────────────────

const PREVIEW_ROLE_BADGE: Record<string, { label: string; cls: string }> = {
  admin:  { label: "Administrateur", cls: "text-amber-400 bg-amber-900/20 border-amber-800/40" },
  editor: { label: "Éditeur",         cls: "text-blue-400  bg-blue-900/20  border-blue-800/40"  },
  member: { label: "Membre",          cls: "text-faint     bg-surface-2    border-border-site"   },
};

const SOCIAL_LABEL: Record<string, string> = {
  twitch: "Twitch", youtube: "YouTube", twitter: "Twitter / X",
  discord: "Discord", steam: "Steam", tiktok: "TikTok",
  instagram: "Instagram", github: "GitHub", site_web: "Site web",
};

function UserProfileModal({ user, onClose }: { user: User; onClose: () => void }) {
  const avatar   = user.avatar || user.discordAvatar;
  const initials = (user.displayName || user.username).slice(0, 2).toUpperCase();
  const badge    = PREVIEW_ROLE_BADGE[user.role] ?? PREVIEW_ROLE_BADGE.member;
  const joinDate = new Date(user.createdAt).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  const links    = user.socialLinks.filter((l) => l.type && l.url);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-[2px] p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-surface border border-border-site rounded-xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-site shrink-0">
          <div>
            <p className="text-sm font-bold text-foreground">Profil de {user.displayName || user.username}</p>
            <p className="text-xs text-faint mt-0.5">
              {user.profilePublic ? "Profil public" : "Profil privé — invisible aux autres membres"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-faint hover:text-foreground hover:bg-surface-2 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Contenu */}
        <div className="overflow-y-auto p-5 space-y-4">

          {/* Carte identité */}
          <div className="bg-surface-2 border border-border-site rounded-xl p-5 flex items-start gap-4">
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-border-site bg-surface flex items-center justify-center shrink-0">
              {avatar
                ? <img src={avatar} alt={user.displayName} className="w-full h-full object-cover" />
                : <span className="text-xl font-bold text-muted">{initials}</span>
              }
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-base font-black tracking-tight text-foreground">
                  {user.displayName || user.username}
                </span>
                <span className={`text-[10px] font-bold tracking-wider px-2 py-0.5 rounded border ${badge.cls}`}>
                  {badge.label}
                </span>
                {!user.profilePublic && (
                  <span className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded border text-faint bg-surface border-border-site flex items-center gap-1">
                    <Lock size={9} /> Privé
                  </span>
                )}
              </div>
              <p className="text-faint text-xs">@{user.username}</p>
              <p className="text-faint text-[11px] mt-1 flex items-center gap-1">
                <Calendar size={10} /> Membre depuis {joinDate}
              </p>
            </div>
          </div>

          {/* Ce que voient les autres membres */}
          {!user.profilePublic ? (
            <div className="bg-surface-2 border border-border-site rounded-xl p-8 text-center">
              <Lock size={24} className="text-faint mx-auto mb-2" />
              <p className="font-bold text-foreground text-sm mb-1">Ce profil est privé</p>
              <p className="text-faint text-xs">Les autres membres voient ce message à la place du profil.</p>
            </div>
          ) : (
            <>
              {user.bio && (
                <div className="bg-surface-2 border border-border-site rounded-xl p-5">
                  <p className="text-[10px] font-bold tracking-widest text-faint uppercase mb-2">À propos</p>
                  <p className="text-muted text-sm leading-relaxed whitespace-pre-line">{user.bio}</p>
                </div>
              )}

              {user.location && (
                <div className="bg-surface-2 border border-border-site rounded-xl px-5 py-3 flex items-center gap-2">
                  <MapPin size={13} className="text-faint shrink-0" />
                  <span className="text-muted text-sm">{user.location}</span>
                </div>
              )}

              {links.length > 0 && (
                <div className="bg-surface-2 border border-border-site rounded-xl p-5">
                  <p className="text-[10px] font-bold tracking-widest text-faint uppercase mb-3">Liens</p>
                  <div className="space-y-2">
                    {links.map((link, i) => (
                      <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 group">
                        <span className="w-20 shrink-0 text-[11px] font-semibold text-faint">
                          {SOCIAL_LABEL[link.type] ?? link.type}
                        </span>
                        <span className="text-muted group-hover:text-[#c8a32e] transition-colors text-xs truncate flex items-center gap-1">
                          <Globe size={10} className="text-faint shrink-0" />
                          {link.url}
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {!user.bio && !user.location && links.length === 0 && (
                <div className="bg-surface-2 border border-border-site rounded-xl p-8 text-center">
                  <p className="text-faint text-sm">Aucune information renseignée sur ce profil.</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

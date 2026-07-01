import { notFound } from "next/navigation";
import Link from "next/link";
import { Calendar, MapPin, Globe, Lock, ExternalLink, Pencil } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getUserByUsername, getSettings } from "@/lib/db";
import { getSession } from "@/lib/session";

const ROLE_BADGE: Record<string, { label: string; cls: string }> = {
  admin:  { label: "Administrateur", cls: "text-amber-400 bg-amber-900/20 border-amber-800/40" },
  editor: { label: "Éditeur",         cls: "text-blue-400  bg-blue-900/20  border-blue-800/40"  },
  member: { label: "Membre",          cls: "text-faint     bg-surface-2    border-border-site"   },
};

const SOCIAL_LABEL: Record<string, string> = {
  twitch: "Twitch", youtube: "YouTube", twitter: "Twitter / X",
  discord: "Discord", steam: "Steam", tiktok: "TikTok",
  instagram: "Instagram", github: "GitHub", site_web: "Site web",
};

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const user = await getUserByUsername(username);
  if (!user) return { title: "Membre introuvable | AoE France" };
  return { title: `${user.displayName || user.username} | AoE France` };
}

export default async function MemberProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;

  const [user, settings, session] = await Promise.all([
    getUserByUsername(username),
    getSettings(),
    getSession(),
  ]);

  if (!user) notFound();

  const isOwnProfile = session?.userId === user.id;
  const isPrivate    = !user.profilePublic;
  const avatar       = user.avatar || user.discordAvatar;
  const initials     = (user.displayName || user.username).slice(0, 2).toUpperCase();
  const badge        = ROLE_BADGE[user.role] ?? ROLE_BADGE.member;
  const joinDate     = new Date(user.createdAt).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar
        discordInvite={settings.discordInvite}
        session={session}
        features={{ ...settings.features, navItems: settings.navItems }}
        maintenanceActive={settings.maintenance.active}
        maintenanceEndAt={settings.maintenance.endAt}
      />

      <main className="flex-1 pt-32 pb-20 px-4">
        <div className="max-w-2xl mx-auto space-y-4">

          {/* Bannière aperçu (profil de l'utilisateur lui-même) */}
          {isOwnProfile && (
            <div className={`flex items-center justify-between gap-4 rounded-lg px-4 py-3 border text-sm ${
              isPrivate
                ? "bg-surface-2 border-border-site text-faint"
                : "bg-[#c8a32e]/10 border-[#c8a32e]/30 text-[#c8a32e]"
            }`}>
              <span className="flex items-center gap-2">
                {isPrivate
                  ? <><Lock size={13} /> Votre profil est <strong>privé</strong> — voici ce que voient les autres membres.</>
                  : <><Globe size={13} /> Votre profil est <strong>public</strong> — voici ce que voient les autres membres.</>
                }
              </span>
              <Link href="/profil" className="shrink-0 flex items-center gap-1.5 text-xs font-bold hover:underline">
                <Pencil size={11} /> Modifier
              </Link>
            </div>
          )}

          {/* Carte d'identité */}
          <div className="bg-surface border border-border-site rounded-xl p-6 flex items-start gap-6">
            <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-border-site bg-surface-2 flex items-center justify-center shrink-0">
              {avatar
                ? <img src={avatar} alt={user.displayName || user.username} className="w-full h-full object-cover" />
                : <span className="text-2xl font-bold text-muted">{initials}</span>
              }
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h1 className="text-xl font-black tracking-tight text-foreground">
                  {user.displayName || user.username}
                </h1>
                <span className={`text-[11px] font-bold tracking-wider px-2 py-0.5 rounded border ${badge.cls}`}>
                  {badge.label}
                </span>
                {isPrivate && (
                  <span className="text-[11px] font-bold tracking-wider px-2 py-0.5 rounded border text-faint bg-surface-2 border-border-site flex items-center gap-1">
                    <Lock size={10} /> Privé
                  </span>
                )}
              </div>
              <p className="text-faint text-sm">@{user.username}</p>
              <p className="text-faint text-xs mt-1.5 flex items-center gap-1.5">
                <Calendar size={11} />
                Membre depuis {joinDate}
              </p>
            </div>
          </div>

          {/* Contenu : privé ou public */}
          {isPrivate && !isOwnProfile ? (
            <div className="bg-surface border border-border-site rounded-xl p-10 text-center">
              <Lock size={28} className="text-faint mx-auto mb-3" />
              <p className="font-bold text-foreground mb-1">Ce profil est privé</p>
              <p className="text-faint text-sm">Cet utilisateur a choisi de ne pas partager ses informations.</p>
            </div>
          ) : (
            <>
              {user.bio && (
                <div className="bg-surface border border-border-site rounded-xl p-6">
                  <p className="text-[10px] font-bold tracking-widest text-faint uppercase mb-3">À propos</p>
                  <p className="text-muted text-sm leading-relaxed whitespace-pre-line">{user.bio}</p>
                </div>
              )}

              {user.location && (
                <div className="bg-surface border border-border-site rounded-xl px-6 py-4 flex items-center gap-3">
                  <MapPin size={14} className="text-faint shrink-0" />
                  <span className="text-muted text-sm">{user.location}</span>
                </div>
              )}

              {user.socialLinks.filter(l => l.type && l.url).length > 0 && (
                <div className="bg-surface border border-border-site rounded-xl p-6">
                  <p className="text-[10px] font-bold tracking-widest text-faint uppercase mb-4">Liens</p>
                  <div className="space-y-2.5">
                    {user.socialLinks.filter(l => l.type && l.url).map((link, i) => (
                      <a
                        key={i}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 text-sm group"
                      >
                        <span className="w-24 shrink-0 text-[11px] font-semibold text-faint">
                          {SOCIAL_LABEL[link.type] ?? link.type}
                        </span>
                        <span className="text-muted group-hover:text-[#c8a32e] transition-colors truncate text-xs flex items-center gap-1">
                          {link.url}
                          <ExternalLink size={10} className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {!user.bio && !user.location && user.socialLinks.filter(l => l.type && l.url).length === 0 && !isOwnProfile && (
                <div className="bg-surface border border-border-site rounded-xl p-10 text-center">
                  <p className="text-faint text-sm">Ce membre n'a pas encore renseigné son profil.</p>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

import { notFound } from "next/navigation";
import Link from "next/link";
import { MessageSquare, BarChart2, Zap, ExternalLink, Lock } from "lucide-react";
import { getUserByUsername, getUserForumStats } from "@/lib/db";
import { getSettings } from "@/lib/db";
import { getSession } from "@/lib/session";
import { computeXP, getLevel, getNextLevel, LEVELS } from "@/lib/levels";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

interface Props {
  params: Promise<{ username: string }>;
}

function memberSince(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  } catch { return iso; }
}

export async function generateMetadata({ params }: Props) {
  const { username } = await params;
  const user = await getUserByUsername(username);
  return { title: user ? `${user.displayName || user.username} — Profil` : "Profil introuvable" };
}

export default async function PublicProfilePage({ params }: Props) {
  const { username } = await params;

  const [user, settings, session] = await Promise.all([
    getUserByUsername(username),
    getSettings(),
    getSession(),
  ]);

  if (!user) notFound();

  if (!user.profilePublic) {
    return (
      <>
        <Navbar
          discordInvite={settings.discordInvite}
          session={session ? { username: session.username, role: session.role } : undefined}
          features={{ ...settings.features, navItems: settings.navItems }}
          maintenanceActive={settings.maintenance.active}
          maintenanceEndAt={settings.maintenance.endAt}
        />
        <main className="flex-1 pt-28 pb-16">
          <div className="max-w-xl mx-auto px-4 text-center py-20">
            <Lock size={32} className="mx-auto mb-4 text-faint" />
            <h1 className="text-xl font-bold text-foreground mb-2">Profil privé</h1>
            <p className="text-muted text-sm">Cet utilisateur a choisi de rendre son profil privé.</p>
            <Link href="/forum" className="inline-block mt-6 px-4 py-2 rounded-lg bg-[#c8a32e]/10 text-[#c8a32e] text-sm font-semibold hover:bg-[#c8a32e]/20 transition-colors">
              Retour au forum
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const forumStats = await getUserForumStats(user.id);
  const xp         = computeXP(forumStats.topics, forumStats.replies, forumStats.reactionsReceived);
  const level      = getLevel(xp);
  const nextLevel  = getNextLevel(xp);
  const progress   = nextLevel
    ? Math.round(((xp - level.min) / (nextLevel.min - level.min)) * 100)
    : 100;

  const avatar = user.avatar || user.discordAvatar;

  return (
    <>
      <Navbar
        discordInvite={settings.discordInvite}
        session={session ? { username: session.username, role: session.role } : undefined}
        features={{ ...settings.features, navItems: settings.navItems }}
        maintenanceActive={settings.maintenance.active}
        maintenanceEndAt={settings.maintenance.endAt}
      />
      <main className="flex-1 pt-28 pb-16">
        <div className="max-w-2xl mx-auto px-4 space-y-5">

          {/* Carte identité */}
          <div className="bg-surface border border-border-site rounded-xl p-6">
            <div className="flex items-start gap-5">
              <div className="w-20 h-20 rounded-full bg-[#c8a32e]/20 text-[#c8a32e] flex items-center justify-center font-bold shrink-0 overflow-hidden ring-2 ring-[#c8a32e]/20">
                {avatar
                  ? <img src={avatar} alt={user.displayName || user.username} className="w-full h-full object-cover" />
                  : <span className="text-2xl">{(user.displayName || user.username).charAt(0).toUpperCase()}</span>
                }
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-bold text-foreground leading-tight">{user.displayName || user.username}</h1>
                <p className="text-sm text-faint">@{user.username}</p>

                <div className="flex items-center gap-2 mt-2">
                  <span className={`text-sm font-semibold ${level.color}`}>{level.name}</span>
                  <span className="text-xs text-faint">· {xp} XP</span>
                </div>

                {nextLevel && (
                  <div className="mt-2 h-1.5 bg-surface-2 rounded-full overflow-hidden w-48">
                    <div
                      className={`h-full rounded-full ${level.color.replace("text-", "bg-")}`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                )}

                {user.bio && (
                  <p className="mt-3 text-sm text-muted leading-relaxed">{user.bio}</p>
                )}

                <div className="mt-3 flex items-center gap-3 text-xs text-faint flex-wrap">
                  {user.location && <span>📍 {user.location}</span>}
                  <span>Membre depuis {memberSince(user.createdAt)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Niveaux */}
          <div className="bg-surface border border-border-site rounded-xl p-4">
            <div className="flex items-center gap-1 flex-wrap">
              {LEVELS.map((l, i) => (
                <div
                  key={l.name}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    l === level
                      ? `${l.color} ${l.bgColor} ring-1 ring-current/30`
                      : "text-faint bg-surface-2"
                  }`}
                >
                  {i + 1}. {l.name}
                </div>
              ))}
            </div>
          </div>

          {/* Stats forum */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Sujets",   value: forumStats.topics,            icon: <MessageSquare size={16} />, color: "text-blue-400"    },
              { label: "Réponses", value: forumStats.replies,           icon: <MessageSquare size={16} />, color: "text-emerald-400" },
              { label: "Réactions reçues", value: forumStats.reactionsReceived, icon: <Zap size={16} />, color: "text-amber-400"   },
            ].map(({ label, value, icon, color }) => (
              <div key={label} className="bg-surface border border-border-site rounded-xl p-4 text-center">
                <div className={`flex justify-center mb-2 ${color}`}>{icon}</div>
                <div className={`text-2xl font-bold ${color}`}>{value.toLocaleString("fr-FR")}</div>
                <div className="text-xs text-faint mt-0.5">{label}</div>
              </div>
            ))}
          </div>

          {/* Comptes liés */}
          {(user.steamId || user.xboxId) && (
            <div className="bg-surface border border-border-site rounded-xl p-4">
              <p className="text-[10px] font-bold tracking-widest text-faint uppercase mb-3">Comptes liés</p>
              <div className="space-y-3">
                {user.steamId && (
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-md bg-[#1b2838] flex items-center justify-center shrink-0">
                      <svg viewBox="0 0 32 32" className="w-4 h-4" fill="white" aria-hidden>
                        <path d="M16 2C8.3 2 2 8.3 2 16c0 6.6 4.3 12.2 10.2 14.2l3.7-8.6a4.1 4.1 0 1 1 5-5.3l8.8-3.6C28.5 5.9 22.7 2 16 2z"/>
                        <circle cx="20.3" cy="11.7" r="3"/><circle cx="11.6" cy="20.4" r="2.8"/>
                      </svg>
                    </div>
                    {user.steamAvatar && <img src={user.steamAvatar} alt={user.steamUsername} className="w-9 h-9 rounded-full border border-border-site" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">{user.steamUsername}</p>
                      <a href={`https://steamcommunity.com/profiles/${user.steamId}`} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-faint hover:text-[#c8a32e] transition-colors flex items-center gap-1">
                        <ExternalLink size={10} /> Voir le profil Steam
                      </a>
                    </div>
                  </div>
                )}
                {user.xboxId && (
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-md bg-[#107c10] flex items-center justify-center shrink-0">
                      <svg viewBox="0 0 32 32" className="w-4 h-4" fill="white" aria-hidden>
                        <path d="M16 2C8.3 2 2 8.3 2 16s6.3 14 14 14 14-6.3 14-14S23.7 2 16 2zm-4.5 4.8c1.3.3 3.5 1.8 4.5 2.8 1-1 3.2-2.5 4.5-2.8 2.7 1.6 4.5 4.5 4.8 7.8-1.2 2.1-4.8 6.5-9.3 8.8-4.5-2.3-8.1-6.7-9.3-8.8.3-3.3 2.1-6.2 4.8-7.8z"/>
                      </svg>
                    </div>
                    {user.xboxAvatar && <img src={user.xboxAvatar} alt={user.xboxGamertag} className="w-9 h-9 rounded-full border border-border-site" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">{user.xboxGamertag}</p>
                      <a href={`https://www.xbox.com/fr-FR/play/user/${encodeURIComponent(user.xboxGamertag)}`} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-faint hover:text-[#c8a32e] transition-colors flex items-center gap-1">
                        <ExternalLink size={10} /> Voir le profil Xbox
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Liens sociaux */}
          {user.socialLinks.length > 0 && (
            <div className="bg-surface border border-border-site rounded-xl p-4">
              <p className="text-[10px] font-bold tracking-widest text-faint uppercase mb-3">Réseaux</p>
              <div className="flex flex-wrap gap-2">
                {user.socialLinks.map((link, i) => (
                  <a
                    key={i}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border-site text-xs text-muted hover:border-[#c8a32e]/40 hover:text-[#c8a32e] transition-colors capitalize"
                  >
                    <ExternalLink size={10} />
                    {link.type.replace("_", " ")}
                  </a>
                ))}
              </div>
            </div>
          )}

          <div className="text-center pt-2">
            <Link href="/forum" className="text-xs text-faint hover:text-[#c8a32e] transition-colors">
              ← Retour au forum
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

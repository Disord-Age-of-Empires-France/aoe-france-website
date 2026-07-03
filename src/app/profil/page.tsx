import { redirect } from "next/navigation";
import Link from "next/link";
import { MessageSquare, Eye, Clock, AlertCircle, CheckCircle2, XCircle, BarChart2, Zap, ExternalLink } from "lucide-react";
import ShareButton from "@/components/ShareButton";
import BackButton from "@/components/BackButton";
import { getUser, getSettings, getUserForumTopics, getUserForumStats, getWebAuthnCredentials } from "@/lib/db";
import { requireSelfAccess } from "@/lib/auth-check";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProfileForm from "@/components/admin/ProfileForm";
import ProfileTabs from "@/components/ProfileTabs";
import TwoFactorSection from "@/components/TwoFactorSection";
import WebAuthnSection from "@/components/WebAuthnSection";
import RejectedTopicCard from "@/components/RejectedTopicCard";
import type { ForumTopic } from "@/lib/db";
import { computeXP, getLevel, getNextLevel, LEVELS } from "@/lib/levels";

export const metadata = { title: "Mon profil" };

interface Props { searchParams: Promise<{ tab?: string; steam?: string; xbox?: string }> }

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const m  = Math.floor(ms / 60_000);
  if (m < 1)  return "À l'instant";
  if (m < 60) return `Il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `Il y a ${h}h`;
  const d = Math.floor(h / 24);
  if (d < 30) return `Il y a ${d}j`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `Il y a ${mo} mois`;
  return `Il y a ${Math.floor(mo / 12)} an${Math.floor(mo / 12) > 1 ? "s" : ""}`;
}

function memberSince(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  } catch { return iso; }
}

const STATUS_CONFIG = {
  approved: { label: "Publié",     icon: CheckCircle2, chip: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  pending:  { label: "En attente", icon: Clock,         chip: "bg-amber-500/10  text-amber-400  border-amber-500/20"  },
  rejected: { label: "Rejeté",     icon: XCircle,       chip: "bg-red-500/10    text-red-400    border-red-500/20"    },
  deleted:  { label: "Désactivé",  icon: AlertCircle,   chip: "bg-surface-2     text-faint      border-border-site"   },
} as const;

function renderTopic(topic: ForumTopic) {
  if (topic.status === "rejected" || topic.status === "pending") {
    return (
      <RejectedTopicCard
        key={topic.id}
        status={topic.status}
        title={topic.title}
        content={topic.content}
        categoryName={topic.categoryName}
        createdAt={topic.createdAt}
        rejectedReason={topic.rejectedReason}
      />
    );
  }

  const cfg    = STATUS_CONFIG[topic.status] ?? STATUS_CONFIG.approved;
  const Icon   = cfg.icon;
  const isLink = topic.status === "approved";

  const inner = (
    <div className={`bg-surface border rounded-xl px-4 py-4 transition-colors ${
      isLink ? "border-border-site hover:border-[#c8a32e]/30 group cursor-pointer" : "border-border-site"
    }`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${cfg.chip}`}>
              <Icon size={9} />
              {cfg.label}
            </span>
            <span className="text-xs text-faint">{topic.categoryName}</span>
          </div>
          <p className={`text-sm font-semibold leading-snug transition-colors ${
            isLink ? "text-foreground group-hover:text-[#c8a32e]" : "text-foreground"
          }`}>
            {topic.title}
          </p>
          <div className="flex items-center gap-3 mt-2 text-xs text-faint flex-wrap">
            <span>{timeAgo(topic.createdAt)}</span>
            {topic.status === "approved" && (
              <>
                <span className="flex items-center gap-1"><MessageSquare size={10} />{topic.replyCount} réponse{topic.replyCount !== 1 ? "s" : ""}</span>
                <span className="flex items-center gap-1"><Eye size={10} />{topic.views} vue{topic.views !== 1 ? "s" : ""}</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return isLink
    ? (
      <div key={topic.id} className="relative">
        <Link href={`/forum/${topic.categorySlug}/${topic.id}`}>{inner}</Link>
        <div className="absolute top-3 right-3">
          <ShareButton path={`/forum/${topic.categorySlug}/${topic.id}`} title={topic.title} compact />
        </div>
      </div>
    )
    : <div key={topic.id}>{inner}</div>;
}

export default async function ProfilPage({ searchParams }: Props) {
  const { tab, steam, xbox } = await searchParams;
  const defaultTab = tab === "publications" ? "publications" : (tab === "profil" || steam || xbox) ? "profil" : "dashboard";

  const session = await requireSelfAccess();
  const [user, settings, allTopics, forumStats, webAuthnCreds] = await Promise.all([
    getUser(session.userId),
    getSettings(),
    getUserForumTopics(session.userId),
    getUserForumStats(session.userId),
    getWebAuthnCredentials(session.userId),
  ]);
  if (!user) redirect("/admin/login");

  const published    = allTopics.filter(t => t.status === "approved");
  const pending      = allTopics.filter(t => t.status === "pending");
  const rejected     = allTopics.filter(t => t.status === "rejected");
  const totalReplies = published.reduce((s, t) => s + t.replyCount, 0);
  const sorted       = [...pending, ...rejected, ...published];

  const xp       = computeXP(forumStats.topics, forumStats.replies, forumStats.reactionsReceived);
  const level     = getLevel(xp);
  const nextLevel = getNextLevel(xp);
  const xpToNext  = nextLevel ? nextLevel.min - xp : 0;
  const progress  = nextLevel
    ? Math.round(((xp - level.min) / (nextLevel.min - level.min)) * 100)
    : 100;

  const dashboardContent = (
    <div className="space-y-6">
      {/* Level card */}
      <div className="bg-surface border border-border-site rounded-xl p-5">
        <div className="flex items-center gap-4 mb-4">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-full bg-[#c8a32e]/20 text-[#c8a32e] flex items-center justify-center font-bold shrink-0 overflow-hidden ring-2 ring-[#c8a32e]/20">
            {user.avatar || user.discordAvatar
              ? <img src={user.avatar || user.discordAvatar} alt={user.displayName || user.username} className="w-full h-full object-cover" />
              : <span className="text-2xl">{(user.displayName || user.username).charAt(0).toUpperCase()}</span>
            }
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-foreground">{user.displayName || user.username}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`text-sm font-semibold ${level.color}`}>{level.name}</span>
              <span className="text-xs text-faint">· {xp} XP</span>
            </div>
            {nextLevel ? (
              <>
                <div className="mt-2 h-1.5 bg-surface-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${level.color.replace("text-", "bg-")}`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-xs text-faint mt-1">
                  {xpToNext} XP avant <span className={nextLevel.color}>{nextLevel.name}</span>
                </p>
              </>
            ) : (
              <p className="text-xs text-faint mt-1">Niveau maximum atteint !</p>
            )}
          </div>
        </div>

        {/* Level ladder */}
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

        <div className="mt-4 pt-3 border-t border-border-site flex items-center gap-1.5 text-xs text-faint">
          <Clock size={11} />
          Membre depuis le <span className="text-muted font-medium">{memberSince(user.createdAt)}</span>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Sujets publiés",   value: forumStats.topics,            icon: <MessageSquare size={16} />, color: "text-blue-400"    },
          { label: "Réponses",         value: forumStats.replies,           icon: <MessageSquare size={16} />, color: "text-emerald-400" },
          { label: "Réactions reçues", value: forumStats.reactionsReceived, icon: <Zap size={16} />,           color: "text-amber-400"   },
          { label: "XP total",         value: xp,                           icon: <BarChart2 size={16} />,     color: level.color        },
        ].map(({ label, value, icon, color }) => (
          <div key={label} className="bg-surface border border-border-site rounded-xl p-4 text-center">
            <div className={`flex justify-center mb-2 ${color}`}>{icon}</div>
            <div className={`text-2xl font-bold ${color}`}>{value.toLocaleString("fr-FR")}</div>
            <div className="text-xs text-faint mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* XP breakdown */}
      <div className="bg-surface border border-border-site rounded-xl p-4">
        <h3 className="text-sm font-bold text-foreground mb-3">Comment gagner de l&apos;XP</h3>
        <ul className="space-y-1.5 text-xs text-muted">
          <li className="flex items-center justify-between">
            <span>Créer un sujet approuvé</span>
            <span className="text-[#c8a32e] font-semibold">+5 XP</span>
          </li>
          <li className="flex items-center justify-between">
            <span>Poster une réponse</span>
            <span className="text-[#c8a32e] font-semibold">+2 XP</span>
          </li>
          <li className="flex items-center justify-between">
            <span>Recevoir une réaction</span>
            <span className="text-[#c8a32e] font-semibold">+1 XP</span>
          </li>
        </ul>
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

    </div>
  );

  const publicationsContent = (
    <div>
      {allTopics.length > 0 && (
        <div className="flex items-center gap-4 text-xs text-faint mb-4 flex-wrap">
          <span className="flex items-center gap-1.5"><CheckCircle2 size={11} className="text-emerald-400" />{published.length} publié{published.length !== 1 ? "s" : ""}</span>
          {pending.length > 0  && <span className="flex items-center gap-1.5 text-amber-400"><Clock size={11} />{pending.length} en attente</span>}
          {rejected.length > 0 && <span className="flex items-center gap-1.5 text-red-400"><XCircle size={11} />{rejected.length} rejeté{rejected.length !== 1 ? "s" : ""}</span>}
          {totalReplies > 0    && <span className="flex items-center gap-1.5"><MessageSquare size={11} />{totalReplies} réponse{totalReplies !== 1 ? "s" : ""} reçue{totalReplies !== 1 ? "s" : ""}</span>}
        </div>
      )}

      {sorted.length === 0 ? (
        <div className="text-center py-14 bg-surface border border-border-site rounded-xl">
          <MessageSquare size={28} className="mx-auto mb-3 text-faint" />
          <p className="text-muted text-sm font-medium">Aucun sujet posté</p>
          <p className="text-faint text-xs mt-1">Vos sujets de forum apparaîtront ici.</p>
          <Link href="/forum" className="inline-block mt-4 px-4 py-2 rounded-lg bg-[#c8a32e]/10 text-[#c8a32e] text-sm font-semibold hover:bg-[#c8a32e]/20 transition-colors">
            Aller au forum
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map(topic => renderTopic(topic))}
        </div>
      )}
    </div>
  );

  return (
    <>
      <Navbar
        discordInvite={settings.discordInvite}
        session={{ username: session.username, role: session.role }}
        features={{ ...settings.features, navItems: settings.navItems }}
        maintenanceActive={settings.maintenance.active}
        maintenanceEndAt={settings.maintenance.endAt}
      />
      <main className="flex-1 pt-28 pb-16">
        <div className="max-w-3xl mx-auto px-4">
          <div className="flex items-start justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-bold text-foreground tracking-wide">Mon compte</h1>
              <p className="text-faint text-sm mt-1">Gérez votre profil et consultez vos publications.</p>
            </div>
            <BackButton />
          </div>

          {steam === "success" && (
            <div className="mb-6 flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-4 py-3 text-emerald-400 text-sm">
              <CheckCircle2 size={15} />
              Votre compte Steam a été lié avec succès.
            </div>
          )}
          {steam === "taken" && (
            <div className="mb-6 flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-lg px-4 py-3 text-amber-400 text-sm">
              <AlertCircle size={15} />
              Ce compte Steam est déjà lié à un autre profil.
            </div>
          )}
          {steam === "error" && (
            <div className="mb-6 flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm">
              <XCircle size={15} />
              La liaison Steam a échoué. Réessayez ou vérifiez votre clé API Steam.
            </div>
          )}
          {xbox === "success" && (
            <div className="mb-6 flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-4 py-3 text-emerald-400 text-sm">
              <CheckCircle2 size={15} />
              Votre compte Xbox a été lié avec succès.
            </div>
          )}
          {xbox === "taken" && (
            <div className="mb-6 flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-lg px-4 py-3 text-amber-400 text-sm">
              <AlertCircle size={15} />
              Ce compte Xbox est déjà lié à un autre profil.
            </div>
          )}
          {xbox === "minor" && (
            <div className="mb-6 flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-lg px-4 py-3 text-amber-400 text-sm">
              <AlertCircle size={15} />
              Ce compte Xbox appartient à un mineur et nécessite une autorisation parentale.
            </div>
          )}
          {xbox === "noprofile" && (
            <div className="mb-6 flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-lg px-4 py-3 text-amber-400 text-sm">
              <AlertCircle size={15} />
              Aucun profil Xbox trouvé. Assurez-vous d&apos;avoir un compte Xbox Live actif.
            </div>
          )}
          {xbox === "error" && (
            <div className="mb-6 flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm">
              <XCircle size={15} />
              La liaison Xbox a échoué. Réessayez ou vérifiez vos identifiants Azure.
            </div>
          )}

          <ProfileTabs
            defaultTab={defaultTab}
            pendingCount={pending.length}
            profileContent={
              <div className="space-y-8">
                <ProfileForm user={user} />
                <div>
                  <p className="text-[10px] font-bold tracking-widest text-faint uppercase mb-4">Sécurité</p>
                  <div className="space-y-6">
                    <TwoFactorSection
                      totpEnabled={user.totpEnabled}
                      isAdmin={session.role === "admin"}
                    />
                    <WebAuthnSection credentials={webAuthnCreds} />
                  </div>
                </div>
              </div>
            }
            dashboardContent={dashboardContent}
            publicationsContent={publicationsContent}
          />
        </div>
      </main>
      <Footer />
    </>
  );
}

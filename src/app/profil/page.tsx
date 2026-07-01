import { redirect } from "next/navigation";
import Link from "next/link";
import { MessageSquare, Eye, Clock, AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import BackButton from "@/components/BackButton";
import { getUser, getSettings, getUserForumTopics } from "@/lib/db";
import { requireSelfAccess } from "@/lib/auth-check";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProfileForm from "@/components/admin/ProfileForm";
import ProfileTabs from "@/components/ProfileTabs";
import RejectedTopicCard from "@/components/RejectedTopicCard";
import type { ForumTopic } from "@/lib/db";

export const metadata = { title: "Mon profil" };

interface Props { searchParams: Promise<{ tab?: string }> }

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

const STATUS_CONFIG = {
  approved: { label: "Publié",     icon: CheckCircle2, chip: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  pending:  { label: "En attente", icon: Clock,         chip: "bg-amber-500/10  text-amber-400  border-amber-500/20"  },
  rejected: { label: "Rejeté",     icon: XCircle,       chip: "bg-red-500/10    text-red-400    border-red-500/20"    },
  deleted:  { label: "Désactivé",  icon: AlertCircle,   chip: "bg-surface-2     text-faint      border-border-site"   },
} as const;

function TopicCard({ topic }: { topic: ForumTopic }) {
  if (topic.status === "rejected" || topic.status === "pending") {
    return (
      <RejectedTopicCard
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

        {isLink && <span className="text-faint group-hover:text-[#c8a32e] transition-colors shrink-0 mt-0.5 text-sm">→</span>}
      </div>
    </div>
  );

  return isLink
    ? <Link href={`/forum/${topic.categorySlug}/${topic.id}`}>{inner}</Link>
    : inner;
}

export default async function ProfilPage({ searchParams }: Props) {
  const { tab } = await searchParams;
  const defaultTab = tab === "publications" ? "publications" : "profil";
  const session = await requireSelfAccess();
  const [user, settings, allTopics] = await Promise.all([
    getUser(session.userId),
    getSettings(),
    getUserForumTopics(session.userId),
  ]);
  if (!user) redirect("/admin/login");

  const published    = allTopics.filter(t => t.status === "approved");
  const pending      = allTopics.filter(t => t.status === "pending");
  const rejected     = allTopics.filter(t => t.status === "rejected");
  const totalReplies = published.reduce((s, t) => s + t.replyCount, 0);

  const sorted = [...pending, ...rejected, ...published];

  const publicationsContent = (
    <div>
      {/* Compteur */}
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
          {sorted.map(topic => <TopicCard key={topic.id} topic={topic} />)}
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

          <ProfileTabs
            defaultTab={defaultTab}
            pendingCount={pending.length}
            profileContent={<ProfileForm user={user} />}
            publicationsContent={publicationsContent}
          />
        </div>
      </main>
      <Footer />
    </>
  );
}

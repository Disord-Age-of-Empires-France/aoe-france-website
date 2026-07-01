import Link from "next/link";
import { Clock, ExternalLink, Ban } from "lucide-react";
import { getPendingForumTopics, getDeletedForumTopics } from "@/lib/db";
import type { ForumTopic } from "@/lib/db";
import { requireBOAccess } from "@/lib/auth-check";
import ApproveRejectButtons from "@/components/forum/ApproveRejectButtons";

export const metadata = { title: "Modération des sujets" };

function TopicCard({ topic, variant }: { topic: ForumTopic; variant: "pending" | "deleted" }) {
  const isPending = variant === "pending";
  return (
    <div className={`bg-surface rounded-xl p-5 border ${isPending ? "border-amber-500/20" : "border-red-500/15"}`}>
      <div className="flex items-start gap-4 flex-wrap">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            {isPending ? (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-400 uppercase tracking-wider">
                En attente
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/15 text-red-400 uppercase tracking-wider">
                Désactivé
              </span>
            )}
            <span className="text-xs text-faint">{topic.categoryName}</span>
          </div>
          <h2 className="text-base font-semibold text-foreground mt-2">{topic.title}</h2>
          <p className="text-xs text-faint mt-1">
            Par <span className="text-muted font-medium">{topic.displayName}</span>
            {" · "}
            {new Date(topic.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
          </p>
          {!isPending && topic.deletedReason && (
            <p className="text-xs text-red-400/70 mt-1.5">
              Raison : {topic.deletedReason}
            </p>
          )}
          {isPending && (
            <p className="text-sm text-muted mt-3 line-clamp-3 whitespace-pre-line">
              {topic.content.slice(0, 300)}{topic.content.length > 300 ? "…" : ""}
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-border-site flex items-center justify-between gap-4 flex-wrap">
        <Link
          href={`/forum/${topic.categorySlug}/${topic.id}`}
          target="_blank"
          className="flex items-center gap-1.5 text-xs text-faint hover:text-foreground transition-colors"
        >
          <ExternalLink size={12} />
          Voir le sujet
        </Link>
        <div className="flex items-center gap-2">
          {isPending ? (
            <ApproveRejectButtons topicId={topic.id} categorySlug={topic.categorySlug} />
          ) : (
            <ApproveRejectButtons topicId={topic.id} categorySlug={topic.categorySlug} approveOnly approveLabel="Restaurer" />
          )}
        </div>
      </div>
    </div>
  );
}

export default async function AdminForumModerationPage() {
  await requireBOAccess();
  const [pending, deleted] = await Promise.all([
    getPendingForumTopics(),
    getDeletedForumTopics(),
  ]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Modération des sujets</h1>
          <p className="text-faint text-sm mt-1">
            {pending.length} en attente · {deleted.length} désactivé{deleted.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link href="/admin/forum" className="text-sm text-muted hover:text-foreground transition-colors">
          ← Gestion du forum
        </Link>
      </div>

      {/* En attente */}
      <section className="mb-10">
        <h2 className="text-sm font-bold text-foreground tracking-wide mb-3 flex items-center gap-2">
          <Clock size={14} className="text-amber-400" />
          En attente de validation
        </h2>
        {pending.length === 0 ? (
          <div className="text-center py-10 bg-surface border border-border-site rounded-xl">
            <p className="text-muted text-sm">Aucun sujet en attente.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pending.map(topic => <TopicCard key={topic.id} topic={topic} variant="pending" />)}
          </div>
        )}
      </section>

      {/* Désactivés */}
      <section>
        <h2 className="text-sm font-bold text-foreground tracking-wide mb-3 flex items-center gap-2">
          <Ban size={14} className="text-red-400" />
          Sujets désactivés
        </h2>
        {deleted.length === 0 ? (
          <div className="text-center py-10 bg-surface border border-border-site rounded-xl">
            <p className="text-muted text-sm">Aucun sujet désactivé.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {deleted.map(topic => <TopicCard key={topic.id} topic={topic} variant="deleted" />)}
          </div>
        )}
      </section>
    </div>
  );
}

import { notFound } from "next/navigation";
import Link from "next/link";
import { Pin, Lock, Eye } from "lucide-react";
import { getForumTopic, getForumReplies, getForumReactions, incrementForumTopicViews } from "@/lib/db";
import { getSession } from "@/lib/session";
import { renderMarkdown } from "@/lib/markdownHtml";
import BackButton from "@/components/forum/BackButton";
import LoginButton from "@/components/LoginButton";
import ApproveRejectButtons from "@/components/forum/ApproveRejectButtons";
import ReactionBar from "@/components/forum/ReactionBar";
import ReportButton from "@/components/forum/ReportButton";
import ReplyForm from "@/components/forum/ReplyForm";
import { TopicModBar, DeleteReplyButton } from "@/components/forum/ModActions";
import ReplyButton from "@/components/forum/ReplyButton";
import ShareButton from "@/components/ShareButton";

interface Props {
  params:      Promise<{ slug: string; topicId: string }>;
  searchParams: Promise<{ page?: string }>;
}

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

function Avatar({ name, src, size = "md" }: { name: string; src?: string; size?: "sm" | "md" }) {
  const sz = size === "sm" ? "w-7 h-7 text-[10px]" : "w-9 h-9 text-xs";
  return (
    <div className={`${sz} rounded-full bg-[#c8a32e]/20 text-[#c8a32e] flex items-center justify-center font-bold shrink-0 overflow-hidden`}>
      {src
        ? <img src={src} alt={name} className="w-full h-full object-cover" />
        : name.charAt(0).toUpperCase()
      }
    </div>
  );
}

export async function generateMetadata({ params }: Props) {
  const { topicId } = await params;
  const topic = await getForumTopic(topicId);
  return { title: topic ? `${topic.title} — Forum` : "Forum" };
}

export default async function TopicPage({ params, searchParams }: Props) {
  const { slug, topicId } = await params;
  const { page: pageStr } = await searchParams;
  const page = Math.max(1, parseInt(pageStr ?? "1", 10));

  const [topic, session] = await Promise.all([
    getForumTopic(topicId),
    getSession(),
  ]);
  if (!topic || topic.categorySlug !== slug) notFound();
  const isMod = session?.role === "admin" || session?.role === "editor";
  if (topic.status !== "approved" && !isMod) notFound();

  const [{ replies, total }, topicReactions] = await Promise.all([
    getForumReplies(topicId, page, 30),
    getForumReactions([topicId], "topic", session?.userId),
    incrementForumTopicViews(topicId),
  ]);

  const replyIds = replies.map((r) => r.id);
  const replyReactions = replyIds.length
    ? await getForumReactions(replyIds, "reply", session?.userId)
    : {};

  const totalPages = Math.ceil(total / 30);
  const topicHtmlContent = renderMarkdown(topic.content);

  return (
    <div>

        <BackButton />

        {/* Bannière statut modération */}
        {isMod && topic.status === "pending" && (
          <div className="mb-6 px-4 py-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm flex items-center justify-between gap-4 flex-wrap">
            <span>⏳ Ce sujet est <strong>en attente de validation</strong> et n'est pas visible du public.</span>
            <div className="flex items-center gap-2">
              <ApproveRejectButtons topicId={topicId} categorySlug={slug} />
            </div>
          </div>
        )}
        {isMod && topic.status === "rejected" && (
          <div className="mb-6 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center justify-between gap-4 flex-wrap">
            <span>✗ Ce sujet a été <strong>rejeté</strong> et n'est pas visible du public.</span>
            <div className="flex items-center gap-2">
              <ApproveRejectButtons topicId={topicId} categorySlug={slug} approveOnly />
            </div>
          </div>
        )}
        {isMod && topic.status === "deleted" && (
          <div className="mb-6 px-4 py-3 rounded-lg bg-red-900/20 border border-red-500/30 text-red-400 text-sm">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <span>🗑 Ce sujet a été <strong>désactivé</strong> et n'est pas visible du public.</span>
              <ApproveRejectButtons topicId={topicId} categorySlug={slug} approveOnly />
            </div>
            {topic.deletedReason && (
              <p className="mt-1.5 text-xs opacity-70">Raison : {topic.deletedReason}</p>
            )}
          </div>
        )}

        {/* Fil d'Ariane */}
        <nav className="text-xs text-faint mb-6 flex items-center gap-1.5 flex-wrap">
          <Link href="/forum" className="hover:text-[#c8a32e]">Forum</Link>
          <span>/</span>
          <Link href={`/forum/${slug}`} className="hover:text-[#c8a32e]">{topic.categoryName}</Link>
          <span>/</span>
          <span className="text-muted truncate max-w-xs">{topic.title}</span>
        </nav>

        {/* Titre + badges */}
        <div className="flex items-start justify-between gap-4 mb-8">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {topic.pinned && <Pin size={14} className="text-[#c8a32e] shrink-0" />}
              {topic.locked && <Lock size={14} className="text-amber-400 shrink-0" />}
              <h1 className="text-2xl font-bold text-foreground">{topic.title}</h1>
            </div>
            <div className="flex items-center gap-3 mt-1.5 text-xs text-faint flex-wrap">
              <span>Par <span className="text-muted font-medium">{topic.displayName}</span></span>
              <span>·</span>
              <span>{new Date(topic.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</span>
              <span>·</span>
              <span className="flex items-center gap-1"><Eye size={11} />{topic.views} vues</span>
              <span>·</span>
              <span>{topic.replyCount} réponse{topic.replyCount !== 1 ? "s" : ""}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <ShareButton path={`/forum/${slug}/${topicId}`} title={topic.title} />
            <TopicModBar
              topicId={topicId}
              pinned={topic.pinned}
              locked={topic.locked}
              canMod={isMod}
              canDelete={isMod || (session?.userId === topic.userId && !topic.locked)}
            />
          </div>
        </div>

        {/* ── Post original ── */}
        <div className="bg-surface border border-border-site rounded-xl overflow-hidden mb-6">
          <div className="flex items-start gap-4 p-5">
            {/* Auteur */}
            <Link href={`/profil/${topic.username}`} className="flex flex-col items-center gap-1.5 w-16 shrink-0 group">
              <Avatar name={topic.displayName} src={topic.avatar || undefined} />
              <span className="text-[11px] font-semibold text-muted text-center leading-tight group-hover:text-[#c8a32e] transition-colors">{topic.displayName}</span>
            </Link>

            {/* Contenu */}
            <div className="flex-1 min-w-0">
              <div
                className="prose-forum text-sm text-muted leading-relaxed"
                dangerouslySetInnerHTML={{ __html: topicHtmlContent }}
              />
            </div>
          </div>

          {/* Footer : réactions + signalement */}
          <div className="px-5 py-3 border-t border-border-site bg-surface-2/30 flex items-center justify-between gap-4">
            <ReactionBar
              targetId={topicId}
              targetType="topic"
              reactions={topicReactions[topicId] ?? []}
              loggedIn={!!session}
            />
            <div className="flex items-center gap-3 text-faint text-xs">
              <span>{timeAgo(topic.createdAt)}</span>
              <ReportButton targetId={topicId} targetType="topic" currentUserId={session?.userId} />
              {session && !topic.locked && <ReplyButton username={topic.username} />}
            </div>
          </div>
        </div>

        {/* ── Réponses ── */}
        {replies.length > 0 && (
          <div className="space-y-4 mb-6">
            <h2 className="text-sm font-bold text-foreground tracking-wide">
              {total} réponse{total !== 1 ? "s" : ""}
            </h2>

            {replies.map((reply) => {
              const replyHtml = renderMarkdown(reply.content);
              const canDeleteReply = isMod || session?.userId === reply.userId;
              return (
                <div key={reply.id} className="bg-surface border border-border-site rounded-xl overflow-hidden">
                  <div className="flex items-start gap-4 p-5">
                    <Link href={`/profil/${reply.username}`} className="flex flex-col items-center gap-1.5 w-16 shrink-0 group">
                      <Avatar name={reply.displayName} src={reply.avatar || undefined} />
                      <span className="text-[11px] font-semibold text-muted text-center leading-tight group-hover:text-[#c8a32e] transition-colors">{reply.displayName}</span>
                    </Link>
                    <div className="flex-1 min-w-0">
                      <div
                        className="prose-forum text-sm text-muted leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: replyHtml }}
                      />
                    </div>
                  </div>

                  <div className="px-5 py-3 border-t border-border-site bg-surface-2/30 flex items-center justify-between gap-4">
                    <ReactionBar
                      targetId={reply.id}
                      targetType="reply"
                      reactions={replyReactions[reply.id] ?? []}
                      loggedIn={!!session}
                    />
                    <div className="flex items-center gap-3 text-xs text-faint">
                      <span>{timeAgo(reply.createdAt)}</span>
                      <ReportButton targetId={reply.id} targetType="reply" currentUserId={session?.userId} />
                      {session && !topic.locked && <ReplyButton username={reply.username} />}
                      {canDeleteReply && <DeleteReplyButton replyId={reply.id} />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mb-8">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <Link
                key={p}
                href={`/forum/${slug}/${topicId}?page=${p}`}
                className={`w-8 h-8 flex items-center justify-center rounded text-sm font-medium transition-colors ${
                  p === page
                    ? "bg-[#c8a32e] text-[#080e1a] font-bold"
                    : "border border-border-site text-muted hover:text-foreground hover:border-[#c8a32e]/30"
                }`}
              >
                {p}
              </Link>
            ))}
          </div>
        )}

        {/* ── Formulaire de réponse ── */}
        {session ? (
          <ReplyForm topicId={topicId} locked={topic.locked} />
        ) : (
          <div className="mt-8 bg-surface border border-border-site rounded-xl p-6 text-center">
            <p className="text-muted text-sm mb-3">Connectez-vous pour répondre à ce sujet.</p>
            <LoginButton className="px-5 py-2 rounded-lg bg-[#c8a32e] hover:bg-[#b8922a] text-[#080e1a] font-bold text-sm transition-colors">
              Se connecter
            </LoginButton>
          </div>
        )}
    </div>
  );
}

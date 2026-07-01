import Link from "next/link";
import { notFound } from "next/navigation";
import { Pin, Lock, MessageSquare, Eye, Clock, Plus } from "lucide-react";
import { getForumCategory, getForumTopics } from "@/lib/db";
import { getSession } from "@/lib/session";
import BackButton from "@/components/forum/BackButton";

interface Props { params: Promise<{ slug: string }>; searchParams: Promise<{ page?: string; submitted?: string }> }

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

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const cat = await getForumCategory(slug);
  return { title: cat ? `${cat.name} — Forum` : "Forum" };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { page: pageStr, submitted } = await searchParams;
  const page = Math.max(1, parseInt(pageStr ?? "1", 10));

  const [category, session] = await Promise.all([
    getForumCategory(slug),
    getSession(),
  ]);
  if (!category) notFound();

  const { topics, total } = await getForumTopics(category.id, page, 20);
  const totalPages = Math.ceil(total / 20);

  const pinned  = topics.filter((t) => t.pinned);
  const regular = topics.filter((t) => !t.pinned);

  return (
    <div>

        <BackButton />

        {/* Bandeau soumission en attente */}
        {submitted === "1" && (
          <div className="mb-6 px-4 py-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm flex items-center justify-between gap-4 flex-wrap">
            <span>✓ Votre sujet a été soumis et est en attente de validation par un administrateur.</span>
            <Link
              href="/profil?tab=publications"
              className="shrink-0 text-xs font-semibold underline underline-offset-2 hover:text-amber-300 transition-colors"
            >
              Suivre son état →
            </Link>
          </div>
        )}

        {/* Fil d'Ariane */}
        <nav className="text-xs text-faint mb-6 flex items-center gap-1.5">
          <Link href="/forum" className="hover:text-[#c8a32e] transition-colors">Forum</Link>
          <span>/</span>
          <span className="text-muted">{category.name}</span>
        </nav>

        {/* En-tête */}
        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{category.name}</h1>
            {category.description && (
              <p className="text-faint text-sm mt-1">{category.description}</p>
            )}
            <div className="flex items-center gap-4 mt-2 text-xs text-faint">
              <span>{category.topicCount} sujet{category.topicCount !== 1 ? "s" : ""}</span>
              <span>{category.replyCount} réponse{category.replyCount !== 1 ? "s" : ""}</span>
            </div>
          </div>
          {session && (
            <Link
              href={`/forum/${slug}/nouveau`}
              className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg bg-[#c8a32e] hover:bg-[#b8922a] text-[#080e1a] font-bold text-sm transition-colors"
            >
              <Plus size={14} />Nouveau sujet
            </Link>
          )}
        </div>

        {/* Liste des sujets */}
        {topics.length === 0 ? (
          <div className="text-center py-20 text-faint text-sm">
            Aucun sujet dans cette catégorie.{" "}
            {session && (
              <Link href={`/forum/${slug}/nouveau`} className="text-[#c8a32e] hover:underline">
                Soyez le premier à poster !
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {/* Sujets épinglés */}
            {pinned.length > 0 && (
              <>
                <p className="text-[10px] text-faint uppercase tracking-widest px-1 mb-2">Épinglés</p>
                {pinned.map((topic) => (
                  <TopicRow key={topic.id} topic={topic} slug={slug} />
                ))}
                {regular.length > 0 && (
                  <p className="text-[10px] text-faint uppercase tracking-widest px-1 mt-4 mb-2">Sujets</p>
                )}
              </>
            )}

            {/* Sujets normaux */}
            {regular.map((topic) => (
              <TopicRow key={topic.id} topic={topic} slug={slug} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <Link
                key={p}
                href={`/forum/${slug}?page=${p}`}
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
    </div>
  );
}

function TopicRow({ topic, slug }: { topic: import("@/lib/db").ForumTopic; slug: string }) {
  return (
    <Link
      href={`/forum/${slug}/${topic.id}`}
      className="flex items-center gap-4 bg-surface border border-border-site rounded-lg px-4 py-3 hover:border-[#c8a32e]/30 transition-colors group"
    >
      {/* Avatar */}
      <div className="w-8 h-8 rounded-full bg-[#c8a32e]/20 text-[#c8a32e] flex items-center justify-center text-xs font-bold shrink-0 overflow-hidden">
        {topic.avatar
          ? <img src={topic.avatar} alt={topic.displayName} className="w-full h-full object-cover" />
          : topic.displayName.charAt(0).toUpperCase()
        }
      </div>

      {/* Contenu */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          {topic.pinned && <Pin size={11} className="text-[#c8a32e] shrink-0" />}
          {topic.locked && <Lock size={11} className="text-faint shrink-0" />}
          <span className="font-semibold text-foreground text-sm group-hover:text-[#c8a32e] transition-colors truncate">
            {topic.title}
          </span>
        </div>
        <p className="text-xs text-faint mt-0.5">
          <span className="text-muted">{topic.displayName}</span>
          {" · "}
          {new Date(topic.createdAt).toLocaleDateString("fr-FR")}
          {topic.lastReplyAt && (
            <>
              {" · "}
              <Clock size={9} className="inline-block mr-0.5" />
              {timeAgo(topic.lastReplyAt)}
              {topic.lastReplyDisplayName && ` par ${topic.lastReplyDisplayName}`}
            </>
          )}
        </p>
      </div>

      {/* Stats */}
      <div className="shrink-0 flex items-center gap-4 text-xs text-faint">
        <span className="flex items-center gap-1">
          <MessageSquare size={12} />
          {topic.replyCount}
        </span>
        <span className="flex items-center gap-1 hidden sm:flex">
          <Eye size={12} />
          {topic.views}
        </span>
      </div>
    </Link>
  );
}

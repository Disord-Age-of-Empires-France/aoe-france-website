import Link from "next/link";
import { Plus, Clock, Flag, CheckCircle, Ban, ExternalLink } from "lucide-react";

import {
  getForumCategories,
  getPendingForumTopics,
  getDeletedForumTopics,
  getForumReports,
} from "@/lib/db";
import type { ForumTopic, ForumReport } from "@/lib/db";
import { requireBOAccess } from "@/lib/auth-check";
import AdminCategoryForm from "@/components/admin/forum/AdminCategoryForm";
import AdminCategoryDelete from "@/components/admin/forum/AdminCategoryDelete";
import ApproveRejectButtons from "@/components/forum/ApproveRejectButtons";
import ResolveReportButton from "@/components/admin/forum/ResolveReportButton";

export const metadata = { title: "Gestion du forum" };

type Tab = "moderation" | "signalements" | "categories";

const VALID_TABS: Tab[] = ["moderation", "signalements", "categories"];

const COLOR_OPTIONS = [
  { value: "amber",  label: "Or"     },
  { value: "blue",   label: "Bleu"   },
  { value: "green",  label: "Vert"   },
  { value: "red",    label: "Rouge"  },
  { value: "purple", label: "Violet" },
  { value: "slate",  label: "Gris"   },
];

const COLOR_SWATCH: Record<string, string> = {
  amber:  "bg-[#c8a32e]",
  blue:   "bg-blue-500",
  green:  "bg-emerald-500",
  red:    "bg-red-500",
  purple: "bg-purple-500",
  slate:  "bg-slate-500",
};

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
            {new Date(topic.createdAt).toLocaleDateString("fr-FR", {
              day: "numeric", month: "long", year: "numeric",
              hour: "2-digit", minute: "2-digit",
            })}
          </p>
          {!isPending && topic.deletedReason && (
            <p className="text-xs text-red-400/70 mt-1.5">Raison : {topic.deletedReason}</p>
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

function ReportRow({ report, showResolve }: { report: ForumReport; showResolve: boolean }) {
  const typeLabel = report.targetType === "topic" ? "Sujet" : "Réponse";
  const href = report.topicId && report.categorySlug
    ? `/forum/${report.categorySlug}/${report.topicId}${report.targetType === "reply" ? `#${report.targetId}` : ""}`
    : null;

  return (
    <div className="flex items-start gap-4 px-5 py-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
            report.targetType === "topic"
              ? "bg-amber-800/50 text-amber-300"
              : "bg-blue-800/50 text-blue-300"
          }`}>
            {typeLabel}
          </span>
          {report.topicTitle && (
            <span className="text-xs text-muted truncate">{report.topicTitle}</span>
          )}
          {href && (
            <Link href={href} target="_blank" className="text-faint hover:text-[#c8a32e] transition-colors shrink-0">
              <ExternalLink size={11} />
            </Link>
          )}
        </div>
        <p className="text-sm text-foreground">{report.reason}</p>
        <p className="text-[11px] text-faint mt-0.5">
          Signalé par <span className="text-muted">{report.username}</span>
          {" · "}
          {new Date(report.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>
      {showResolve && <ResolveReportButton reportId={report.id} />}
      {!showResolve && (
        <span className="flex items-center gap-1 text-[11px] text-emerald-400 shrink-0">
          <CheckCircle size={11} />Résolu
        </span>
      )}
    </div>
  );
}

interface Props {
  searchParams: Promise<{ tab?: string }>;
}

export default async function AdminForumPage({ searchParams }: Props) {
  await requireBOAccess();

  const { tab: tabParam = "moderation" } = await searchParams;
  const tab: Tab = VALID_TABS.includes(tabParam as Tab) ? (tabParam as Tab) : "moderation";

  const [pending, deleted, pendingReports, resolvedReports, categories] = await Promise.all([
    getPendingForumTopics(),
    getDeletedForumTopics(),
    getForumReports(false),
    getForumReports(true),
    getForumCategories(),
  ]);

  const TABS = [
    { id: "moderation"  as const, label: "Modération",  badge: pending.length || null,        badgeClass: "bg-amber-500/20 text-amber-400" },
    { id: "signalements" as const, label: "Signalements", badge: pendingReports.length || null, badgeClass: "bg-red-500/20 text-red-400"    },
    { id: "categories"  as const, label: "Catégories",  badge: null,                          badgeClass: "" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-wide">Forum</h1>
        <p className="text-faint text-sm mt-1">Modération, signalements et gestion des catégories.</p>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-border-site">
        {TABS.map(({ id, label, badge, badgeClass }) => {
          const isActive = tab === id;
          return (
            <Link
              key={id}
              href={`/admin/forum?tab=${id}`}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-semibold transition-colors border-b-2 -mb-px ${
                isActive
                  ? "border-[#c8a32e] text-[#c8a32e]"
                  : "border-transparent text-faint hover:text-muted"
              }`}
            >
              {label}
              {badge !== null && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${badgeClass}`}>
                  {badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* ── Modération ──────────────────────────────────────────────── */}
      {tab === "moderation" && (
        <div className="space-y-8">
          <section>
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
                {pending.map((topic) => (
                  <TopicCard key={topic.id} topic={topic} variant="pending" />
                ))}
              </div>
            )}
          </section>

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
                {deleted.map((topic) => (
                  <TopicCard key={topic.id} topic={topic} variant="deleted" />
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {/* ── Signalements ────────────────────────────────────────────── */}
      {tab === "signalements" && (
        <div className="space-y-6">
          <div className="bg-surface border border-border-site rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-border-site flex items-center gap-2">
              <Flag size={14} className="text-red-400" />
              <h2 className="font-bold text-foreground text-sm">
                En attente
                {pendingReports.length > 0 && (
                  <span className="ml-2 text-[10px] bg-red-500/15 text-red-400 px-1.5 py-0.5 rounded-full font-semibold">
                    {pendingReports.length}
                  </span>
                )}
              </h2>
            </div>
            {pendingReports.length === 0 ? (
              <p className="px-5 py-10 text-center text-faint text-sm flex items-center justify-center gap-2">
                <CheckCircle size={16} className="text-emerald-400" />
                Aucun signalement en attente.
              </p>
            ) : (
              <div className="divide-y divide-border-site">
                {pendingReports.map((report) => (
                  <ReportRow key={report.id} report={report} showResolve />
                ))}
              </div>
            )}
          </div>

          {resolvedReports.length > 0 && (
            <div className="bg-surface border border-border-site rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-border-site">
                <h2 className="font-bold text-sm text-faint">Résolus ({resolvedReports.length})</h2>
              </div>
              <div className="divide-y divide-border-site">
                {resolvedReports.slice(0, 20).map((report) => (
                  <ReportRow key={report.id} report={report} showResolve={false} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Catégories ──────────────────────────────────────────────── */}
      {tab === "categories" && (
        <div className="space-y-6">
          <div className="bg-surface border border-border-site rounded-xl p-5">
            <h2 className="font-bold text-foreground text-sm mb-4 flex items-center gap-2">
              <Plus size={14} className="text-[#c8a32e]" />Nouvelle catégorie
            </h2>
            <AdminCategoryForm colorOptions={COLOR_OPTIONS} />
          </div>

          <div className="bg-surface border border-border-site rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-border-site">
              <h2 className="font-bold text-foreground text-sm">Catégories ({categories.length})</h2>
            </div>
            {categories.length === 0 ? (
              <p className="px-5 py-10 text-center text-faint text-sm">Aucune catégorie.</p>
            ) : (
              <div className="divide-y divide-border-site">
                {categories.map((cat) => (
                  <div key={cat.id} className="flex items-center gap-4 px-5 py-4">
                    <div className={`w-3 h-3 rounded-full shrink-0 ${COLOR_SWATCH[cat.color] ?? "bg-muted"}`} />
                    <div className="text-lg shrink-0">{cat.icon || "💬"}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground text-sm truncate">{cat.name}</p>
                      <p className="text-xs text-faint truncate">{cat.description || "—"}</p>
                      <p className="text-[10px] text-faint mt-0.5">
                        /{cat.slug} · pos. {cat.position} · {cat.topicCount} sujets · {cat.replyCount} réponses
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Link
                        href={`/forum/${cat.slug}`}
                        target="_blank"
                        className="text-[11px] text-faint hover:text-[#c8a32e] transition-colors"
                      >
                        Voir
                      </Link>
                      <AdminCategoryDelete id={cat.id} name={cat.name} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

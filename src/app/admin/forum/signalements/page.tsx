import Link from "next/link";
import { Flag, CheckCircle, ExternalLink } from "lucide-react";
import { getForumReports } from "@/lib/db";
import { requireBOAccess } from "@/lib/auth-check";
import ResolveReportButton from "@/components/admin/forum/ResolveReportButton";

export const metadata = { title: "Signalements forum" };

export default async function SignalementsPage() {
  await requireBOAccess();
  const [pending, resolved] = await Promise.all([
    getForumReports(false),
    getForumReports(true),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-wide">Signalements</h1>
          <p className="text-faint text-sm mt-1">Contenus signalés par les membres.</p>
        </div>
        <Link href="/admin/forum" className="text-sm text-faint hover:text-[#c8a32e] transition-colors">
          ← Retour forum
        </Link>
      </div>

      {/* En attente */}
      <div className="bg-surface border border-border-site rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border-site flex items-center gap-2">
          <Flag size={14} className="text-red-400" />
          <h2 className="font-bold text-foreground text-sm">
            En attente
            {pending.length > 0 && (
              <span className="ml-2 text-[10px] bg-red-500/15 text-red-400 px-1.5 py-0.5 rounded-full font-semibold">
                {pending.length}
              </span>
            )}
          </h2>
        </div>
        {pending.length === 0 ? (
          <p className="px-5 py-10 text-center text-faint text-sm flex items-center justify-center gap-2">
            <CheckCircle size={16} className="text-emerald-400" />
            Aucun signalement en attente.
          </p>
        ) : (
          <div className="divide-y divide-border-site">
            {pending.map((report) => (
              <ReportRow key={report.id} report={report} showResolve />
            ))}
          </div>
        )}
      </div>

      {/* Résolus */}
      {resolved.length > 0 && (
        <div className="bg-surface border border-border-site rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border-site">
            <h2 className="font-bold text-foreground text-sm text-faint">Résolus ({resolved.length})</h2>
          </div>
          <div className="divide-y divide-border-site">
            {resolved.slice(0, 20).map((report) => (
              <ReportRow key={report.id} report={report} showResolve={false} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ReportRow({
  report,
  showResolve,
}: {
  report: import("@/lib/db").ForumReport;
  showResolve: boolean;
}) {
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
            <span className="text-xs text-muted truncate">
              {report.topicTitle}
            </span>
          )}
          {href && (
            <Link href={href} target="_blank"
              className="text-faint hover:text-[#c8a32e] transition-colors shrink-0">
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

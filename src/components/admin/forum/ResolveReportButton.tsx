"use client";

import { useTransition } from "react";
import { CheckCircle } from "lucide-react";
import { resolveReportAction } from "@/app/actions/forum";

export default function ResolveReportButton({ reportId }: { reportId: string }) {
  const [pending, start] = useTransition();

  return (
    <button type="button" disabled={pending}
      onClick={() => start(() => resolveReportAction(reportId))}
      className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 text-[11px] font-semibold disabled:opacity-50 transition-colors">
      <CheckCircle size={12} />
      {pending ? "…" : "Résoudre"}
    </button>
  );
}

"use client";

import { useTransition, useState } from "react";
import { RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";
import { syncGameDataAction } from "@/app/actions/gameData";

interface Props {
  gameId:   string;
  label:    string;
  source:   string;
  icon:     string;
  count:    number;
  lastSync: string | null;
}

export default function SyncGamePanel({ gameId, label, source, icon, count, lastSync }: Props) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  function handleSync() {
    setResult(null);
    startTransition(async () => {
      const res = await syncGameDataAction(gameId);
      if (res.error) {
        setResult({ ok: false, message: res.error });
      } else {
        setResult({ ok: true, message: `${res.count} entrées synchronisées.` });
      }
    });
  }

  return (
    <div className="bg-surface border border-border-site rounded-xl p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{icon}</span>
          <div>
            <p className="font-bold text-foreground text-sm">{label}</p>
            <p className="text-[11px] text-faint mt-0.5">{source}</p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-xl font-bold tabular-nums text-foreground">{count}</p>
          <p className="text-[10px] text-faint uppercase tracking-wider">entrées</p>
        </div>
      </div>

      {lastSync && (
        <p className="text-[11px] text-faint">
          Dernière sync : {new Date(lastSync).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}
        </p>
      )}

      {result && (
        <div className={`flex items-center gap-2 text-xs rounded-lg px-3 py-2 ${
          result.ok
            ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
            : "bg-red-500/10 border border-red-500/30 text-red-400"
        }`}>
          {result.ok ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
          {result.message}
        </div>
      )}

      <button
        type="button"
        onClick={handleSync}
        disabled={pending}
        className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg bg-[#c8a32e]/10 text-[#c8a32e] hover:bg-[#c8a32e]/20 border border-[#c8a32e]/20 text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <RefreshCw size={14} className={pending ? "animate-spin" : ""} />
        {pending ? "Synchronisation…" : "Synchroniser"}
      </button>
    </div>
  );
}

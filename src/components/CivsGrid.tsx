import Link from "next/link";
import type { GameCivilization } from "@/lib/db";

interface Props {
  civs:      GameCivilization[];
  emptyLabel: string;
  basePath:  string;
  groupBy?:  (civ: GameCivilization) => string;
}

function WinRateBar({ value }: { value: number }) {
  const pct   = Math.min(100, Math.max(0, value));
  const color = pct >= 52 ? "bg-emerald-500" : pct >= 48 ? "bg-[#c8a32e]" : "bg-red-500";
  return (
    <div className="mt-2">
      <div className="flex items-center justify-between text-[10px] mb-1">
        <span className="text-faint">Win rate</span>
        <span className={`font-bold tabular-nums ${pct >= 52 ? "text-emerald-400" : pct >= 48 ? "text-[#c8a32e]" : "text-red-400"}`}>
          {pct.toFixed(1)} %
        </span>
      </div>
      <div className="h-1 bg-surface-2 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function CivCard({ civ, href }: { civ: GameCivilization; href: string }) {
  const pantheon = typeof civ.data?.pantheon === "string" ? civ.data.pantheon : null;
  return (
    <Link
      href={href}
      className="bg-surface border border-border-site rounded-xl p-4 hover:border-[#c8a32e]/40 hover:bg-surface-2 transition-colors flex flex-col gap-2 group"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="font-bold text-foreground text-sm leading-snug group-hover:text-[#c8a32e] transition-colors">
          {civ.name}
        </p>
        {civ.dlc && (
          <span className="shrink-0 text-[9px] font-bold tracking-wider px-1.5 py-0.5 rounded bg-[#c8a32e]/10 text-[#c8a32e] border border-[#c8a32e]/20">
            {civ.dlc}
          </span>
        )}
      </div>

      {pantheon && <p className="text-[11px] text-faint">{pantheon}</p>}
      {civ.description && <p className="text-[11px] text-muted line-clamp-2">{civ.description}</p>}

      {civ.winRate != null && <WinRateBar value={civ.winRate} />}

      {civ.pickRate != null && (
        <p className="text-[10px] text-faint">
          Pick rate : <span className="text-muted font-semibold">{civ.pickRate.toFixed(1)} %</span>
          {civ.gamesCount != null && <> · {civ.gamesCount.toLocaleString("fr-FR")} parties</>}
        </p>
      )}
    </Link>
  );
}

export default function CivsGrid({ civs, emptyLabel, basePath, groupBy }: Props) {
  if (civs.length === 0) {
    return (
      <div className="text-center py-20 bg-surface border border-border-site rounded-xl">
        <p className="text-muted font-semibold">{emptyLabel}</p>
        <p className="text-faint text-sm mt-1">
          Un administrateur doit synchroniser les données depuis le back-office.
        </p>
      </div>
    );
  }

  if (!groupBy) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {civs.map(c => <CivCard key={c.id} civ={c} href={`${basePath}/${c.slug}`} />)}
      </div>
    );
  }

  const groups = new Map<string, GameCivilization[]>();
  for (const civ of civs) {
    const key = groupBy(civ);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(civ);
  }

  return (
    <div className="space-y-8">
      {[...groups.entries()].map(([group, items]) => (
        <div key={group}>
          <p className="text-[10px] font-bold tracking-widest text-faint uppercase mb-3">{group}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {items.map(c => <CivCard key={c.id} civ={c} href={`${basePath}/${c.slug}`} />)}
          </div>
        </div>
      ))}
    </div>
  );
}

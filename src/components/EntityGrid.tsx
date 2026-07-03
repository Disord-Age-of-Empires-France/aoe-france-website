"use client";

import { useState, useMemo, Fragment } from "react";
import type { GameEntity } from "@/lib/db";

type TabType = "unit" | "building" | "technology";

const TAB_LABELS: Record<TabType, string> = {
  unit:       "Unités",
  building:   "Bâtiments",
  technology: "Technologies",
};

const RESOURCE_COLOR: Record<string, string> = {
  food:  "text-amber-400",
  wood:  "text-lime-400",
  gold:  "text-yellow-400",
  coin:  "text-yellow-400",
  stone: "text-stone-400",
  favor: "text-purple-400",
};

const RESOURCE_FR: Record<string, string> = {
  food: "Nour.", wood: "Bois", gold: "Or", coin: "Or", stone: "Pierre", favor: "Faveur",
};

const ARMOR_LABEL: Record<string, string> = {
  melee:  "M", ranged: "D", hack: "M", pierce: "D", crush: "É",
};

function parseProscons(desc: string): { pros: string[]; cons: string[] } {
  const pros: string[] = [];
  const cons: string[] = [];
  for (const line of desc.split("\n")) {
    const t = line.trim();
    if (t.startsWith("+ ")) pros.push(t.slice(2));
    else if (t.startsWith("- ")) cons.push(t.slice(2));
  }
  return { pros, cons };
}

function EntityIcon({ iconUrl, name }: { iconUrl: string; name: string }) {
  if (!iconUrl) return <div className="w-8 h-8 rounded bg-surface-2 shrink-0" />;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={iconUrl} alt={name} width={32} height={32} className="rounded shrink-0 object-contain" />
  );
}

function CostDisplay({ cost }: { cost: Record<string, number> }) {
  const entries = Object.entries(cost).filter(([, v]) => v > 0);
  if (!entries.length) return <span className="text-faint text-xs">Gratuit</span>;
  return (
    <div className="flex flex-wrap gap-x-2 gap-y-0.5 justify-end">
      {entries.map(([k, v]) => (
        <span key={k} className={`text-xs tabular-nums font-medium ${RESOURCE_COLOR[k] ?? "text-muted"}`}>
          {v}<span className="font-normal text-[9px] opacity-70 ml-0.5">{RESOURCE_FR[k] ?? k}</span>
        </span>
      ))}
    </div>
  );
}

function UnitRow({ entity }: { entity: GameEntity }) {
  const s = entity.stats;
  const hp          = s.hp          != null ? Number(s.hp)          : null;
  const attack      = s.attack      != null ? Number(s.attack)      : null;
  const dps         = s.dps         != null ? Number(s.dps)         : null;
  const range       = s.range       != null ? Number(s.range)       : null;
  const trainTime   = s.trainTime   != null ? Number(s.trainTime)   : null;
  const moveSpeed   = s.moveSpeed   != null ? Number(s.moveSpeed)   : null;
  const armor       = s.armor  != null && typeof s.armor === "object" ? s.armor  as Record<string, number> : null;
  const cost        = s.cost   != null && typeof s.cost  === "object" ? s.cost   as Record<string, number> : null;
  const producedBy  = Array.isArray(s.producedBy) ? s.producedBy as string[] : null;
  const { pros, cons } = entity.description ? parseProscons(entity.description) : { pros: [], cons: [] };

  const armorEntries = armor ? Object.entries(armor).filter(([, v]) => v > 0) : [];

  return (
    <tr className="border-b border-border-site hover:bg-surface-2/40 transition-colors align-top">
      {/* Icône */}
      <td className="py-2.5 pl-3 pr-2 w-11">
        <EntityIcon iconUrl={entity.iconUrl} name={entity.name} />
      </td>

      {/* Nom + badges + pros/cons + produit par */}
      <td className="py-2.5 px-2 min-w-[200px]">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-sm font-semibold text-foreground leading-snug">{entity.name}</span>
          {entity.civilization && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#c8a32e]/15 text-[#c8a32e] border border-[#c8a32e]/25 whitespace-nowrap">
              Unique
            </span>
          )}
          <span className="text-[10px] text-faint">{entity.age}</span>
        </div>

        {(pros.length > 0 || cons.length > 0) && (
          <div className="mt-1.5 space-y-0.5">
            {pros.map((p, i) => (
              <p key={i} className="text-[10px] text-emerald-400 leading-tight">+ {p}</p>
            ))}
            {cons.map((c, i) => (
              <p key={i} className="text-[10px] text-red-400/80 leading-tight">- {c}</p>
            ))}
          </div>
        )}

        {producedBy && producedBy.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {producedBy.slice(0, 3).map(b => (
              <span key={b} className="text-[9px] px-1 py-0.5 bg-surface-2 border border-border-site rounded text-faint whitespace-nowrap">
                {b.split("-").map(w => w[0].toUpperCase() + w.slice(1)).join(" ")}
              </span>
            ))}
          </div>
        )}
      </td>

      {/* PV */}
      <td className="py-2.5 px-2 text-sm tabular-nums text-foreground text-right whitespace-nowrap">
        {hp ?? "—"}
      </td>

      {/* DPS */}
      <td className="py-2.5 px-2 text-right whitespace-nowrap">
        {dps != null ? (
          <span className="text-sm tabular-nums text-orange-400 font-semibold">{dps}</span>
        ) : attack != null ? (
          <span className="text-sm tabular-nums text-foreground">{attack}</span>
        ) : (
          <span className="text-muted text-sm">—</span>
        )}
      </td>

      {/* Portée */}
      <td className="py-2.5 px-2 text-sm tabular-nums text-muted text-right whitespace-nowrap">
        {range != null ? range : "—"}
      </td>

      {/* Armure */}
      <td className="py-2.5 px-2 text-right whitespace-nowrap">
        {armorEntries.length > 0 ? (
          <div className="flex gap-1 justify-end">
            {armorEntries.map(([k, v]) => (
              <span key={k} className="text-[10px] font-medium px-1.5 py-0.5 bg-surface-2 rounded text-muted">
                {ARMOR_LABEL[k] ?? k[0]}{v}
              </span>
            ))}
          </div>
        ) : (
          <span className="text-faint text-sm">—</span>
        )}
      </td>

      {/* Vitesse */}
      <td className="py-2.5 px-2 text-sm tabular-nums text-faint text-right whitespace-nowrap">
        {moveSpeed != null ? moveSpeed.toFixed(2) : "—"}
      </td>

      {/* Coût */}
      <td className="py-2.5 px-2 text-right">
        {cost ? <CostDisplay cost={cost} /> : <span className="text-faint text-sm">—</span>}
      </td>

      {/* Temps de formation */}
      <td className="py-2.5 pr-3 pl-2 text-sm tabular-nums text-muted text-right whitespace-nowrap">
        {trainTime ? `${trainTime}s` : "—"}
      </td>
    </tr>
  );
}

function BuildingRow({ entity }: { entity: GameEntity }) {
  const s = entity.stats;
  const hp        = s.hp        != null ? Number(s.hp)        : null;
  const buildTime = s.buildTime != null ? Number(s.buildTime) : null;
  const cost      = s.cost != null && typeof s.cost === "object" ? s.cost as Record<string, number> : null;
  const { pros, cons } = entity.description ? parseProscons(entity.description) : { pros: [], cons: [] };
  const hasProsCons = pros.length > 0 || cons.length > 0;

  return (
    <tr className="border-b border-border-site hover:bg-surface-2/40 transition-colors align-top">
      <td className="py-2.5 pl-3 pr-2 w-11">
        <EntityIcon iconUrl={entity.iconUrl} name={entity.name} />
      </td>
      <td className="py-2.5 px-2 min-w-[200px]">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-sm font-semibold text-foreground">{entity.name}</span>
          {entity.civilization && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#c8a32e]/15 text-[#c8a32e] border border-[#c8a32e]/25">Unique</span>
          )}
          <span className="text-[10px] text-faint">{entity.age}</span>
        </div>
        {hasProsCons ? (
          <div className="mt-1.5 space-y-0.5">
            {pros.map((p, i) => <p key={i} className="text-[10px] text-emerald-400 leading-tight">+ {p}</p>)}
            {cons.map((c, i) => <p key={i} className="text-[10px] text-red-400/80 leading-tight">- {c}</p>)}
          </div>
        ) : entity.description ? (
          <p className="text-[10px] text-faint mt-1 leading-snug">{entity.description}</p>
        ) : null}
      </td>
      <td className="py-2.5 px-2 text-sm tabular-nums text-foreground text-right whitespace-nowrap">
        {hp ?? "—"}
      </td>
      <td className="py-2.5 px-2 text-right">
        {cost ? <CostDisplay cost={cost} /> : <span className="text-faint text-sm">—</span>}
      </td>
      <td className="py-2.5 pr-3 pl-2 text-sm tabular-nums text-muted text-right whitespace-nowrap">
        {buildTime ? `${buildTime}s` : "—"}
      </td>
    </tr>
  );
}

function TechRow({ entity }: { entity: GameEntity }) {
  const s = entity.stats;
  const researchTime = s.researchTime != null ? Number(s.researchTime) : null;
  const cost         = s.cost != null && typeof s.cost === "object" ? s.cost as Record<string, number> : null;
  const effect       = s.effect != null ? String(s.effect) : null;

  return (
    <tr className="border-b border-border-site hover:bg-surface-2/40 transition-colors align-top">
      <td className="py-2.5 pl-3 pr-2 w-11">
        <EntityIcon iconUrl={entity.iconUrl} name={entity.name} />
      </td>
      <td className="py-2.5 px-2 min-w-[180px]">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-sm font-semibold text-foreground">{entity.name}</span>
          {entity.civilization && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#c8a32e]/15 text-[#c8a32e] border border-[#c8a32e]/25">Unique</span>
          )}
          <span className="text-[10px] text-faint">{entity.age}</span>
        </div>
        {entity.category && (
          <p className="text-[10px] text-faint mt-0.5">{entity.category}</p>
        )}
      </td>
      <td className="py-2.5 px-2 text-right">
        {cost ? <CostDisplay cost={cost} /> : <span className="text-faint text-sm">—</span>}
      </td>
      <td className="py-2.5 px-2 text-sm tabular-nums text-muted text-right whitespace-nowrap">
        {researchTime ? `${researchTime}s` : "—"}
      </td>
      <td className="py-2.5 pr-3 pl-2 max-w-xs">
        {effect && <p className="text-[11px] text-muted leading-relaxed italic">{effect}</p>}
      </td>
    </tr>
  );
}

const UNIT_COLS = (
  <tr className="border-b border-border-site bg-surface-2">
    <th className="py-2 pl-3 pr-2 w-11" />
    <th className="py-2 px-2 text-left text-[10px] font-semibold uppercase tracking-wider text-faint">Nom</th>
    <th className="py-2 px-2 text-right text-[10px] font-semibold uppercase tracking-wider text-faint">PV</th>
    <th className="py-2 px-2 text-right text-[10px] font-semibold uppercase tracking-wider text-faint">DPS</th>
    <th className="py-2 px-2 text-right text-[10px] font-semibold uppercase tracking-wider text-faint">Portée</th>
    <th className="py-2 px-2 text-right text-[10px] font-semibold uppercase tracking-wider text-faint">Armure</th>
    <th className="py-2 px-2 text-right text-[10px] font-semibold uppercase tracking-wider text-faint">Vitesse</th>
    <th className="py-2 px-2 text-right text-[10px] font-semibold uppercase tracking-wider text-faint">Coût</th>
    <th className="py-2 pr-3 pl-2 text-right text-[10px] font-semibold uppercase tracking-wider text-faint">Forma.</th>
  </tr>
);

const BUILDING_COLS = (
  <tr className="border-b border-border-site bg-surface-2">
    <th className="py-2 pl-3 pr-2 w-11" />
    <th className="py-2 px-2 text-left text-[10px] font-semibold uppercase tracking-wider text-faint">Nom</th>
    <th className="py-2 px-2 text-right text-[10px] font-semibold uppercase tracking-wider text-faint">PV</th>
    <th className="py-2 px-2 text-right text-[10px] font-semibold uppercase tracking-wider text-faint">Coût</th>
    <th className="py-2 pr-3 pl-2 text-right text-[10px] font-semibold uppercase tracking-wider text-faint">Constr.</th>
  </tr>
);

const TECH_COLS = (
  <tr className="border-b border-border-site bg-surface-2">
    <th className="py-2 pl-3 pr-2 w-11" />
    <th className="py-2 px-2 text-left text-[10px] font-semibold uppercase tracking-wider text-faint">Nom</th>
    <th className="py-2 px-2 text-right text-[10px] font-semibold uppercase tracking-wider text-faint">Coût</th>
    <th className="py-2 px-2 text-right text-[10px] font-semibold uppercase tracking-wider text-faint">Recherche</th>
    <th className="py-2 pr-3 pl-2 text-left text-[10px] font-semibold uppercase tracking-wider text-faint">Effet</th>
  </tr>
);

const COL_SPAN: Record<TabType, number> = { unit: 9, building: 5, technology: 5 };

function GroupedTable({ entities, type }: { entities: GameEntity[]; type: TabType }) {
  const groups = useMemo(() => {
    const map = new Map<string, GameEntity[]>();
    for (const e of entities) {
      const key = e.category || "Autre";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b, "fr"));
  }, [entities]);

  if (!entities.length) {
    return <p className="text-faint text-sm text-center py-8">Aucune donnée pour cette catégorie.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border-site">
      <table className="w-full">
        <thead>
          {type === "unit" ? UNIT_COLS : type === "building" ? BUILDING_COLS : TECH_COLS}
        </thead>
        <tbody>
          {groups.map(([cat, items]) => (
            <Fragment key={cat}>
              <tr className="bg-surface/70">
                <td colSpan={COL_SPAN[type]} className="py-1.5 px-4 text-[10px] font-bold uppercase tracking-widest text-[#c8a32e]/75 border-b border-border-site">
                  {cat}
                </td>
              </tr>
              {items.map(e =>
                type === "unit"     ? <UnitRow     key={e.id} entity={e} /> :
                type === "building" ? <BuildingRow key={e.id} entity={e} /> :
                                     <TechRow     key={e.id} entity={e} />
              )}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function EntityGrid({ entities }: { entities: GameEntity[] }) {
  const counts: Record<TabType, number> = {
    unit:       entities.filter(e => e.type === "unit").length,
    building:   entities.filter(e => e.type === "building").length,
    technology: entities.filter(e => e.type === "technology").length,
  };

  const availableTabs = (["unit", "building", "technology"] as TabType[]).filter(t => counts[t] > 0);
  const [activeTab, setActiveTab] = useState<TabType>(availableTabs[0] ?? "unit");

  if (!entities.length) {
    return (
      <div className="bg-surface border border-border-site rounded-xl p-8 text-center">
        <p className="text-muted font-semibold text-sm">Aucune donnée</p>
        <p className="text-faint text-xs mt-2">Synchronisez les données depuis l'administration.</p>
      </div>
    );
  }

  const filtered = entities.filter(e => e.type === activeTab);

  return (
    <div>
      <div className="flex gap-1 mb-5 border-b border-border-site">
        {availableTabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === tab
                ? "border-[#c8a32e] text-[#c8a32e]"
                : "border-transparent text-muted hover:text-foreground"
            }`}
          >
            {TAB_LABELS[tab]}
            <span className="ml-1.5 text-[10px] opacity-60">({counts[tab]})</span>
          </button>
        ))}
      </div>

      <GroupedTable entities={filtered} type={activeTab} />
    </div>
  );
}

"use client";

import { useState } from "react";
import type { ReactNode } from "react";

type TabId = "profil" | "publications" | "dashboard";

interface Props {
  profileContent:      ReactNode;
  publicationsContent: ReactNode;
  dashboardContent:    ReactNode;
  pendingCount:        number;
  defaultTab?:         TabId;
}

export default function ProfileTabs({
  profileContent,
  publicationsContent,
  dashboardContent,
  pendingCount,
  defaultTab = "dashboard",
}: Props) {
  const [tab, setTab] = useState<TabId>(defaultTab);

  return (
    <div>
      {/* Onglets */}
      <div className="flex overflow-x-auto border-b border-border-site mb-6 scrollbar-hide">
        {([
          { id: "dashboard"    as const, label: "Tableau de bord", badge: 0            },
          { id: "profil"       as const, label: "Mon compte",      badge: 0            },
          { id: "publications" as const, label: "Publications",    badge: pendingCount },
        ]).map(({ id, label, badge }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`relative shrink-0 whitespace-nowrap px-4 sm:px-5 py-3 text-sm font-semibold tracking-wide transition-colors border-b-2 -mb-px ${
              tab === id
                ? "border-[#c8a32e] text-[#c8a32e]"
                : "border-transparent text-faint hover:text-muted"
            }`}
          >
            {label}
            {badge > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-bold">
                {badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === "dashboard"    && dashboardContent}
      {tab === "profil"       && profileContent}
      {tab === "publications" && publicationsContent}
    </div>
  );
}

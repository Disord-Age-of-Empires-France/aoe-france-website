"use client";

import { useState } from "react";
import type { ReactNode } from "react";

interface Props {
  profileContent:      ReactNode;
  publicationsContent: ReactNode;
  pendingCount:        number;
  defaultTab?:         "profil" | "publications";
}

export default function ProfileTabs({ profileContent, publicationsContent, pendingCount, defaultTab = "profil" }: Props) {
  const [tab, setTab] = useState<"profil" | "publications">(defaultTab);

  return (
    <div>
      {/* Onglets */}
      <div className="flex border-b border-border-site mb-6">
        {([
          { id: "profil",        label: "Mon compte",    badge: 0 },
          { id: "publications",  label: "Publications",  badge: pendingCount },
        ] as const).map(({ id, label, badge }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`relative px-5 py-3 text-sm font-semibold tracking-wide transition-colors border-b-2 -mb-px ${
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

      {tab === "profil"       && profileContent}
      {tab === "publications" && publicationsContent}
    </div>
  );
}

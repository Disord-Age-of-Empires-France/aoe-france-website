"use client";

import { useState } from "react";
import { Menu, Shield } from "lucide-react";
import AdminSidebar from "./AdminSidebar";
import type { UserRole } from "@/lib/session";

interface Props {
  username: string;
  role:     UserRole;
  children: React.ReactNode;
}

export default function AdminShell({ username, role, children }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-surface-3">

      {/* Overlay mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar — fixe sur desktop, drawer sur mobile */}
      <div
        className={`
          fixed inset-y-0 left-0 z-50 w-60 transition-transform duration-300 ease-in-out
          lg:static lg:translate-x-0 lg:z-auto
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <AdminSidebar
          username={username}
          role={role}
          onClose={() => setIsOpen(false)}
        />
      </div>

      {/* Zone contenu */}
      <div className="flex-1 flex flex-col overflow-y-auto min-w-0">

        {/* Topbar mobile (masquée sur desktop) */}
        <div className="lg:hidden flex items-center gap-3 px-4 h-14 bg-surface-3 border-b border-border-site shrink-0 sticky top-0 z-30">
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="p-2 rounded-md text-muted hover:text-foreground hover:bg-surface transition-colors"
            aria-label="Ouvrir le menu"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-1.5 text-[11px] tracking-widest text-faint uppercase font-semibold">
            <Shield size={10} />
            Administration
          </div>
        </div>

        {children}
      </div>
    </div>
  );
}

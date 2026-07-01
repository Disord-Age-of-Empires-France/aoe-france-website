"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Newspaper,
  Settings,
  LogOut,
  ChevronRight,
  Shield,
  ExternalLink,
  Users,
  CircleUser,
  ScrollText,
  Bot,
  MessageSquare,
} from "lucide-react";
import { logout } from "@/app/actions/auth";
import ThemeToggle from "@/components/ThemeToggle";
import type { UserRole } from "@/lib/session";

const NAV_ALL = [
  { label: "Tableau de bord", href: "/admin",           icon: LayoutDashboard,  exact: true  },
  { label: "Actualités",      href: "/admin/actualites", icon: Newspaper,        exact: false },
  { label: "Forum",           href: "/admin/forum",      icon: MessageSquare,    exact: false },
];

const NAV_ADMIN = [
  { label: "Utilisateurs",   href: "/admin/utilisateurs", icon: Users,       exact: false },
  { label: "Bot Discord",    href: "/admin/bot",          icon: Bot,         exact: false },
  { label: "Logs",           href: "/admin/logs",         icon: ScrollText,  exact: false },
  { label: "Paramètres",     href: "/admin/parametres",   icon: Settings,    exact: false },
];

interface Props {
  username: string;
  role:     UserRole;
}

export default function AdminSidebar({ username, role }: Props) {
  const pathname = usePathname();
  const navItems = role === "admin" ? [...NAV_ALL, ...NAV_ADMIN] : role === "editor" ? NAV_ALL : [];

  function isActive(href: string, exact: boolean) {
    return exact ? pathname === href : pathname.startsWith(href);
  }

  return (
    <aside className="w-60 shrink-0 flex flex-col bg-surface-3 border-r border-border-site h-screen sticky top-0 overflow-y-auto">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-border-site">
        <Link href="/" target="_blank">
          <Image
            src="/logo.png"
            alt="Age of Empires France"
            width={48}
            height={48}
            className="site-logo"
          />
        </Link>
        <div className="mt-3 flex items-center gap-1.5 text-[10px] tracking-widest text-faint uppercase font-semibold">
          <Shield size={10} />
          Administration
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-5 space-y-0.5">
        {navItems.length > 0 && (
          <p className="px-2 mb-3 text-[10px] tracking-widest text-faint uppercase font-semibold">
            Menu
          </p>
        )}
        {navItems.map((item) => {
          const active = isActive(item.href, item.exact);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded text-sm font-medium transition-colors group ${
                active
                  ? "bg-[#c8a32e]/10 text-[#c8a32e] border border-[#c8a32e]/20"
                  : "text-muted hover:text-foreground hover:bg-surface"
              }`}
            >
              <item.icon size={16} className="shrink-0" />
              <span className="flex-1">{item.label}</span>
              {active && <ChevronRight size={12} className="text-[#c8a32e]/60" />}
            </Link>
          );
        })}

        <div className="pt-4">
          <p className="px-2 mb-3 text-[10px] tracking-widest text-faint uppercase font-semibold">
            Liens rapides
          </p>
          <Link
            href="/profil"
            className={`flex items-center gap-3 px-3 py-2.5 rounded text-sm font-medium transition-colors ${
              pathname === "/profil"
                ? "bg-[#c8a32e]/10 text-[#c8a32e] border border-[#c8a32e]/20"
                : "text-muted hover:text-foreground hover:bg-surface"
            }`}
          >
            <CircleUser size={15} />
            <span>Mon compte</span>
          </Link>
          <a
            href="/"
            target="_blank"
            className="flex items-center gap-3 px-3 py-2.5 rounded text-sm font-medium text-muted hover:text-foreground hover:bg-surface transition-colors"
          >
            <ExternalLink size={15} />
            <span>Voir le site</span>
          </a>
        </div>
      </nav>

      {/* Theme toggle + User + logout */}
      <div className="px-3 py-4 border-t border-border-site space-y-2">
        {/* Theme */}
        <div className="flex items-center justify-between px-3 py-2 rounded bg-surface border border-border-site">
          <span className="text-[11px] text-faint font-medium tracking-wide">Thème</span>
          <ThemeToggle />
        </div>

        {/* User info */}
        <div className="px-3 py-2 rounded bg-surface border border-border-site">
          <div className="flex items-center justify-between">
            <div className="text-[10px] tracking-wider text-faint uppercase">Connecté</div>
            <span className={`text-[9px] font-bold tracking-wider px-1.5 py-0.5 rounded ${
              role === "admin"  ? "bg-amber-800/60 text-amber-300" :
              role === "editor" ? "bg-blue-800/60 text-blue-300"   :
                                  "bg-gray-800/60 text-gray-400"
            }`}>
              {role === "admin" ? "Admin" : role === "editor" ? "Éditeur" : "Membre"}
            </span>
          </div>
          <div className="text-sm font-semibold text-foreground mt-0.5">{username}</div>
        </div>

        <form action={logout}>
          <button
            type="submit"
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded text-sm font-medium text-muted hover:text-red-400 hover:bg-red-500/5 transition-colors"
          >
            <LogOut size={15} className="shrink-0" />
            Déconnexion
          </button>
        </form>
      </div>
    </aside>
  );
}

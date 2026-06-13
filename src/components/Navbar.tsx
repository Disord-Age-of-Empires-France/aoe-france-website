"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ChevronDown, Menu, X, LogOut, User } from "lucide-react";
import DiscordIcon from "@/components/DiscordIcon";
import ThemeToggle from "@/components/ThemeToggle";
import type { UserRole } from "@/lib/session";
import { GAME_NAV_ITEMS, SECTION_NAV_ITEMS, type GameId, type SectionId } from "@/lib/nav-items";

const BASE_NAV_LINKS = [
  { label: "ACCUEIL",      href: "/",           feature: null,              gameId: null,          sectionId: null },
  { label: "AOE2",         href: "/aoe2",        feature: null,              gameId: "aoe2" as const, sectionId: null },
  { label: "AOE3",         href: "/aoe3",        feature: null,              gameId: "aoe3" as const, sectionId: null },
  { label: "AOE4",         href: "/aoe4",        feature: null,              gameId: "aoe4" as const, sectionId: null },
  { label: "AOM: RETOLD",  href: "/aom-retold",  feature: null,              gameId: "aom"  as const, sectionId: null },
  { label: "ACTUALITÉS",   href: "/actualites",  feature: "news"      as const, gameId: null,        sectionId: "news"      as const },
  { label: "GUIDES",       href: "/guides",      feature: "guides"    as const, gameId: null,        sectionId: "guides"    as const },
  { label: "COMMUNAUTÉ",   href: "/communaute",  feature: "community" as const, gameId: null,        sectionId: "community" as const },
];

interface Features {
  news:      boolean;
  guides:    boolean;
  community: boolean;
  games?:    { aoe2: boolean; aoe3: boolean; aoe4: boolean; aom: boolean; };
  navItems?: {
    aoe2: string[]; aoe3: string[]; aoe4: string[]; aom: string[];
    news: string[]; guides: string[]; community: string[];
  };
}

interface NavbarProps {
  discordInvite?: string;
  session?: { username: string; role: UserRole } | null;
  features?: Features;
}

export default function Navbar({ discordInvite = "#discord", session, features }: NavbarProps) {
  const navLinks = BASE_NAV_LINKS
    .filter((link) => {
      if (link.gameId && features?.games && !features.games[link.gameId]) return false;
      if (link.feature && features && !features[link.feature]) return false;
      return true;
    })
    .map((link) => {
      if (link.gameId) {
        const gameId = link.gameId as GameId;
        const enabledKeys = features?.navItems?.[gameId];
        const items = GAME_NAV_ITEMS[gameId]
          .filter((item) => !enabledKeys || enabledKeys.includes(item.key))
          .map((item) => ({ label: item.label, href: `${link.href}/${item.key}` }));
        return { ...link, resolvedDropdown: items };
      }
      if (link.sectionId) {
        const sectionId = link.sectionId as SectionId;
        const enabledKeys = features?.navItems?.[sectionId];
        const items = SECTION_NAV_ITEMS[sectionId]
          .filter((item) => !enabledKeys || enabledKeys.includes(item.key))
          .map((item) => ({ label: item.label, href: `${link.href}/${item.key}` }));
        return { ...link, resolvedDropdown: items };
      }
      return link;
    });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const pathname = usePathname();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border-site">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-20">
        {/* Logo */}
        <Link href="/" className="flex items-center shrink-0">
          <Image
            src="/logo.png"
            alt="Age of Empires France"
            width={60}
            height={60}
            className="w-[60px] h-[60px] site-logo"
            priority
          />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-2">
          {navLinks.map((link) => {
            const items: { label: string; href: string }[] =
              "resolvedDropdown" in link && link.resolvedDropdown
                ? link.resolvedDropdown
                : (link.dropdown ?? []).map((label) => ({
                    label,
                    href: `${link.href}/${label.toLowerCase().replace(/\s+/g, "-").replace(/[éè]/g, "e").replace(/[àâ]/g, "a")}`,
                  }));
            const hasDropdown = items.length > 0;
            return (
              <div
                key={link.label}
                className="relative group"
                onMouseEnter={() => hasDropdown && setOpenDropdown(link.label)}
                onMouseLeave={() => setOpenDropdown(null)}
              >
                {hasDropdown ? (
                  <button
                    type="button"
                    className={`flex items-center gap-1 px-4 py-7 text-[13px] font-semibold tracking-wider transition-colors border-b-2 cursor-default ${
                      pathname.startsWith(link.href + "/") || pathname === link.href
                        ? "text-[#c8a32e] border-[#c8a32e]"
                        : "text-muted hover:text-[#c8a32e] border-transparent"
                    }`}
                  >
                    {link.label}
                    <ChevronDown
                      size={12}
                      className={`transition-transform mt-0.5 ${openDropdown === link.label ? "rotate-180" : ""}`}
                    />
                  </button>
                ) : (
                  <Link
                    href={link.href}
                    className={`flex items-center gap-1 px-4 py-7 text-[13px] font-semibold tracking-wider transition-colors border-b-2 ${
                      pathname === link.href
                        ? "text-[#c8a32e] border-[#c8a32e]"
                        : "text-muted hover:text-[#c8a32e] border-transparent"
                    }`}
                  >
                    {link.label}
                  </Link>
                )}
                {hasDropdown && openDropdown === link.label && (
                  <div className="absolute top-full left-0 min-w-[170px] bg-surface border border-border-site shadow-xl rounded-b">
                    {items.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="block px-5 py-3 text-[13px] font-medium tracking-wide text-foreground/70 hover:text-[#c8a32e] hover:bg-surface-2 transition-colors"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Theme toggle + User menu or Discord CTA */}
        {session ? (
          <div className="hidden lg:flex items-center gap-2 shrink-0">
            <ThemeToggle />
            {(session.role === "admin" || session.role === "editor") && (
              <Link
                href="/admin"
                className="text-[13px] font-semibold text-muted hover:text-[#c8a32e] tracking-wider px-3 py-3 transition-colors"
              >
                BACK OFFICE
              </Link>
            )}
            <div className="flex items-center gap-2 border border-border-site rounded px-3 py-2.5 text-[13px] text-faint">
              <User size={14} />
              <span className="font-medium text-muted">{session.username}</span>
            </div>
            <a
              href="/api/auth/logout"
              className="flex items-center gap-1.5 text-[13px] font-semibold text-faint hover:text-red-400 tracking-wider px-2 py-3 transition-colors"
              title="Se déconnecter"
            >
              <LogOut size={16} />
            </a>
          </div>
        ) : (
          <div className="hidden lg:flex items-center gap-2 shrink-0">
            <ThemeToggle />
            <a
              href={discordInvite}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-[#5865f2] hover:bg-[#4752c4] text-white text-[13px] font-bold tracking-wider px-5 py-3 rounded transition-colors"
            >
              <DiscordIcon size={17} />
              REJOINDRE LE DISCORD
            </a>
          </div>
        )}

        {/* Mobile menu toggle */}
        <button
          className="lg:hidden text-foreground p-1"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Menu"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <nav className="lg:hidden bg-surface border-t border-border-site px-4 py-4 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="block py-2.5 text-sm font-semibold tracking-wider text-foreground/70 hover:text-[#c8a32e] transition-colors border-b border-border-site/50"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          {session ? (
            <div className="mt-3 space-y-2">
              <div className="flex items-center gap-2 px-3 py-2 border border-border-site rounded text-sm text-foreground/70">
                <User size={14} />
                <span>{session.username}</span>
              </div>
              {(session.role === "admin" || session.role === "editor") && (
                <Link
                  href="/admin"
                  className="block text-center py-2.5 text-sm font-semibold tracking-wider text-[#c8a32e] border border-[#c8a32e]/30 rounded"
                  onClick={() => setMobileOpen(false)}
                >
                  BACK OFFICE
                </Link>
              )}
              <a
                href="/api/auth/logout"
                className="flex items-center justify-center gap-2 border border-red-800/40 text-red-400 text-[11px] font-bold tracking-wider px-4 py-3 rounded w-full"
              >
                <LogOut size={14} />
                DÉCONNEXION
              </a>
            </div>
          ) : (
            <div className="mt-3 space-y-2">
              <a
                href={discordInvite}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-[#5865f2] text-white text-[11px] font-bold tracking-wider px-4 py-3 rounded w-full"
                onClick={() => setMobileOpen(false)}
              >
                <DiscordIcon size={16} />
                REJOINDRE LE DISCORD
              </a>
            </div>
          )}
          <div className="pt-2 flex justify-end">
            <ThemeToggle />
          </div>
        </nav>
      )}
    </header>
  );
}

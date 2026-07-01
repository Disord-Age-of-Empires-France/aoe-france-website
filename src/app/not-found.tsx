import Link from "next/link";
import { ChevronRight, Home, Newspaper, SearchX, Users } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getSettings } from "@/lib/db";
import { getSession } from "@/lib/session";

export const metadata = {
  title: "Page introuvable | AoE France",
};

export default async function NotFound() {
  const [settings, session] = await Promise.all([getSettings(), getSession()]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar
        discordInvite={settings.discordInvite}
        session={session}
        features={{ ...settings.features, navItems: settings.navItems }}
        maintenanceActive={settings.maintenance.active}
        maintenanceEndAt={settings.maintenance.endAt}
      />

      <main className="flex-1 flex items-center justify-center px-4 pt-36 pb-20">
        <div className="max-w-lg w-full text-center">

          {/* Icône + code */}
          <div className="flex items-center justify-center mb-8">
            <div className="relative">
              <div className="w-24 h-24 rounded-2xl bg-surface border border-border-site flex items-center justify-center">
                <SearchX size={40} className="text-faint" />
              </div>
              <div className="absolute -top-2 -right-2 bg-surface border border-border-site text-faint text-[10px] font-black tracking-widest px-2 py-0.5 rounded">
                404
              </div>
            </div>
          </div>

          {/* Titre */}
          <h1 className="text-3xl font-black tracking-tight text-foreground mb-2">
            Page introuvable
          </h1>
          <div className="w-12 h-1 bg-border-site rounded mx-auto mb-6" />

          <p className="text-muted text-base leading-relaxed mb-10">
            Cette page n&apos;existe pas. Vérifiez l&apos;URL ou utilisez les liens
            ci-dessous pour retrouver votre chemin.
          </p>

          {/* Liens utiles */}
          <div className="space-y-3 text-left mb-10">
            <p className="text-[10px] font-bold tracking-widest text-faint uppercase mb-4">
              En attendant, explorez
            </p>

            {[
              {
                href:  "/",
                icon:  Home,
                label: "Page d'accueil",
                desc:  "Retourner à l'accueil",
              },
              {
                href:  "/actualites",
                icon:  Newspaper,
                label: "Actualités",
                desc:  "Toutes les dernières nouvelles AoE",
              },
              {
                href:  "/communaute",
                icon:  Users,
                label: "Communauté",
                desc:  "Discord, tournois et joueurs",
              },
            ].map(({ href, icon: Icon, label, desc }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-4 bg-surface border border-border-site hover:border-[#c8a32e]/40 rounded-lg px-5 py-4 transition-colors group"
              >
                <div className="w-9 h-9 rounded-lg bg-surface-2 border border-border-site flex items-center justify-center text-faint group-hover:text-[#c8a32e] transition-colors shrink-0">
                  <Icon size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-foreground text-sm group-hover:text-[#c8a32e] transition-colors">
                    {label}
                  </div>
                  <div className="text-faint text-xs mt-0.5">{desc}</div>
                </div>
                <ChevronRight
                  size={14}
                  className="text-faint ml-auto shrink-0 group-hover:translate-x-0.5 transition-transform"
                />
              </Link>
            ))}
          </div>

          {/* Jeux disponibles */}
          <div>
            <p className="text-[10px] font-bold tracking-widest text-faint uppercase mb-4">
              Pages de présentation
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {[
                { href: "/aoe2/presentation", label: "AOE II",       color: "text-purple-400 bg-purple-900/30 border-purple-800/40 hover:border-purple-600/60" },
                { href: "/aoe3/presentation", label: "AOE III",      color: "text-green-400  bg-green-900/30  border-green-800/40  hover:border-green-600/60" },
                { href: "/aoe4/presentation", label: "AOE IV",       color: "text-blue-400   bg-blue-900/30   border-blue-800/40   hover:border-blue-600/60" },
                { href: "/aom-retold/presentation", label: "AOM: RETOLD", color: "text-amber-400  bg-amber-900/30  border-amber-800/40  hover:border-amber-600/60" },
              ].map(({ href, label, color }) => (
                <Link
                  key={href}
                  href={href}
                  className={`text-[11px] font-bold tracking-widest border px-4 py-2 rounded transition-colors ${color}`}
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}

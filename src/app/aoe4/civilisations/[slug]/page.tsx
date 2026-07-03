import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import EntityGrid from "@/components/EntityGrid";
import { getGameCivilizations, getGameEntities, getSettings } from "@/lib/db";
import { getSession } from "@/lib/session";
import { gateFeature } from "@/lib/public-access";

interface Props { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const civs = await getGameCivilizations("aoe4");
  const civ = civs.find(c => c.slug === slug);
  return { title: civ ? `${civ.name} — AoE IV` : "Civilisation introuvable" };
}

export default async function Aoe4CivPage({ params }: Props) {
  const { slug } = await params;
  const [civs, entities, settings, session] = await Promise.all([
    getGameCivilizations("aoe4"),
    getGameEntities("aoe4", slug),
    getSettings(),
    getSession(),
  ]);
  gateFeature(settings, session, settings.features.games.aoe4);

  const civ = civs.find(c => c.slug === slug);
  if (!civ) notFound();

  return (
    <>
      <Navbar
        discordInvite={settings.discordInvite}
        session={session}
        features={{ ...settings.features, navItems: settings.navItems }}
        maintenanceActive={settings.maintenance.active}
        maintenanceEndAt={settings.maintenance.endAt}
      />
      <main className="flex-1 pt-28 pb-16 bg-background">
        <div className="max-w-5xl mx-auto px-4">

          <nav className="text-xs text-faint mb-6 flex items-center gap-1.5">
            <Link href="/aoe4/civilisations" className="flex items-center gap-1 hover:text-[#c8a32e] transition-colors">
              <ChevronLeft size={12} /> Civilisations
            </Link>
            <span>/</span>
            <span className="text-muted">{civ.name}</span>
          </nav>

          <div className="mb-8">
            <div className="flex items-start gap-3 flex-wrap">
              <h1 className="text-3xl font-bold text-foreground">{civ.name}</h1>
              {civ.dlc && (
                <span className="mt-1.5 text-[10px] font-bold tracking-wider px-2 py-0.5 rounded bg-[#c8a32e]/10 text-[#c8a32e] border border-[#c8a32e]/20">
                  {civ.dlc}
                </span>
              )}
            </div>
            {civ.description && (
              <p className="text-muted text-sm mt-3 leading-relaxed max-w-2xl">{civ.description}</p>
            )}
          </div>

          {civ.winRate != null && (
            <div className="grid grid-cols-3 gap-3 mb-8">
              <div className="bg-surface border border-border-site rounded-xl p-4 text-center">
                <p className={`text-2xl font-bold tabular-nums ${civ.winRate >= 52 ? "text-emerald-400" : civ.winRate >= 48 ? "text-[#c8a32e]" : "text-red-400"}`}>
                  {civ.winRate.toFixed(1)} %
                </p>
                <p className="text-[10px] text-faint uppercase tracking-wider mt-1">Win rate</p>
              </div>
              {civ.pickRate != null && (
                <div className="bg-surface border border-border-site rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold tabular-nums text-foreground">{civ.pickRate.toFixed(1)} %</p>
                  <p className="text-[10px] text-faint uppercase tracking-wider mt-1">Pick rate</p>
                </div>
              )}
              {civ.gamesCount != null && (
                <div className="bg-surface border border-border-site rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold tabular-nums text-foreground">{civ.gamesCount.toLocaleString("fr-FR")}</p>
                  <p className="text-[10px] text-faint uppercase tracking-wider mt-1">Parties</p>
                </div>
              )}
            </div>
          )}

          <EntityGrid entities={entities} />
        </div>
      </main>
      <Footer />
    </>
  );
}

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CivsGrid from "@/components/CivsGrid";
import { getGameCivilizations, getSettings } from "@/lib/db";
import { getSession } from "@/lib/session";
import { gateFeature } from "@/lib/public-access";

export const metadata = { title: "Civilisations — Age of Empires IV" };

export default async function Aoe4CivilisationsPage() {
  const [civs, settings, session] = await Promise.all([
    getGameCivilizations("aoe4"),
    getSettings(),
    getSession(),
  ]);
  gateFeature(settings, session, settings.features.games.aoe4);

  const hasStats = civs.some(c => c.winRate != null);

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
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-8">
            <p className="text-[#c8a32e] text-xs font-bold tracking-[0.3em] mb-2">AGE OF EMPIRES IV</p>
            <h1 className="text-3xl md:text-4xl font-bold tracking-wide text-foreground">Civilisations</h1>
            <div className="w-12 h-0.5 bg-[#c8a32e] mt-3 mb-4" />
            <p className="text-muted text-sm">
              {civs.length > 0
                ? `${civs.length} civilisation${civs.length > 1 ? "s" : ""}${hasStats ? " · Statistiques ranked 1v1" : ""}`
                : "Données non encore synchronisées."
              }
            </p>
          </div>

          <CivsGrid
            civs={civs}
            emptyLabel="Aucune civilisation trouvée."
            basePath="/aoe4/civilisations"
            groupBy={c => c.dlc ? "DLC & Variants" : "Jeu de base"}
          />
        </div>
      </main>
      <Footer />
    </>
  );
}

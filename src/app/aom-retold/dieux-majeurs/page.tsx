import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CivsGrid from "@/components/CivsGrid";
import { getGameCivilizations, getSettings } from "@/lib/db";
import { getSession } from "@/lib/session";
import { gateFeature } from "@/lib/public-access";

export const metadata = { title: "Dieux majeurs — Age of Mythology : Retold" };

export default async function AomDieuxMajeursPage() {
  const [gods, settings, session] = await Promise.all([
    getGameCivilizations("aom"),
    getSettings(),
    getSession(),
  ]);
  gateFeature(settings, session, settings.features.games.aom);

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
            <p className="text-[#c8a32e] text-xs font-bold tracking-[0.3em] mb-2">AGE OF MYTHOLOGY : RETOLD</p>
            <h1 className="text-3xl md:text-4xl font-bold tracking-wide text-foreground">Dieux majeurs</h1>
            <div className="w-12 h-0.5 bg-[#c8a32e] mt-3 mb-4" />
            <p className="text-muted text-sm">
              {gods.length > 0
                ? `${gods.length} dieu${gods.length > 1 ? "x" : ""} majeur${gods.length > 1 ? "s" : ""}`
                : "Données non encore synchronisées."
              }
            </p>
          </div>

          <CivsGrid
            civs={gods}
            emptyLabel="Aucun dieu majeur trouvé."
            basePath="/aom-retold/dieux-majeurs"
            groupBy={c => {
              const pantheon = typeof c.data?.pantheon === "string" ? c.data.pantheon : null;
              return pantheon ?? (c.dlc ?? "Panthéon");
            }}
          />
        </div>
      </main>
      <Footer />
    </>
  );
}

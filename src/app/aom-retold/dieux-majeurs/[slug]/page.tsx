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
  const gods = await getGameCivilizations("aom");
  const god = gods.find(g => g.slug === slug);
  return { title: god ? `${god.name} — AoM : Retold` : "Dieu introuvable" };
}

export default async function AomGodPage({ params }: Props) {
  const { slug } = await params;
  const [gods, entities, settings, session] = await Promise.all([
    getGameCivilizations("aom"),
    getGameEntities("aom", slug),
    getSettings(),
    getSession(),
  ]);
  gateFeature(settings, session, settings.features.games.aom);

  const god = gods.find(g => g.slug === slug);
  if (!god) notFound();

  const pantheon = typeof god.data?.pantheon === "string" ? god.data.pantheon : null;

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
            <Link href="/aom-retold/dieux-majeurs" className="flex items-center gap-1 hover:text-[#c8a32e] transition-colors">
              <ChevronLeft size={12} /> Dieux majeurs
            </Link>
            <span>/</span>
            <span className="text-muted">{god.name}</span>
          </nav>

          <div className="mb-8">
            <div className="flex items-start gap-3 flex-wrap">
              <h1 className="text-3xl font-bold text-foreground">{god.name}</h1>
              {god.dlc && (
                <span className="mt-1.5 text-[10px] font-bold tracking-wider px-2 py-0.5 rounded bg-[#c8a32e]/10 text-[#c8a32e] border border-[#c8a32e]/20">
                  {god.dlc}
                </span>
              )}
            </div>
            {pantheon && <p className="text-faint text-sm mt-1">Panthéon : {pantheon}</p>}
            {god.description && (
              <p className="text-muted text-sm mt-3 leading-relaxed max-w-2xl">{god.description}</p>
            )}
          </div>

          <EntityGrid entities={entities} />
        </div>
      </main>
      <Footer />
    </>
  );
}

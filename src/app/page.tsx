import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import GameSection from "@/components/GameSection";
import NewsSection from "@/components/NewsSection";
import Footer from "@/components/Footer";
import { getSettings, getUser } from "@/lib/db";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function Home() {
  const [settings, session] = await Promise.all([getSettings(), getSession()]);

  // Si un membre a été promu depuis la dernière connexion, rafraîchir la session
  if (session?.role === "member") {
    const user = await getUser(session.userId);
    if (user && user.role !== "member") redirect("/session-refresh");
  }
  return (
    <>
      <Navbar discordInvite={settings.discordInvite} session={session} features={{ ...settings.features, navItems: settings.navItems }} maintenanceActive={settings.maintenance.active}
        maintenanceEndAt={settings.maintenance.endAt} />
      <main className="flex-1">
        <Hero />
        <GameSection games={settings.features.games} />
        {settings.features.news && <NewsSection />}
      </main>
      <Footer />
    </>
  );
}

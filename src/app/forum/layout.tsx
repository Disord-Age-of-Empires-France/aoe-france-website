import { getForumCategories, getSettings } from "@/lib/db";
import { getSession } from "@/lib/session";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ForumSidebar from "@/components/forum/ForumSidebar";

export default async function ForumLayout({ children }: { children: React.ReactNode }) {
  const [categories, settings, session] = await Promise.all([
    getForumCategories(),
    getSettings(),
    getSession(),
  ]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar
        discordInvite={settings.discordInvite}
        session={session}
        features={{ ...settings.features, navItems: settings.navItems }}
        maintenanceActive={settings.maintenance.active}
        maintenanceEndAt={settings.maintenance.endAt}
      />

      <div className="flex-1 pt-20">
        <div className="max-w-6xl mx-auto px-4 py-10">
          <div className="lg:flex lg:gap-8 lg:items-start">
            <ForumSidebar categories={categories} />
            <main className="flex-1 min-w-0 mt-6 lg:mt-0">
              {children}
            </main>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

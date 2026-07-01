import type { Metadata } from "next";
import { AlertTriangle } from "lucide-react";
import { getSession } from "@/lib/session";
import { getSettings } from "@/lib/db";
import AdminSidebar from "@/components/admin/AdminSidebar";
import MaintenanceCountdown from "@/components/maintenance/MaintenanceCountdown";

export const metadata: Metadata = {
  title: { default: "Admin — AoE France", template: "%s — Admin AoE France" },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [session, settings] = await Promise.all([getSession(), getSettings()]);

  if (!session) return <>{children}</>;

  return (
    <div className="flex h-screen overflow-hidden bg-surface-3">
      <AdminSidebar username={session.username} role={session.role} />
      <div className="flex-1 flex flex-col overflow-y-auto">
        {settings.maintenance.active && (
          <div className="mx-6 mt-5 rounded-lg bg-red-950/60 border border-red-900/50 px-4 py-3 flex items-start gap-3 shrink-0">
            <AlertTriangle size={15} className="text-red-400 mt-0.5 shrink-0" />
            <div>
              <div className="text-red-400 text-[13px] font-bold">Le site est actuellement en maintenance</div>
              <div className="text-red-500/60 text-[12px] mt-0.5 flex items-center gap-1 flex-wrap">
                <span>Seuls les administrateurs peuvent accéder au site. Désactivez la maintenance pour le rouvrir au public.</span>
                {settings.maintenance.endAt && (
                  <span className="flex items-center gap-1">Retour estimé dans <MaintenanceCountdown endAt={settings.maintenance.endAt} compact mode="refresh" /></span>
                )}
              </div>
            </div>
          </div>
        )}
        <main className="flex-1">
          <div className="max-w-5xl mx-auto px-6 py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}

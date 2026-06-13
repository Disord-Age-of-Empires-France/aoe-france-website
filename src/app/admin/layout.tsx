import type { Metadata } from "next";
import { getSession } from "@/lib/session";
import AdminSidebar from "@/components/admin/AdminSidebar";

export const metadata: Metadata = {
  title: { default: "Admin — AoE France", template: "%s — Admin AoE France" },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) return <>{children}</>;

  return (
    <div className="flex min-h-screen bg-surface-3">
      <AdminSidebar username={session.username} role={session.role} />
      <main className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto px-6 py-8">{children}</div>
      </main>
    </div>
  );
}

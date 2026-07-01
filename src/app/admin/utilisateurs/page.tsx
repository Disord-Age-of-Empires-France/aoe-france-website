import Link from "next/link";
import { getUsers } from "@/lib/db";
import { requireBOAccess } from "@/lib/auth-check";
import { Plus, Pencil, Shield, UserIcon, Users, Wifi } from "lucide-react";
import UserFilters from "@/components/admin/UserFilters";

export const metadata = { title: "Utilisateurs" };

export default async function UsersPage() {
  const [users, session] = await Promise.all([getUsers(), requireBOAccess()]);

  const admins  = users.filter((u) => u.role === "admin").length;
  const editors = users.filter((u) => u.role === "editor").length;
  const members = users.filter((u) => u.role === "member").length;
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const activeRecently = users.filter((u) => u.lastLogin && new Date(u.lastLogin) > weekAgo).length;

  const stats = [
    { label: "Total",             value: users.length,    icon: Users,     color: "text-[#c8a32e] bg-[#c8a32e]/10" },
    { label: "Admins",            value: admins,          icon: Shield,    color: "text-amber-400 bg-amber-400/10" },
    { label: "Éditeurs",          value: editors,         icon: Pencil,    color: "text-blue-400 bg-blue-400/10" },
    { label: "Membres",           value: members,         icon: UserIcon,  color: "text-muted bg-border-site/30" },
    { label: "Actifs (7 jours)",  value: activeRecently,  icon: Wifi,      color: "text-emerald-400 bg-emerald-400/10" },
  ] as const;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-wide">Utilisateurs</h1>
          <p className="text-faint text-sm mt-1">
            {users.length} utilisateur{users.length !== 1 ? "s" : ""} au total
          </p>
        </div>
        <Link
          href="/admin/utilisateurs/nouveau"
          className="flex items-center gap-2 bg-[#c8a32e] hover:bg-[#b8922a] text-[#080e1a] font-bold text-sm tracking-wider px-5 py-2.5 rounded transition-colors"
        >
          <Plus size={15} />
          Nouvel utilisateur
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-surface border border-border-site rounded-lg px-4 py-4 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
              <Icon size={17} />
            </div>
            <div>
              <div className="text-xl font-bold text-foreground">{value}</div>
              <div className="text-[11px] text-faint font-medium tracking-wide">{label}</div>
            </div>
          </div>
        ))}
      </div>

      <UserFilters users={users} currentUserId={session?.userId ?? ""} />
    </div>
  );
}

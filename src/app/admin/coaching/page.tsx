import Link from "next/link";
import { getCoaches } from "@/lib/db";
import { requireBOAccess } from "@/lib/auth-check";
import { Plus, Users, Eye, EyeOff, Pencil } from "lucide-react";
import DeleteCoach from "@/components/admin/DeleteCoach";

export const metadata = { title: "Coaching" };

export default async function CoachingAdminPage() {
  const [coaches] = await Promise.all([getCoaches(), requireBOAccess()]);

  const total  = coaches.length;
  const active = coaches.filter(c => c.active).length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">Coaching</h1>
          <p className="text-sm text-faint mt-0.5">
            {total} coach{total !== 1 ? "s" : ""} — {active} visible{active !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/admin/coaching/nouveau"
          className="flex items-center gap-1.5 bg-[#c8a32e] hover:bg-[#b8922a] text-[#080e1a] font-bold text-xs tracking-wider px-4 py-2.5 rounded transition-colors"
        >
          <Plus size={13} /> Nouveau coach
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Total",    value: total,  icon: <Users size={16} />,  color: "text-blue-400" },
          { label: "Visibles", value: active, icon: <Eye   size={16} />,  color: "text-emerald-400" },
        ].map(({ label, value, icon, color }) => (
          <div key={label} className="bg-surface border border-border-site rounded-xl p-4 flex items-center gap-4">
            <div className={`${color} shrink-0`}>{icon}</div>
            <div>
              <div className={`text-2xl font-bold ${color}`}>{value}</div>
              <div className="text-xs text-faint">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Liste */}
      {coaches.length === 0 ? (
        <div className="bg-surface border border-border-site rounded-xl px-6 py-16 text-center">
          <Users size={32} className="text-faint mx-auto mb-3" />
          <p className="text-faint text-sm">Aucun coach configuré.</p>
          <Link href="/admin/coaching/nouveau"
            className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 rounded border border-[#c8a32e]/40 text-[#c8a32e] text-sm font-semibold hover:bg-[#c8a32e]/10 transition-colors">
            <Plus size={13} /> Créer le premier coach
          </Link>
        </div>
      ) : (
        <div className="bg-surface border border-border-site rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-site">
                <th className="text-left px-5 py-3 text-[10px] font-bold tracking-widest text-faint uppercase">Coach</th>
                <th className="text-left px-5 py-3 text-[10px] font-bold tracking-widest text-faint uppercase hidden md:table-cell">Rang / ELO</th>
                <th className="text-left px-5 py-3 text-[10px] font-bold tracking-widest text-faint uppercase hidden lg:table-cell">Prix</th>
                <th className="text-left px-5 py-3 text-[10px] font-bold tracking-widest text-faint uppercase">Statut</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border-site/50">
              {coaches.map(coach => (
                <tr key={coach.id} className="hover:bg-background transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      {coach.avatar ? (
                        <img src={coach.avatar} alt={coach.pseudoAoe} className="w-9 h-9 rounded-full object-cover border border-border-site shrink-0" />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-[#c8a32e]/20 text-[#c8a32e] flex items-center justify-center text-sm font-bold shrink-0">
                          {coach.pseudoAoe.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-foreground">{coach.pseudoAoe}</p>
                        <p className="text-xs text-faint">{coach.discordName}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell">
                    <p className="text-foreground text-sm">{coach.rank || "—"}</p>
                    {coach.elo > 0 && <p className="text-xs text-faint">{coach.elo} ELO</p>}
                  </td>
                  <td className="px-5 py-4 hidden lg:table-cell">
                    <span className="text-sm text-foreground">{coach.price || "—"}</span>
                  </td>
                  <td className="px-5 py-4">
                    {coach.active
                      ? <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400"><Eye size={12} /> Visible</span>
                      : <span className="inline-flex items-center gap-1 text-xs font-semibold text-faint"><EyeOff size={12} /> Masqué</span>
                    }
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-4 justify-end">
                      <Link href={`/admin/coaching/${coach.id}`}
                        className="flex items-center gap-1.5 text-faint hover:text-[#c8a32e] text-xs font-medium transition-colors">
                        <Pencil size={13} /> Modifier
                      </Link>
                      <DeleteCoach id={coach.id} name={coach.pseudoAoe} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

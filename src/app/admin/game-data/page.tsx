import { requireAdminAccess } from "@/lib/auth-check";
import { getGameCivilizations, getGameSyncLogs } from "@/lib/db";
import SyncGamePanel from "@/components/admin/SyncGamePanel";

export const metadata = { title: "Données du jeu — Admin" };

const GAMES = [
  { id: "aoe4", label: "Age of Empires IV",       source: "AoE4World API",     icon: "🏰" },
  { id: "aoe2", label: "Age of Empires II : DE",  source: "aoe2.net API",      icon: "⚔️" },
  { id: "aoe3", label: "Age of Empires III : DE", source: "Données statiques", icon: "🌎" },
  { id: "aom",  label: "Age of Mythology Retold", source: "Données statiques", icon: "⚡" },
] as const;

export default async function GameDataPage() {
  await requireAdminAccess();

  const [aoe4Civs, aoe2Civs, aoe3Civs, aomCivs, logs] = await Promise.all([
    getGameCivilizations("aoe4"),
    getGameCivilizations("aoe2"),
    getGameCivilizations("aoe3"),
    getGameCivilizations("aom"),
    getGameSyncLogs(),
  ]);

  const countMap: Record<string, number> = {
    aoe4: aoe4Civs.length,
    aoe2: aoe2Civs.length,
    aoe3: aoe3Civs.length,
    aom:  aomCivs.length,
  };

  const lastSyncMap: Record<string, string | null> = {};
  for (const game of ["aoe4", "aoe2", "aoe3", "aom"]) {
    const log = logs.find(l => l.game === game && l.status === "success");
    lastSyncMap[game] = log?.syncedAt ?? null;
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Données du jeu</h1>
        <p className="text-faint text-sm mt-1">
          Synchronisez civilisations et dieux majeurs depuis les sources externes.
        </p>
      </div>

      {/* Cartes par jeu */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {GAMES.map(game => (
          <SyncGamePanel
            key={game.id}
            gameId={game.id}
            label={game.label}
            source={game.source}
            icon={game.icon}
            count={countMap[game.id] ?? 0}
            lastSync={lastSyncMap[game.id] ?? null}
          />
        ))}
      </div>

      {/* Journal */}
      {logs.length > 0 && (
        <div>
          <h2 className="text-sm font-bold text-foreground mb-3">Journal des synchronisations</h2>
          <div className="bg-surface border border-border-site rounded-xl overflow-x-auto">
            <table className="w-full text-xs min-w-[500px]">
              <thead>
                <tr className="border-b border-border-site bg-surface-2">
                  <th className="px-4 py-2.5 text-left font-semibold text-faint uppercase tracking-wider">Jeu</th>
                  <th className="px-4 py-2.5 text-left font-semibold text-faint uppercase tracking-wider">Source</th>
                  <th className="px-4 py-2.5 text-left font-semibold text-faint uppercase tracking-wider">Statut</th>
                  <th className="px-4 py-2.5 text-right font-semibold text-faint uppercase tracking-wider">Entrées</th>
                  <th className="px-4 py-2.5 text-right font-semibold text-faint uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-site">
                {logs.map(log => (
                  <tr key={log.id} className="hover:bg-surface-2 transition-colors">
                    <td className="px-4 py-2.5 font-mono text-muted uppercase">{log.game}</td>
                    <td className="px-4 py-2.5 text-faint truncate max-w-[160px]">{log.source}</td>
                    <td className="px-4 py-2.5">
                      {log.status === "success" ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold">✓ Succès</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 text-[10px] font-bold" title={log.error ?? ""}>
                          ✗ Erreur
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-muted">{log.recordsUpdated}</td>
                    <td className="px-4 py-2.5 text-right text-faint whitespace-nowrap">
                      {new Date(log.syncedAt).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

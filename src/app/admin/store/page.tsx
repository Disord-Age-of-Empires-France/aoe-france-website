import Link from "next/link";
import { getStoreLinks, getSettings } from "@/lib/db";
import { requireBOAccess } from "@/lib/auth-check";
import { Plus, ExternalLink, Pencil, Eye, EyeOff, ShoppingCart } from "lucide-react";
import DeleteStoreLink from "@/components/admin/DeleteStoreLink";

export const metadata = { title: "Boutique — Liens d'achat" };

const GAMES = [
  { id: "aoe2", label: "AoE II: DE",  color: "text-purple-400" },
  { id: "aoe3", label: "AoE III: DE", color: "text-green-400"  },
  { id: "aoe4", label: "AoE IV",      color: "text-blue-400"   },
  { id: "aom",  label: "AoM: Retold", color: "text-amber-400"  },
];

const TYPE_LABEL: Record<string, string> = {
  steam: "Steam", xbox: "Xbox", ms_store: "Microsoft Store",
  ps_store: "PlayStation Store", game_pass: "Game Pass", other: "Autre",
};

export default async function StorePage() {
  const [links, settings] = await Promise.all([getStoreLinks(), getSettings(), requireBOAccess()]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">Boutique — Liens d&apos;achat</h1>
          <p className="text-sm text-faint mt-0.5">{links.length} lien{links.length !== 1 ? "s" : ""} configuré{links.length !== 1 ? "s" : ""}</p>
        </div>
        <Link href="/admin/store/nouveau"
          className="flex items-center gap-1.5 bg-[#c8a32e] hover:bg-[#b8922a] text-[#080e1a] font-bold text-xs tracking-wider px-4 py-2.5 rounded transition-colors">
          <Plus size={13} /> Nouveau lien
        </Link>
      </div>

      {/* Info Steam App IDs */}
      <div className="bg-surface border border-border-site rounded-xl p-4">
        <p className="text-[10px] font-bold tracking-widest text-faint uppercase mb-3">App IDs Steam (pour récupération auto du prix)</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          {GAMES.map(g => (
            <div key={g.id} className="bg-background border border-border-site rounded px-3 py-2">
              <p className={`font-bold ${g.color} text-[10px] tracking-wider uppercase mb-0.5`}>{g.label}</p>
              <p className="text-foreground font-mono">{settings.steamAppIds[g.id as keyof typeof settings.steamAppIds] || "—"}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-faint mt-3">Modifiables dans <Link href="/admin/parametres" className="text-[#c8a32e] hover:underline">Paramètres → Boutique</Link>.</p>
      </div>

      {/* Tables par jeu */}
      {GAMES.map(game => {
        const gameLinks = links.filter(l => l.game === game.id);
        return (
          <div key={game.id} className="bg-surface border border-border-site rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-border-site">
              <p className={`text-[10px] font-bold tracking-[0.2em] uppercase ${game.color}`}>{game.label}</p>
              <Link href={`/admin/store/nouveau?game=${game.id}`}
                className="flex items-center gap-1 text-xs text-faint hover:text-[#c8a32e] transition-colors font-medium">
                <Plus size={11} /> Ajouter
              </Link>
            </div>

            {gameLinks.length === 0 ? (
              <div className="px-5 py-6 text-center text-faint text-sm">
                Aucun lien pour ce jeu.{" "}
                <Link href={`/admin/store/nouveau?game=${game.id}`} className="text-[#c8a32e] hover:underline">Créer le premier</Link>
              </div>
            ) : (
              <table className="w-full text-sm">
                <tbody className="divide-y divide-border-site/50">
                  {gameLinks.map(link => (
                    <tr key={link.id} className="hover:bg-background transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground">{link.storeName}</span>
                          {link.badge && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#c8a32e]/10 text-[#c8a32e] border border-[#c8a32e]/20">{link.badge}</span>
                          )}
                          {link.isGamePass && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-green-900/30 text-green-400 border border-green-500/20">Game Pass</span>
                          )}
                          {link.isAffiliate && (
                            <span className="text-[10px] text-faint">*affilié</span>
                          )}
                        </div>
                        <p className="text-xs text-faint mt-0.5">{TYPE_LABEL[link.storeType] ?? link.storeType}</p>
                      </td>
                      <td className="px-5 py-3 hidden sm:table-cell">
                        <span className="text-sm text-foreground">{link.priceDisplay || "—"}</span>
                      </td>
                      <td className="px-5 py-3 hidden md:table-cell max-w-[200px]">
                        <a href={link.url} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-faint hover:text-[#c8a32e] transition-colors flex items-center gap-1 truncate">
                          <ExternalLink size={10} className="shrink-0" />
                          <span className="truncate">{link.url}</span>
                        </a>
                      </td>
                      <td className="px-5 py-3">
                        {link.active
                          ? <span className="inline-flex items-center gap-1 text-xs text-emerald-400"><Eye size={11} /> Actif</span>
                          : <span className="inline-flex items-center gap-1 text-xs text-faint"><EyeOff size={11} /> Masqué</span>
                        }
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3 justify-end">
                          <Link href={`/admin/store/${link.id}`}
                            className="flex items-center gap-1 text-faint hover:text-[#c8a32e] text-xs font-medium transition-colors">
                            <Pencil size={12} /> Modifier
                          </Link>
                          <DeleteStoreLink id={link.id} name={link.storeName} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        );
      })}

      {links.length === 0 && (
        <div className="bg-surface border border-border-site rounded-xl px-6 py-16 text-center">
          <ShoppingCart size={32} className="text-faint mx-auto mb-3" />
          <p className="text-faint text-sm">Aucun lien configuré.</p>
        </div>
      )}
    </div>
  );
}

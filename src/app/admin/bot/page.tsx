import Link from "next/link";
import { getBotCommands } from "@/lib/db";
import { requireAdminAccess } from "@/lib/auth-check";
import { Plus, Pencil, Bot } from "lucide-react";
import DeleteBotCommand from "@/components/admin/DeleteBotCommand";

export const metadata = { title: "Bot Discord" };

export default async function BotPage() {
  const [commands] = await Promise.all([getBotCommands(), requireAdminAccess()]);

  const categories = Array.from(new Set(commands.map(c => c.category)));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-wide">Bot Discord</h1>
          <p className="text-faint text-sm mt-1">
            {commands.length} commande{commands.length !== 1 ? "s" : ""} — aperçu sur la page communauté
          </p>
        </div>
        <Link
          href="/admin/bot/nouveau"
          className="flex items-center gap-2 bg-[#c8a32e] hover:bg-[#b8922a] text-[#080e1a] font-bold text-sm tracking-wider px-5 py-2.5 rounded transition-colors"
        >
          <Plus size={15} />
          Nouvelle commande
        </Link>
      </div>

      {commands.length === 0 ? (
        <div className="bg-surface border border-border-site rounded-lg px-6 py-16 text-center">
          <Bot size={32} className="text-faint mx-auto mb-3" />
          <p className="text-faint text-sm">
            Aucune commande.{" "}
            <Link href="/admin/bot/nouveau" className="text-[#c8a32e] hover:underline">
              Créer la première →
            </Link>
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {categories.map(cat => (
            <div key={cat} className="bg-surface border border-border-site rounded-lg overflow-hidden">
              <div className="px-5 py-3 border-b border-border-site bg-surface-3">
                <p className="text-[10px] font-bold tracking-[0.2em] text-[#c8a32e] uppercase">{cat}</p>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border-site/50">
                    <th className="text-left px-5 py-3 text-xs font-semibold tracking-wider text-faint uppercase">Commande</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold tracking-wider text-faint uppercase hidden md:table-cell">Description</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold tracking-wider text-faint uppercase hidden sm:table-cell">Couleur</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-site/50">
                  {commands.filter(c => c.category === cat).map(cmd => (
                    <tr key={cmd.id} className="hover:bg-surface-2 transition-colors">
                      <td className="px-5 py-4">
                        <span className="font-mono text-foreground font-semibold">{cmd.usage || `/${cmd.name}`}</span>
                      </td>
                      <td className="px-4 py-4 hidden md:table-cell">
                        <span className="text-faint text-xs line-clamp-1">{cmd.description}</span>
                      </td>
                      <td className="px-4 py-4 hidden sm:table-cell">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-4 h-4 rounded-sm border border-white/10 shrink-0"
                            style={{ backgroundColor: cmd.previewColor }}
                          />
                          <span className="text-faint text-xs font-mono">{cmd.previewColor}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-4 justify-end">
                          <Link
                            href={`/admin/bot/${cmd.id}`}
                            className="flex items-center gap-1.5 text-faint hover:text-[#c8a32e] text-sm font-medium transition-colors"
                          >
                            <Pencil size={13} />Modifier
                          </Link>
                          <DeleteBotCommand id={cmd.id} name={cmd.name} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

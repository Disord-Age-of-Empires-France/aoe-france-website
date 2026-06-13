import Link from "next/link";
import { getArticles } from "@/lib/db";
import { requireBOAccess } from "@/lib/auth-check";
import { Plus, Pencil } from "lucide-react";
import DeleteButton from "@/components/admin/DeleteButton";

export const metadata = { title: "Actualités" };

const BADGE_CLASSES: Record<string, string> = {
  blue:   "bg-blue-800/60 text-blue-300",
  green:  "bg-green-800/60 text-green-300",
  amber:  "bg-amber-800/60 text-amber-300",
  purple: "bg-purple-800/60 text-purple-300",
  red:    "bg-red-800/60 text-red-300",
};

const STATUS_STYLE: Record<string, string> = {
  published: "bg-emerald-900/50 text-emerald-400",
  draft:     "bg-gray-800/50 text-gray-400",
  archived:  "bg-orange-900/40 text-orange-400",
};

const STATUS_LABEL: Record<string, string> = {
  published: "Publié",
  draft:     "Brouillon",
  archived:  "Archivé",
};

export default async function ActualitesPage() {
  const [articles, session] = await Promise.all([getArticles(), requireBOAccess()]);
  const isAdmin = session?.role === "admin";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-wide">Actualités</h1>
          <p className="text-faint text-sm mt-1">
            {articles.length} article{articles.length !== 1 ? "s" : ""} au total
          </p>
        </div>
        <Link
          href="/admin/actualites/nouveau"
          className="flex items-center gap-2 bg-[#c8a32e] hover:bg-[#b8922a] text-[#080e1a] font-bold text-sm tracking-wider px-5 py-2.5 rounded transition-colors"
        >
          <Plus size={15} />
          Nouvel article
        </Link>
      </div>

      <div className="bg-surface border border-border-site rounded-lg overflow-hidden">
        {articles.length === 0 ? (
          <div className="px-6 py-16 text-center text-faint text-sm">
            Aucun article.{" "}
            <Link href="/admin/actualites/nouveau" className="text-[#c8a32e] hover:underline">
              Créer le premier →
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-site">
                <th className="text-left px-5 py-3.5 text-xs font-semibold tracking-wider text-faint uppercase">Titre</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold tracking-wider text-faint uppercase hidden sm:table-cell">Catégories</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold tracking-wider text-faint uppercase hidden md:table-cell">Date</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold tracking-wider text-faint uppercase">Statut</th>
                <th className="px-4 py-3.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border-site">
              {articles.map((article) => (
                <tr key={article.id} className="hover:bg-surface-2 transition-colors">
                  <td className="px-5 py-4">
                    <span className="text-foreground font-medium leading-snug line-clamp-1">
                      {article.title}
                    </span>
                  </td>
                  <td className="px-4 py-4 hidden sm:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {article.categories.length > 0
                        ? article.categories.map((cat) => (
                            <span
                              key={cat}
                              className={`text-[10px] font-bold tracking-wider px-2 py-0.5 rounded ${BADGE_CLASSES[article.badgeColor] ?? BADGE_CLASSES.blue}`}
                            >
                              {cat}
                            </span>
                          ))
                        : <span className="text-faint text-xs">—</span>
                      }
                    </div>
                  </td>
                  <td className="px-4 py-4 hidden md:table-cell">
                    <span className="text-faint text-xs">{article.date}</span>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`text-[10px] font-semibold px-2.5 py-1 rounded ${STATUS_STYLE[article.status] ?? STATUS_STYLE.draft}`}>
                      {STATUS_LABEL[article.status] ?? "Brouillon"}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-4 justify-end">
                      <Link
                        href={`/admin/actualites/${article.id}`}
                        className="flex items-center gap-1.5 text-faint hover:text-[#c8a32e] text-sm font-medium transition-colors"
                      >
                        <Pencil size={13} />Modifier
                      </Link>
                      {isAdmin && <DeleteButton id={article.id} />}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

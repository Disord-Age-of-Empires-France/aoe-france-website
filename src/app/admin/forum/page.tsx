import Link from "next/link";
import { Plus, Edit2, Trash2, MessageSquare, Clock } from "lucide-react";
import { getForumCategories } from "@/lib/db";
import { requireBOAccess } from "@/lib/auth-check";
import AdminCategoryForm from "@/components/admin/forum/AdminCategoryForm";
import AdminCategoryDelete from "@/components/admin/forum/AdminCategoryDelete";

export const metadata = { title: "Gestion du forum" };

const COLOR_OPTIONS = [
  { value: "amber",  label: "Or"      },
  { value: "blue",   label: "Bleu"    },
  { value: "green",  label: "Vert"    },
  { value: "red",    label: "Rouge"   },
  { value: "purple", label: "Violet"  },
  { value: "slate",  label: "Gris"    },
];

const COLOR_SWATCH: Record<string, string> = {
  amber:  "bg-[#c8a32e]",
  blue:   "bg-blue-500",
  green:  "bg-emerald-500",
  red:    "bg-red-500",
  purple: "bg-purple-500",
  slate:  "bg-slate-500",
};

export default async function AdminForumPage() {
  await requireBOAccess();
  const categories = await getForumCategories();

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-wide">Gestion du forum</h1>
          <p className="text-faint text-sm mt-1">Gérez les catégories et modérez les discussions.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/forum/moderation" className="flex items-center gap-2 px-4 py-2 rounded-lg border border-amber-500/30 text-amber-400 hover:bg-amber-500/10 text-sm font-medium transition-colors">
            <Clock size={14} />Modération
          </Link>
          <Link href="/admin/forum/signalements" className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border-site text-muted hover:text-foreground text-sm font-medium transition-colors">
            <MessageSquare size={14} />Signalements
          </Link>
        </div>
      </div>

      {/* Nouvelle catégorie */}
      <div className="bg-surface border border-border-site rounded-xl p-5">
        <h2 className="font-bold text-foreground text-sm mb-4 flex items-center gap-2">
          <Plus size={14} className="text-[#c8a32e]" />Nouvelle catégorie
        </h2>
        <AdminCategoryForm colorOptions={COLOR_OPTIONS} />
      </div>

      {/* Liste des catégories */}
      <div className="bg-surface border border-border-site rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border-site">
          <h2 className="font-bold text-foreground text-sm">Catégories ({categories.length})</h2>
        </div>
        {categories.length === 0 ? (
          <p className="px-5 py-10 text-center text-faint text-sm">Aucune catégorie.</p>
        ) : (
          <div className="divide-y divide-border-site">
            {categories.map((cat) => (
              <div key={cat.id} className="flex items-center gap-4 px-5 py-4">
                <div className={`w-3 h-3 rounded-full shrink-0 ${COLOR_SWATCH[cat.color] ?? "bg-muted"}`} />
                <div className="text-lg shrink-0">{cat.icon || "💬"}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground text-sm truncate">{cat.name}</p>
                  <p className="text-xs text-faint truncate">{cat.description || "—"}</p>
                  <p className="text-[10px] text-faint mt-0.5">
                    /{cat.slug} · pos. {cat.position} · {cat.topicCount} sujets · {cat.replyCount} réponses
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Link href={`/forum/${cat.slug}`} target="_blank"
                    className="text-[11px] text-faint hover:text-[#c8a32e] transition-colors">
                    Voir
                  </Link>
                  <AdminCategoryDelete id={cat.id} name={cat.name} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

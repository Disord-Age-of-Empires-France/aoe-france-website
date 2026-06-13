"use client";

import { useActionState, useState, useTransition } from "react";
import { Save, ArrowLeft, Trash2, Clock } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Article } from "@/lib/db";
import { ARTICLE_CATEGORIES } from "@/lib/categories";
import { deleteArticleAction } from "@/app/actions/articles";

const BADGE_CLASSES: Record<string, string> = {
  blue:   "bg-blue-800/60 text-blue-300 border-blue-700/40",
  green:  "bg-green-800/60 text-green-300 border-green-700/40",
  purple: "bg-purple-800/60 text-purple-300 border-purple-700/40",
  amber:  "bg-amber-800/60 text-amber-300 border-amber-700/40",
  red:    "bg-red-800/60 text-red-300 border-red-700/40",
};

function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" }) +
    " à " + d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

const STATUS_OPTIONS = [
  { value: "draft",     label: "Brouillon",  description: "Non visible publiquement" },
  { value: "published", label: "Publié",     description: "Visible sur le site" },
  { value: "archived",  label: "Archivé",    description: "Masqué mais conservé" },
] as const;

type State = { error: string } | undefined;
type Action = (prev: State, formData: FormData) => Promise<State>;

interface Props {
  action:       Action;
  article?:     Article;
  mode:         "create" | "edit";
  canDelete?:   boolean;
  canEditDate?: boolean;
}

const INPUT = "w-full bg-background border border-border-site focus:border-[#c8a32e] focus:outline-none rounded px-4 py-3 text-foreground placeholder-faint text-sm transition-colors disabled:opacity-60";

export default function ArticleForm({ action, article, mode, canDelete = false, canEditDate = true }: Props) {
  const today = new Date().toISOString().slice(0, 16);
  const toDateTimeLocal = (d?: string) => {
    if (!d) return today;
    if (d.length === 10) return d + "T00:00";
    return d.slice(0, 16);
  };
  const [state, formAction, pending] = useActionState(action, undefined);
  const [selectedCats, setSelectedCats] = useState<string[]>(
    article?.categories?.length ? article.categories : []
  );
  const [dateValue, setDateValue] = useState(toDateTimeLocal(article?.date));
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletePending, startDelete]  = useTransition();
  const router = useRouter();

  const GAME_VALUES: Set<string> = new Set(
    ARTICLE_CATEGORIES.filter(c => c.group === "game").map(c => c.value)
  );

  function toggleCat(value: string) {
    setSelectedCats(prev => {
      if (prev.includes(value)) return prev.filter(v => v !== value);
      if (GAME_VALUES.has(value)) return [...prev.filter(v => !GAME_VALUES.has(v)), value];
      return [...prev, value];
    });
  }

  function handleDelete() {
    if (!article || !confirm("Supprimer cet article définitivement ? Cette action est irréversible.")) return;
    startDelete(async () => {
      const result = await deleteArticleAction(article.id);
      if (result?.error) { setDeleteError(result.error); return; }
      router.push("/admin/actualites");
    });
  }

  return (
    <form action={formAction} className="space-y-6">
      {state?.error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded px-4 py-3 text-red-400 text-sm">
          {state.error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Title */}
        <div className="md:col-span-2 space-y-1.5">
          <label className="block text-xs font-semibold tracking-wider text-muted uppercase">
            Titre <span className="text-red-400">*</span>
          </label>
          <input
            name="title"
            type="text"
            required
            defaultValue={article?.title ?? ""}
            disabled={pending}
            className={INPUT}
            placeholder="Titre de l'article"
          />
        </div>

        {/* Categories */}
        <div className="md:col-span-2 space-y-2">
          <label className="block text-xs font-semibold tracking-wider text-muted uppercase">
            Catégories{" "}
            <span className="text-faint normal-case font-normal text-[11px]">(plusieurs possibles)</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {ARTICLE_CATEGORIES.map((cat) => {
              const checked = selectedCats.includes(cat.value);
              return (
                <label
                  key={cat.value}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded border cursor-pointer text-[11px] font-bold tracking-wider transition-all select-none ${
                    checked
                      ? BADGE_CLASSES[cat.color]
                      : "bg-transparent border-border-site text-faint hover:border-muted"
                  }`}
                >
                  <input
                    type="checkbox"
                    name="categories"
                    value={cat.value}
                    checked={checked}
                    onChange={() => toggleCat(cat.value)}
                    className="sr-only"
                  />
                  {cat.label}
                </label>
              );
            })}
          </div>
          {selectedCats.length === 0 && (
            <p className="text-[11px] text-amber-500/70">Aucune catégorie sélectionnée.</p>
          )}
        </div>

        {/* Status */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold tracking-wider text-muted uppercase">
            Statut
          </label>
          <select
            name="status"
            defaultValue={article?.status ?? "draft"}
            disabled={pending}
            className={INPUT}
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label} — {o.description}
              </option>
            ))}
          </select>
        </div>

        {/* Date */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold tracking-wider text-muted uppercase">
            Date de publication
            {!canEditDate && (
              <span className="ml-2 text-faint normal-case font-normal text-[11px]">(admin uniquement)</span>
            )}
          </label>
          {canEditDate ? (
            <input
              name="date"
              type="datetime-local"
              value={dateValue}
              onChange={(e) => setDateValue(e.target.value)}
              disabled={pending}
              className={INPUT}
            />
          ) : (
            <>
              <input type="hidden" name="date" value={dateValue} />
              <div className="w-full bg-background border border-border-site rounded px-4 py-3 text-faint text-sm opacity-50 cursor-not-allowed">
                {dateValue}
              </div>
            </>
          )}
        </div>

        {/* Thumbnail */}
        <div className="md:col-span-2 space-y-1.5">
          <label className="block text-xs font-semibold tracking-wider text-muted uppercase">
            URL de l&apos;image (optionnel)
          </label>
          <input
            name="thumbnail"
            type="url"
            defaultValue={article?.thumbnail ?? ""}
            disabled={pending}
            className={INPUT}
            placeholder="https://..."
          />
        </div>

        {/* Description */}
        <div className="md:col-span-2 space-y-1.5">
          <label className="block text-xs font-semibold tracking-wider text-muted uppercase">
            Résumé / Description
          </label>
          <textarea
            name="description"
            rows={3}
            defaultValue={article?.description ?? ""}
            disabled={pending}
            className={INPUT + " resize-y"}
            placeholder="Courte description affichée dans la liste des actualités…"
          />
        </div>

        {/* Content */}
        <div className="md:col-span-2 space-y-1.5">
          <label className="block text-xs font-semibold tracking-wider text-muted uppercase">
            Contenu (Markdown)
          </label>
          <textarea
            name="content"
            rows={12}
            defaultValue={article?.content ?? ""}
            disabled={pending}
            className={INPUT + " resize-y font-mono"}
            placeholder="## Contenu de l'article&#10;&#10;Rédigez ici en Markdown…"
          />
        </div>
      </div>

      {/* Dates — read only, edit mode only */}
      {mode === "edit" && (
        <div className="flex flex-wrap gap-6 px-1 py-3 border-t border-border-site text-xs text-faint">
          <span className="flex items-center gap-1.5">
            <Clock size={12} className="shrink-0" />
            Créé le&nbsp;<span className="text-muted">{formatDateTime(article?.createdAt)}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <Clock size={12} className="shrink-0 text-emerald-600" />
            Publié le&nbsp;
            <span className={dateValue ? "text-emerald-400" : "text-faint"}>
              {dateValue ? formatDateTime(dateValue) : "—"}
            </span>
          </span>
        </div>
      )}

      {/* Actions bar */}
      <div className="flex items-center justify-between pt-2 border-t border-border-site">
        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={pending}
            className="flex items-center gap-2 bg-[#c8a32e] hover:bg-[#b8922a] disabled:opacity-60 disabled:cursor-not-allowed text-[#080e1a] font-bold text-sm tracking-wider px-6 py-3 rounded transition-colors"
          >
            <Save size={15} />
            {pending ? "Enregistrement…" : mode === "create" ? "CRÉER L'ARTICLE" : "ENREGISTRER"}
          </button>
          <Link
            href="/admin/actualites"
            className="flex items-center gap-2 text-muted hover:text-foreground text-sm font-medium transition-colors"
          >
            <ArrowLeft size={15} />
            Annuler
          </Link>
        </div>

        {/* Delete — admin only */}
        {canDelete && mode === "edit" && (
          <div className="flex flex-col items-end gap-1">
            {deleteError && <p className="text-red-400 text-xs">{deleteError}</p>}
            <button
              type="button"
              onClick={handleDelete}
              disabled={deletePending}
              className="flex items-center gap-2 text-faint hover:text-red-400 disabled:opacity-40 text-sm font-medium transition-colors border border-transparent hover:border-red-800/40 px-3 py-2 rounded"
            >
              <Trash2 size={14} />
              {deletePending ? "Suppression…" : "Supprimer l'article"}
            </button>
          </div>
        )}
      </div>
    </form>
  );
}

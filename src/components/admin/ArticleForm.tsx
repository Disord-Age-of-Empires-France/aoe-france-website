"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import { Save, ArrowLeft, Trash2, Clock, Upload, CalendarClock, X } from "lucide-react";
import DateTimePicker from "./DateTimePicker";
import CustomSelect from "./CustomSelect";
import MarkdownEditor from "./MarkdownEditor";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Article } from "@/lib/db";
import type { ArticleStatus } from "@/lib/categories";
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
}

const INPUT = "w-full bg-background border border-border-site focus:border-[#c8a32e] focus:outline-none rounded px-4 py-3 text-foreground placeholder-faint text-sm transition-colors disabled:opacity-60";

const PUB_BADGE: Record<string, string> = {
  blue:   "bg-blue-800/70 text-blue-200",
  amber:  "bg-amber-800/70 text-amber-200",
  green:  "bg-green-800/70 text-green-200",
  red:    "bg-red-800/70 text-red-200",
  purple: "bg-purple-800/70 text-purple-200",
};

function ArticlePreview({ thumbnail, title, description, categories }: {
  thumbnail:   string;
  title:       string;
  description: string;
  categories:  string[];
}) {
  const badgeColor = categories
    .map((v) => ARTICLE_CATEGORIES.find((c) => c.value === v)?.color)
    .find(Boolean) ?? "blue";
  const badgeCls = PUB_BADGE[badgeColor] ?? PUB_BADGE.blue;
  const titleText = title       || "Titre de l'article";
  const descText  = description || "Description de l'article…";

  return (
    <div className="space-y-4 rounded border border-border-site bg-surface-2/40 p-4">
      <p className="text-[10px] font-bold tracking-widest text-faint uppercase">Aperçu de publication</p>

      {/* Carte grille */}
      <div className="space-y-1">
        <p className="text-[10px] text-faint tracking-wide">Carte grille</p>
        <div className="max-w-xs flex flex-col rounded-lg overflow-hidden border border-border-site bg-surface">
          <div className="relative h-40 bg-background overflow-hidden shrink-0">
            <img src={thumbnail} alt="" className="w-full h-full object-cover" />
          </div>
          <div className="flex flex-col flex-1 p-4 gap-2">
            <div className="flex flex-wrap gap-1">
              {categories.map((cat) => (
                <span key={cat} className={`text-[10px] font-bold tracking-wider px-2 py-0.5 rounded ${badgeCls}`}>
                  {cat}
                </span>
              ))}
            </div>
            <p className={`font-bold text-sm leading-snug line-clamp-2 ${title ? "text-foreground" : "text-faint italic"}`}>
              {titleText}
            </p>
            <p className={`text-xs leading-relaxed line-clamp-3 ${description ? "text-faint" : "text-faint/50 italic"}`}>
              {descText}
            </p>
          </div>
        </div>
      </div>

      {/* Carte à la une */}
      <div className="space-y-1">
        <p className="text-[10px] text-faint tracking-wide">À la une</p>
        <div className="rounded-lg overflow-hidden border border-border-site">
          <div className="grid grid-cols-1 sm:grid-cols-2 sm:h-56">
            <div className="relative h-44 sm:h-full bg-background overflow-hidden">
              <img src={thumbnail} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="bg-surface p-6 flex flex-col justify-center gap-3 overflow-hidden">
              <div className="flex flex-wrap gap-1.5">
                {categories.map((cat) => (
                  <span key={cat} className={`text-[10px] font-bold tracking-wider px-2.5 py-0.5 rounded ${badgeCls}`}>
                    {cat}
                  </span>
                ))}
                <span className="text-[10px] font-bold tracking-wider px-2.5 py-0.5 rounded bg-[#c8a32e]/10 text-[#c8a32e] border border-[#c8a32e]/20">
                  À LA UNE
                </span>
              </div>
              <p className={`text-lg font-bold leading-snug line-clamp-2 ${title ? "text-foreground" : "text-faint italic"}`}>
                {titleText}
              </p>
              <p className={`text-sm leading-relaxed line-clamp-3 ${description ? "text-muted" : "text-faint/50 italic"}`}>
                {descText}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ArticleForm({ action, article, mode, canDelete = false }: Props) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const [selectedCats, setSelectedCats] = useState<string[]>(
    article?.categories?.length ? article.categories : []
  );
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletePending, startDelete]  = useTransition();
  const router = useRouter();

  const [statusValue,       setStatusValue]       = useState<ArticleStatus>(article?.status ?? "draft");
  const [scheduledAtValue,  setScheduledAtValue]  = useState(article?.scheduledAt ?? "");
  const [contentValue,      setContentValue]      = useState(article?.content     ?? "");
  const [thumbnailValue,    setThumbnailValue]    = useState(article?.thumbnail   ?? "");
  const [titleValue,        setTitleValue]        = useState(article?.title       ?? "");
  const [descriptionValue,  setDescriptionValue]  = useState(article?.description ?? "");
  const [isDragging,        setIsDragging]        = useState(false);
  const [uploading,         setUploading]         = useState(false);
  const [uploadError,       setUploadError]       = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setUploadError(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res  = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json() as { url?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Erreur lors de l'envoi");
      setThumbnailValue(data.url ?? "");
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "Erreur inconnue");
    } finally {
      setUploading(false);
    }
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  const GAME_VALUES: Set<string> = new Set(
    ARTICLE_CATEGORIES.filter(c => c.group === "game").map(c => c.value)
  );
  const TAG_VALUES: Set<string> = new Set(
    ARTICLE_CATEGORIES.filter(c => c.group === "tag").map(c => c.value)
  );

  const [catError, setCatError] = useState<string | null>(null);

  function toggleCat(value: string) {
    setSelectedCats(prev => {
      if (prev.includes(value)) return prev.filter(v => v !== value);
      if (GAME_VALUES.has(value)) return [...prev.filter(v => !GAME_VALUES.has(v)), value];
      if (TAG_VALUES.has(value))  return [...prev.filter(v => !TAG_VALUES.has(v)),  value];
      return [...prev, value];
    });
    setCatError(null);
  }

  function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    const hasGame = selectedCats.some(v => GAME_VALUES.has(v));
    const hasTag  = selectedCats.some(v => TAG_VALUES.has(v));
    if (!hasGame || !hasTag) {
      e.preventDefault();
      setCatError(
        !hasGame && !hasTag ? "Veuillez sélectionner un jeu et un type."
        : !hasGame          ? "Veuillez sélectionner un jeu."
                            : "Veuillez sélectionner un type."
      );
    }
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
    <form action={formAction} onSubmit={handleSubmit} className="space-y-6">
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
            value={titleValue}
            onChange={(e) => setTitleValue(e.target.value)}
            disabled={pending}
            className={INPUT}
            placeholder="Titre de l'article"
          />
        </div>

        {/* Categories */}
        <div className="md:col-span-2 space-y-3">
          <label className="block text-xs font-semibold tracking-wider text-muted uppercase">
            Catégories <span className="text-red-400">*</span>
          </label>
          <div className="space-y-3">
            <div>
              <p className="text-[10px] font-semibold tracking-widest text-faint uppercase mb-1.5">Jeu</p>
              <div className="flex flex-wrap gap-2">
                {ARTICLE_CATEGORIES.filter(c => c.group === "game").map((cat) => {
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
            </div>
            <div>
              <p className="text-[10px] font-semibold tracking-widest text-faint uppercase mb-1.5">Type</p>
              <div className="flex flex-wrap gap-2">
                {ARTICLE_CATEGORIES.filter(c => c.group === "tag").map((cat) => {
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
            </div>
          </div>
          {catError && (
            <p className="text-[11px] text-red-400">{catError}</p>
          )}
        </div>

        {/* Status */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold tracking-wider text-muted uppercase">
            Statut
          </label>
          <CustomSelect
            name="status"
            value={statusValue}
            onChange={(v) => {
              setStatusValue(v as ArticleStatus);
              if (v !== "draft") setScheduledAtValue("");
            }}
            options={STATUS_OPTIONS
              .filter((o) =>
                article?.status === "published" || article?.status === "archived"
                  ? o.value !== "draft"
                  : true
              )
              .map((o) => ({ value: o.value, label: o.label, description: o.description }))}
            disabled={pending}
          />
        </div>

        {/* Scheduled publication */}
        {statusValue === "draft" ? (
          <div className="md:col-span-2 space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold tracking-wider text-muted uppercase">
                Programmer la publication
              </label>
              {scheduledAtValue && (
                <button
                  type="button"
                  onClick={() => setScheduledAtValue("")}
                  className="flex items-center gap-1 text-faint hover:text-red-400 text-[11px] font-medium transition-colors"
                >
                  <X size={11} />Annuler la programmation
                </button>
              )}
            </div>
            <input type="hidden" name="scheduledAt" value={scheduledAtValue} />
            <DateTimePicker
              value={scheduledAtValue}
              onChange={setScheduledAtValue}
              minDate={new Date()}
              disabled={pending}
            />
            {scheduledAtValue ? (
              <p className="text-[11px] text-blue-400 flex items-center gap-1.5">
                <CalendarClock size={11} />
                Sera publié automatiquement le{" "}
                {new Date(scheduledAtValue).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}{" "}
                à{" "}
                {new Date(scheduledAtValue).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
              </p>
            ) : (
              <p className="text-[11px] text-faint flex items-center gap-1.5">
                <Clock size={11} />
                Sans programmation, la date de publication sera l&apos;heure exacte de validation de l&apos;article.
              </p>
            )}
          </div>
        ) : (
          <input type="hidden" name="scheduledAt" value="" />
        )}

        {/* Thumbnail */}
        <div className="md:col-span-2 space-y-2">
          <label className="block text-xs font-semibold tracking-wider text-muted uppercase">
            Image <span className="text-red-400">*</span>
          </label>

          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => !uploading && fileInputRef.current?.click()}
            className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded py-7 transition-colors ${
              uploading
                ? "opacity-60 cursor-not-allowed border-border-site"
                : isDragging
                  ? "border-[#c8a32e] bg-[#c8a32e]/5 cursor-copy"
                  : "border-border-site hover:border-[#c8a32e]/60 cursor-pointer"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
              className="sr-only"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
            />
            {uploading ? (
              <span className="text-sm text-muted">Envoi en cours…</span>
            ) : (
              <>
                <Upload size={18} className="text-faint" />
                <span className="text-sm text-muted font-medium">Glissez une image ici</span>
                <span className="text-[11px] text-faint">ou cliquez pour parcourir · JPG, PNG, WebP, GIF, AVIF · max 5 Mo</span>
              </>
            )}
          </div>

          {uploadError && <p className="text-[11px] text-red-400">{uploadError}</p>}

          {/* URL (contrôlée — mise à jour après upload ou saisie directe) */}
          <input
            name="thumbnail"
            type="text"
            required
            value={thumbnailValue}
            onChange={(e) => setThumbnailValue(e.target.value)}
            disabled={pending || uploading}
            className={INPUT}
            placeholder="URL de l'image (remplie automatiquement après upload, ou collez une URL externe)"
          />

          {/* Aperçu de publication */}
          {thumbnailValue && (
            <ArticlePreview
              thumbnail={thumbnailValue}
              title={titleValue}
              description={descriptionValue}
              categories={selectedCats}
            />
          )}
        </div>

        {/* Description */}
        <div className="md:col-span-2 space-y-1.5">
          <label className="block text-xs font-semibold tracking-wider text-muted uppercase">
            Résumé / Description <span className="text-red-400">*</span>
          </label>
          <textarea
            name="description"
            required
            rows={3}
            value={descriptionValue}
            onChange={(e) => setDescriptionValue(e.target.value)}
            disabled={pending}
            className={INPUT + " resize-y"}
            placeholder="Courte description affichée dans la liste des actualités…"
          />
        </div>

        {/* Content */}
        <div className="md:col-span-2 space-y-1.5">
          <label className="block text-xs font-semibold tracking-wider text-muted uppercase">
            Contenu <span className="text-red-400">*</span>
          </label>
          <MarkdownEditor
            name="content"
            value={contentValue}
            onChange={setContentValue}
            disabled={pending}
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
            <span className={article?.publishedAt ? "text-emerald-400" : "text-faint"}>
              {article?.publishedAt ? formatDateTime(article.publishedAt) : "—"}
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

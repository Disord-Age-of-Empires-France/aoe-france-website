"use client";

import { useActionState, useState, useRef } from "react";
import { Save, Plus, Trash2, GripVertical } from "lucide-react";
import type { BotCommand, BotCommandField } from "@/lib/db";

type State = { error: string } | undefined;
type Action = (prev: State, formData: FormData) => Promise<State>;

interface Props {
  action:   Action;
  command?: BotCommand;
  mode:     "create" | "edit";
}

const SUGGESTED_CATEGORIES = ["Stats", "Infos", "Modération", "Fun", "Général"];
const PRESET_COLORS = [
  { label: "Discord",  value: "#5865f2" },
  { label: "Or AoE",   value: "#c8a32e" },
  { label: "Émeraude", value: "#57f287" },
  { label: "Rouge",    value: "#ed4245" },
  { label: "Gris",     value: "#4f545c" },
];

const INPUT = "w-full bg-background border border-border-site rounded px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-[#c8a32e]/50";

function EmptyField(): BotCommandField {
  return { name: "", value: "", inline: false };
}

export default function BotCommandForm({ action, command, mode }: Props) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const [fields, setFields] = useState<BotCommandField[]>(
    command?.previewFields.length ? command.previewFields : [EmptyField()]
  );
  const [color, setColor]       = useState(command?.previewColor ?? "#5865f2");
  const [hasImage, setHasImage] = useState(command?.hasImage ?? false);
  const [imageUrl, setImageUrl] = useState(command?.imageUrl ?? "");
  const fieldsInputRef = useRef<HTMLInputElement>(null);

  function addField() {
    setFields(f => [...f, EmptyField()]);
  }

  function removeField(i: number) {
    setFields(f => f.filter((_, idx) => idx !== i));
  }

  function updateField(i: number, key: keyof BotCommandField, val: string | boolean) {
    setFields(f => f.map((field, idx) => idx === i ? { ...field, [key]: val } : field));
  }

  function handleSubmit() {
    if (fieldsInputRef.current) {
      fieldsInputRef.current.value = JSON.stringify(fields.filter(f => f.name || f.value));
    }
  }

  return (
    <form action={formAction} onSubmit={handleSubmit} className="space-y-7">
      {state && "error" in state && (
        <div className="bg-red-900/30 border border-red-700/50 text-red-300 text-sm px-4 py-3 rounded">
          {state.error}
        </div>
      )}

      {/* Hidden JSON field for previewFields */}
      <input ref={fieldsInputRef} type="hidden" name="previewFields" />

      {/* ── Informations de base ─────────────────────────────────────── */}
      <section>
        <p className="text-[10px] font-bold tracking-[0.2em] text-[#c8a32e] uppercase mb-4">Commande</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-muted mb-1.5">
              Nom <span className="text-red-400">*</span>
            </label>
            <input
              name="name"
              defaultValue={command?.name ?? ""}
              placeholder="stats"
              required
              className={INPUT + " font-mono"}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted mb-1.5">Usage</label>
            <input
              name="usage"
              defaultValue={command?.usage ?? ""}
              placeholder="/stats  Age of Empires IV  Dirtus&SabrinaClaudio"
              className={INPUT + " font-mono"}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted mb-1.5">Catégorie</label>
            <input
              name="category"
              defaultValue={command?.category ?? ""}
              list="category-suggestions"
              placeholder="Stats"
              className={INPUT}
            />
            <datalist id="category-suggestions">
              {SUGGESTED_CATEGORIES.map(c => <option key={c} value={c} />)}
            </datalist>
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-xs font-semibold text-muted mb-1.5">Description</label>
          <input
            name="description"
            defaultValue={command?.description ?? ""}
            placeholder="Affiche les statistiques d'un joueur AoE IV..."
            className={INPUT}
          />
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-xs font-semibold text-muted mb-1.5">Ordre d&apos;affichage</label>
            <input
              name="orderIndex"
              type="number"
              defaultValue={command?.orderIndex ?? 0}
              min={0}
              className={INPUT}
            />
          </div>
        </div>
      </section>

      {/* ── Aperçu Discord ───────────────────────────────────────────── */}
      <section>
        <p className="text-[10px] font-bold tracking-[0.2em] text-[#c8a32e] uppercase mb-4">Aperçu de la réponse (embed Discord)</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs font-semibold text-muted mb-1.5">Titre de l&apos;embed</label>
            <input
              name="previewTitle"
              defaultValue={command?.previewTitle ?? ""}
              placeholder="Age of Empires IV · Stats joueur"
              className={INPUT}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted mb-1.5">Couleur de l&apos;embed</label>
            <div className="flex items-center gap-3">
              <input type="hidden" name="previewColor" value={color} />
              <input
                type="color"
                value={color}
                onChange={e => setColor(e.target.value)}
                className="h-10 w-12 rounded border border-border-site bg-transparent cursor-pointer"
              />
              <div className="flex gap-2 flex-wrap">
                {PRESET_COLORS.map(p => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setColor(p.value)}
                    title={p.label}
                    className={`w-6 h-6 rounded-full border-2 transition-all ${color === p.value ? "border-white scale-110" : "border-transparent"}`}
                    style={{ backgroundColor: p.value }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-xs font-semibold text-muted mb-1.5">Description de l&apos;embed</label>
          <textarea
            name="previewDescription"
            defaultValue={command?.previewDescription ?? ""}
            rows={3}
            placeholder="⚔️ **Pseudo**&#10;Mode : Ranked 1v1 🏆 Saison 13"
            className={INPUT + " resize-none font-mono"}
          />
        </div>

        {/* Fields builder */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-muted">Champs de l&apos;embed</label>
            <button
              type="button"
              onClick={addField}
              className="flex items-center gap-1.5 text-xs text-[#c8a32e] hover:text-[#b8922a] font-medium transition-colors"
            >
              <Plus size={13} />
              Ajouter un champ
            </button>
          </div>

          <div className="space-y-2">
            {fields.map((field, i) => (
              <div key={i} className="flex items-start gap-2 bg-background border border-border-site rounded p-3">
                <GripVertical size={14} className="text-faint mt-2.5 shrink-0" />
                <div className="flex-1 grid grid-cols-2 gap-2">
                  <input
                    value={field.name}
                    onChange={e => updateField(i, "name", e.target.value)}
                    placeholder="Nom du champ"
                    className="bg-surface border border-border-site rounded px-3 py-2 text-sm text-foreground focus:outline-none focus:border-[#c8a32e]/50"
                  />
                  <input
                    value={field.value}
                    onChange={e => updateField(i, "value", e.target.value)}
                    placeholder="Valeur"
                    className="bg-surface border border-border-site rounded px-3 py-2 text-sm text-foreground focus:outline-none focus:border-[#c8a32e]/50"
                  />
                </div>
                <label className="flex items-center gap-1.5 text-xs text-faint mt-2 shrink-0">
                  <input
                    type="checkbox"
                    checked={field.inline}
                    onChange={e => updateField(i, "inline", e.target.checked)}
                    className="accent-[#c8a32e]"
                  />
                  Inline
                </label>
                <button
                  type="button"
                  onClick={() => removeField(i)}
                  className="text-faint hover:text-red-400 mt-2 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            {fields.length === 0 && (
              <p className="text-faint text-xs py-4 text-center border border-dashed border-border-site rounded">
                Aucun champ — <button type="button" onClick={addField} className="text-[#c8a32e]">en ajouter un</button>
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-muted mb-1.5">Footer de l&apos;embed</label>
            <input
              name="previewFooter"
              defaultValue={command?.previewFooter ?? ""}
              placeholder="Données via aoe4world.com · v1.0"
              className={INPUT}
            />
          </div>
          <div>
            <label className="flex items-center gap-3 mb-2 cursor-pointer">
              <input type="hidden" name="hasImage" value={hasImage ? "1" : "0"} />
              <button
                type="button"
                onClick={() => setHasImage(h => !h)}
                className={`w-10 h-5 rounded-full transition-colors relative shrink-0 ${hasImage ? "bg-[#5865f2]" : "bg-border-site"}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${hasImage ? "translate-x-5" : "translate-x-0.5"}`} />
              </button>
              <span className="text-xs text-muted font-semibold">Afficher une image dans l&apos;embed</span>
            </label>
            {hasImage && (
              <div>
                <input
                  name="imageUrl"
                  value={imageUrl}
                  onChange={e => setImageUrl(e.target.value)}
                  placeholder="https://cdn.ageofempires.com/aoe4/patch-…"
                  className={INPUT + " font-mono"}
                />
                <p className="text-faint text-[11px] mt-1">URL publique de l&apos;image (Discord CDN, ageofempires.com…). Laissez vide pour afficher un placeholder.</p>
              </div>
            )}
            {!hasImage && <input type="hidden" name="imageUrl" value="" />}
          </div>
        </div>
      </section>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={pending}
          className="flex items-center gap-2 bg-[#c8a32e] hover:bg-[#b8922a] disabled:opacity-50 text-[#080e1a] font-bold text-sm tracking-wider px-6 py-3 rounded transition-colors"
        >
          <Save size={15} />
          {pending ? "Enregistrement…" : mode === "create" ? "Créer la commande" : "Enregistrer"}
        </button>
      </div>
    </form>
  );
}

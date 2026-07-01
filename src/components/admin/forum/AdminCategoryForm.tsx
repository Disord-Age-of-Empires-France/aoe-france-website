"use client";

import { useActionState } from "react";
import { createCategoryAction } from "@/app/actions/forum";

interface ColorOption { value: string; label: string }

export default function AdminCategoryForm({ colorOptions }: { colorOptions: ColorOption[] }) {
  const [state, action, pending] = useActionState(createCategoryAction, {});

  return (
    <form action={action} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {state.error && (
        <div className="sm:col-span-2 px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {state.error}
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold text-muted mb-1">Nom *</label>
        <input name="name" required maxLength={80} placeholder="Ex: Stratégie & Tactiques"
          className="w-full px-3 py-2 rounded-lg border border-border-site bg-background text-sm text-foreground placeholder-faint focus:outline-none focus:border-[#c8a32e]/50" />
      </div>

      <div>
        <label className="block text-xs font-semibold text-muted mb-1">Slug *</label>
        <input name="slug" required maxLength={60} placeholder="strategie-tactiques"
          className="w-full px-3 py-2 rounded-lg border border-border-site bg-background text-sm text-foreground placeholder-faint focus:outline-none focus:border-[#c8a32e]/50" />
      </div>

      <div className="sm:col-span-2">
        <label className="block text-xs font-semibold text-muted mb-1">Description</label>
        <input name="description" maxLength={300} placeholder="Courte description de la catégorie"
          className="w-full px-3 py-2 rounded-lg border border-border-site bg-background text-sm text-foreground placeholder-faint focus:outline-none focus:border-[#c8a32e]/50" />
      </div>

      <div>
        <label className="block text-xs font-semibold text-muted mb-1">Icône (emoji)</label>
        <input name="icon" maxLength={10} placeholder="💬"
          className="w-full px-3 py-2 rounded-lg border border-border-site bg-background text-sm text-foreground placeholder-faint focus:outline-none focus:border-[#c8a32e]/50" />
      </div>

      <div>
        <label className="block text-xs font-semibold text-muted mb-1">Couleur</label>
        <select name="color" defaultValue="amber"
          className="w-full px-3 py-2 rounded-lg border border-border-site bg-background text-sm text-foreground focus:outline-none focus:border-[#c8a32e]/50">
          {colorOptions.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-semibold text-muted mb-1">Position (ordre)</label>
        <input name="position" type="number" defaultValue="0" min="0"
          className="w-full px-3 py-2 rounded-lg border border-border-site bg-background text-sm text-foreground focus:outline-none focus:border-[#c8a32e]/50" />
      </div>

      <div className="sm:col-span-2 flex justify-end">
        <button type="submit" disabled={pending}
          className="px-5 py-2 rounded-lg bg-[#c8a32e] hover:bg-[#b8922a] text-[#080e1a] font-bold text-sm disabled:opacity-60 transition-colors">
          {pending ? "Création…" : "Créer la catégorie"}
        </button>
      </div>
    </form>
  );
}

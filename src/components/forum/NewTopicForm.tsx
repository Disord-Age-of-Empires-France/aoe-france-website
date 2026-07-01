"use client";

import { useActionState } from "react";
import { createTopicAction } from "@/app/actions/forum";
import ForumEditor from "./ForumEditor";

interface Props { slug: string }

export default function NewTopicForm({ slug }: Props) {
  const [state, action, pending] = useActionState(createTopicAction, {});

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="categorySlug" value={slug} />

      {state.error && (
        <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {state.error}
        </div>
      )}

      <div>
        <label className="block text-sm font-semibold text-muted mb-1.5">
          Titre <span className="text-red-400">*</span>
        </label>
        <input
          name="title"
          maxLength={200}
          required
          placeholder="Titre de votre sujet…"
          className="w-full px-4 py-2.5 rounded-lg border border-border-site bg-surface text-foreground placeholder-faint text-sm focus:outline-none focus:border-[#c8a32e]/50"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-muted mb-1.5">
          Contenu <span className="text-red-400">*</span>
        </label>
        <ForumEditor name="content" minLength={10} rows={12} />
      </div>

      <div className="flex gap-3 justify-end">
        <button
          type="button"
          onClick={() => history.back()}
          className="px-5 py-2.5 rounded-lg border border-border-site text-muted hover:text-foreground text-sm font-medium transition-colors"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={pending}
          className="px-6 py-2.5 rounded-lg bg-[#c8a32e] hover:bg-[#b8922a] text-[#080e1a] font-bold text-sm disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {pending ? "Publication…" : "Publier le sujet"}
        </button>
      </div>
    </form>
  );
}

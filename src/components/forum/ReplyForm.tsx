"use client";

import { useActionState, useEffect, useRef } from "react";
import { createReplyAction } from "@/app/actions/forum";
import ForumEditor from "./ForumEditor";

interface Props { topicId: string; locked: boolean }

export default function ReplyForm({ topicId, locked }: Props) {
  const [state, action, pending] = useActionState(createReplyAction, {});
  const key = useRef(0);

  useEffect(() => {
    if (!state.error && Object.keys(state).length === 0) {
      key.current++;
    }
  }, [state]);

  if (locked) {
    return (
      <div className="mt-8 px-4 py-4 rounded-xl border border-border-site bg-surface text-center text-sm text-faint">
        🔒 Ce sujet est verrouillé — les nouvelles réponses sont désactivées.
      </div>
    );
  }

  return (
    <div className="mt-8">
      <h2 className="text-base font-bold text-foreground mb-4">Répondre</h2>
      <form action={action} className="space-y-3">
        <input type="hidden" name="topicId" value={topicId} />

        {state.error && (
          <div className="px-4 py-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            {state.error}
          </div>
        )}

        <ForumEditor key={key.current} name="content" minLength={2} rows={6} />

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={pending}
            className="px-6 py-2.5 rounded-lg bg-[#c8a32e] hover:bg-[#b8922a] text-[#080e1a] font-bold text-sm disabled:opacity-60 transition-colors"
          >
            {pending ? "Envoi…" : "Répondre"}
          </button>
        </div>
      </form>
    </div>
  );
}

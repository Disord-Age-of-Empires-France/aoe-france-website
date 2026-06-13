"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteArticleAction } from "@/app/actions/articles";

export default function DeleteButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm("Supprimer cet article définitivement ?")) return;
    startTransition(() => { void deleteArticleAction(id); });
  }

  return (
    <button
      onClick={handleDelete}
      disabled={pending}
      className="flex items-center gap-1.5 text-gray-500 hover:text-red-400 disabled:opacity-40 text-sm font-medium transition-colors"
    >
      <Trash2 size={13} />
      {pending ? "…" : "Supprimer"}
    </button>
  );
}

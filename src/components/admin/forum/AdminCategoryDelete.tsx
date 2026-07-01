"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteCategoryAction } from "@/app/actions/forum";

export default function AdminCategoryDelete({ id, name }: { id: string; name: string }) {
  const [, start] = useTransition();

  function handle() {
    if (!confirm(`Supprimer la catégorie "${name}" ? Tous les sujets et réponses seront perdus.`)) return;
    start(async () => { await deleteCategoryAction(id); });
  }

  return (
    <button type="button" onClick={handle} title="Supprimer"
      className="p-1.5 rounded text-faint hover:text-red-400 hover:bg-red-500/10 transition-colors">
      <Trash2 size={14} />
    </button>
  );
}

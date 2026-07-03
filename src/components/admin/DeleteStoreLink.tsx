"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteStoreLinkAction } from "@/app/actions/store";

interface Props { id: string; name: string; }

export default function DeleteStoreLink({ id, name }: Props) {
  const [pending, startTransition] = useTransition();

  function handleClick() {
    if (!confirm(`Supprimer le lien « ${name} » ?`)) return;
    startTransition(async () => { await deleteStoreLinkAction(id); });
  }

  return (
    <button type="button" onClick={handleClick} disabled={pending}
      className="flex items-center gap-1.5 text-red-400 hover:text-red-300 text-xs font-medium transition-colors disabled:opacity-50">
      <Trash2 size={13} />
      {pending ? "Suppression…" : "Supprimer"}
    </button>
  );
}

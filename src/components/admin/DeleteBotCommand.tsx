"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteBotCommandAction } from "@/app/actions/bot";

interface Props {
  id:   string;
  name: string;
}

export default function DeleteBotCommand({ id, name }: Props) {
  const [pending, startTransition] = useTransition();

  function handleClick() {
    if (!confirm(`Supprimer la commande /${name} ?`)) return;
    startTransition(() => deleteBotCommandAction(id));
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      className="flex items-center gap-1.5 text-gray-600 hover:text-red-400 text-sm font-medium transition-colors disabled:opacity-40"
    >
      <Trash2 size={13} />
      {pending ? "…" : "Supprimer"}
    </button>
  );
}

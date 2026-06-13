"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteUserAction } from "@/app/actions/users";

interface Props {
  id:       string;
  username: string;
}

export default function UserDeleteButton({ id, username }: Props) {
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm(`Supprimer l'utilisateur « ${username} » définitivement ?`)) return;
    startTransition(async () => {
      const result = await deleteUserAction(id);
      if (result?.error) alert(result.error);
    });
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

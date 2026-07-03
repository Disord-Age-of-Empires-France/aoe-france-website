import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getBotCommand } from "@/lib/db";
import { requireAdminAccess } from "@/lib/auth-check";
import { updateBotCommandAction } from "@/app/actions/bot";
import BotCommandForm from "@/components/admin/BotCommandForm";
import DeleteBotCommand from "@/components/admin/DeleteBotCommand";

export const metadata = { title: "Modifier la commande" };

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditCommandePage({ params }: Props) {
  const { id } = await params;
  const [cmd] = await Promise.all([getBotCommand(id), requireAdminAccess()]);
  if (!cmd) notFound();

  const updateAction = updateBotCommandAction.bind(null, id);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/parametres?tab=bot"
          className="inline-flex items-center gap-1.5 text-faint hover:text-foreground text-sm mb-4 transition-colors"
        >
          <ArrowLeft size={14} />
          Retour au bot Discord
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-wide">
              Modifier <span className="font-mono text-[#c8a32e]">/{cmd.name}</span>
            </h1>
            <p className="text-faint text-sm mt-1">{cmd.category}</p>
          </div>
          <DeleteBotCommand id={cmd.id} name={cmd.name} />
        </div>
      </div>

      <div className="bg-surface border border-border-site rounded-lg p-6">
        <BotCommandForm action={updateAction} command={cmd} mode="edit" />
      </div>
    </div>
  );
}

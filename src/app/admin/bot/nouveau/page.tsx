import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAdminAccess } from "@/lib/auth-check";
import { createBotCommandAction } from "@/app/actions/bot";
import BotCommandForm from "@/components/admin/BotCommandForm";

export const metadata = { title: "Nouvelle commande" };

export default async function NouvelleCommandePage() {
  await requireAdminAccess();

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
        <h1 className="text-2xl font-bold text-foreground tracking-wide">Nouvelle commande</h1>
      </div>

      <div className="bg-surface border border-border-site rounded-lg p-6">
        <BotCommandForm action={createBotCommandAction} mode="create" />
      </div>
    </div>
  );
}

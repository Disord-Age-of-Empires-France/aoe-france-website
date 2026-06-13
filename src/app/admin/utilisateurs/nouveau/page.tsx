import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { createUserAction } from "@/app/actions/users";
import { requireAdminAccess } from "@/lib/auth-check";
import UserForm from "@/components/admin/UserForm";

export const metadata = { title: "Nouvel utilisateur" };

export default async function NewUserPage() {
  await requireAdminAccess();
  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/utilisateurs"
          className="inline-flex items-center gap-1.5 text-faint hover:text-foreground text-sm mb-4 transition-colors"
        >
          <ArrowLeft size={14} />
          Retour aux utilisateurs
        </Link>
        <h1 className="text-2xl font-bold text-foreground tracking-wide">Nouvel utilisateur</h1>
      </div>

      <div className="bg-surface border border-border-site rounded-lg p-6">
        <UserForm action={createUserAction} mode="create" />
      </div>
    </div>
  );
}

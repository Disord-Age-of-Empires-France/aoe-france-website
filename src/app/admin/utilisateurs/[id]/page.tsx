import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getUser } from "@/lib/db";
import { requireBOAccess } from "@/lib/auth-check";
import { updateUserAction } from "@/app/actions/users";
import UserForm from "@/components/admin/UserForm";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const user = await getUser(id);
  return { title: user ? `Modifier : ${user.username}` : "Utilisateur introuvable" };
}

export default async function EditUserPage({ params }: Props) {
  const { id } = await params;
  const [user, session] = await Promise.all([getUser(id), requireBOAccess()]);
  if (!user) notFound();

  const boundAction = updateUserAction.bind(null, id);
  const isSelf = session?.userId === id;

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
        <h1 className="text-2xl font-bold text-foreground tracking-wide">Modifier l&apos;utilisateur</h1>
        <p className="text-faint text-sm mt-1">@{user.username}</p>
      </div>

      <div className="bg-surface border border-border-site rounded-lg p-6">
        <UserForm action={boundAction} user={user} mode="edit" isSelf={isSelf} />
      </div>
    </div>
  );
}

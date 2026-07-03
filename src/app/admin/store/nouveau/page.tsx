import { requireBOAccess } from "@/lib/auth-check";
import { createStoreLinkAction } from "@/app/actions/store";
import StoreLinkForm from "@/components/admin/StoreLinkForm";

export const metadata = { title: "Nouveau lien d'achat" };

interface Props { searchParams: Promise<{ game?: string }> }

export default async function NouveauStoreLinkPage({ searchParams }: Props) {
  const [{ game }] = await Promise.all([searchParams, requireBOAccess()]);
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-foreground">Nouveau lien d&apos;achat</h1>
        <p className="text-sm text-faint mt-0.5">Ajouter un store ou un lien affilié pour un jeu.</p>
      </div>
      <StoreLinkForm action={createStoreLinkAction} mode="create" defaultGame={game} />
    </div>
  );
}

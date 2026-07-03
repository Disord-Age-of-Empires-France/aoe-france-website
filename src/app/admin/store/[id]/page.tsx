import { notFound } from "next/navigation";
import { getStoreLink } from "@/lib/db";
import { requireBOAccess } from "@/lib/auth-check";
import { updateStoreLinkAction } from "@/app/actions/store";
import StoreLinkForm from "@/components/admin/StoreLinkForm";
import DeleteStoreLink from "@/components/admin/DeleteStoreLink";

interface Props { params: Promise<{ id: string }> }

export const metadata = { title: "Modifier le lien" };

export default async function EditStoreLinkPage({ params }: Props) {
  const { id } = await params;
  const [link] = await Promise.all([getStoreLink(id), requireBOAccess()]);
  if (!link) notFound();

  const updateAction = updateStoreLinkAction.bind(null, id);

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">Modifier le lien</h1>
          <p className="text-sm text-faint mt-0.5">{link.storeName}</p>
        </div>
        <DeleteStoreLink id={link.id} name={link.storeName} />
      </div>
      <StoreLinkForm action={updateAction} link={link} mode="edit" />
    </div>
  );
}

import { notFound } from "next/navigation";
import { getCoach } from "@/lib/db";
import { requireBOAccess } from "@/lib/auth-check";
import { updateCoachAction } from "@/app/actions/coaches";
import CoachForm from "@/components/admin/CoachForm";
import DeleteCoach from "@/components/admin/DeleteCoach";

interface Props { params: Promise<{ id: string }> }

export const metadata = { title: "Modifier le coach" };

export default async function EditCoachPage({ params }: Props) {
  const { id } = await params;
  const [coach] = await Promise.all([getCoach(id), requireBOAccess()]);
  if (!coach) notFound();

  const updateAction = updateCoachAction.bind(null, id);

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">Modifier le coach</h1>
          <p className="text-sm text-faint mt-0.5">{coach.pseudoAoe}</p>
        </div>
        <DeleteCoach id={coach.id} name={coach.pseudoAoe} />
      </div>
      <CoachForm action={updateAction} coach={coach} mode="edit" />
    </div>
  );
}

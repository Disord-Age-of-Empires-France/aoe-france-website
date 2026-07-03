import { requireBOAccess } from "@/lib/auth-check";
import { createCoachAction } from "@/app/actions/coaches";
import CoachForm from "@/components/admin/CoachForm";

export const metadata = { title: "Nouveau coach" };

export default async function NouveauCoachPage() {
  await requireBOAccess();
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-foreground">Nouveau coach</h1>
        <p className="text-sm text-faint mt-0.5">Créer une fiche coach visible sur la page coaching.</p>
      </div>
      <CoachForm action={createCoachAction} mode="create" />
    </div>
  );
}

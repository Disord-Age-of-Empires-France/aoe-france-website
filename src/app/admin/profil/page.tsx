import { redirect } from "next/navigation";
import { getUser } from "@/lib/db";
import { requireBOAccess } from "@/lib/auth-check";
import ProfileForm from "@/components/admin/ProfileForm";

export const metadata = { title: "Mon profil" };

export default async function ProfilPage() {
  const session = await requireBOAccess();
  const user = await getUser(session.userId);
  if (!user) redirect("/admin/login");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-wide">Mon profil</h1>
        <p className="text-faint text-sm mt-1">
          Gérez vos informations personnelles et votre mot de passe.
        </p>
      </div>

      <ProfileForm user={user} />
    </div>
  );
}

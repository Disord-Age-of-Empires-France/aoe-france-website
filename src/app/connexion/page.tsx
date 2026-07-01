import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

export const metadata = { title: "Connexion — Age of Empires France" };

export default async function ConnexionPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; returnTo?: string }>;
}) {
  const session = await getSession();
  if (session) redirect("/");

  const { error, returnTo } = await searchParams;

  // If a specific returnTo is requested, go directly to Discord auth
  if (returnTo && !error) {
    redirect(`/api/auth/discord?returnTo=${encodeURIComponent(returnTo)}`);
  }

  // Error or plain /connexion visit → back to home with modal open
  const dest = error ? `/?loginError=${error}` : "/?loginModal=1";
  redirect(dest);
}

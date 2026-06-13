import Image from "next/image";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import LoginForm from "@/components/admin/LoginForm";

export const metadata = { title: "Connexion — Admin AoE France" };

export default async function LoginPage() {
  const session = await getSession();
  if (session && session.role !== "member") redirect("/admin");

  return (
    <div className="min-h-screen bg-surface-3 flex items-center justify-center px-4">
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, #c8a32e 0, #c8a32e 1px, transparent 0, transparent 50%), repeating-linear-gradient(90deg, #c8a32e 0, #c8a32e 1px, transparent 0, transparent 50%)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative w-full max-w-sm">
        <div className="bg-surface border border-border-site rounded-lg p-8 shadow-2xl">
          <div className="flex flex-col items-center mb-8">
            <Image
              src="/logo.png"
              alt="Age of Empires France"
              width={96}
              height={96}
              className="site-logo"
              priority
            />
            <div className="text-[10px] tracking-[0.2em] text-faint uppercase font-semibold mt-1">
              Administration
            </div>
          </div>

          <h1 className="text-lg font-bold text-foreground mb-1">Connexion</h1>
          <p className="text-faint text-sm mb-7">
            Accès réservé aux administrateurs.
          </p>

          <LoginForm />
        </div>

        <p className="text-center text-faint text-xs mt-5">
          <a href="/" className="hover:text-muted transition-colors">
            ← Retour au site
          </a>
        </p>
      </div>
    </div>
  );
}

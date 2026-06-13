import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import DiscordIcon from "@/components/DiscordIcon";

export const metadata = { title: "Connexion — Age of Empires France" };

const ERROR_MESSAGES: Record<string, string> = {
  invalid_state: "Requête invalide, veuillez réessayer.",
  token_failed:  "Connexion Discord échouée, veuillez réessayer.",
  user_failed:   "Impossible de récupérer vos informations Discord.",
};

export default async function ConnexionPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await getSession();
  if (session) redirect("/");

  const { error } = await searchParams;

  return (
    <div className="min-h-screen bg-[#06090f] flex items-center justify-center px-4">
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, #c8a32e 0, #c8a32e 1px, transparent 0, transparent 50%), repeating-linear-gradient(90deg, #c8a32e 0, #c8a32e 1px, transparent 0, transparent 50%)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative w-full max-w-sm">
        <div className="bg-[#0d1527] border border-[#1c2d47] rounded-lg p-8 shadow-2xl">
          <div className="flex flex-col items-center mb-8">
            <Image
              src="/logo.png"
              alt="Age of Empires France"
              width={80}
              height={80}
              style={{ mixBlendMode: "lighten" }}
              priority
            />
            <div className="text-[10px] tracking-[0.2em] text-gray-500 uppercase font-semibold mt-1">
              Espace membre
            </div>
          </div>

          <h1 className="text-lg font-bold text-white mb-1">Connexion</h1>
          <p className="text-gray-500 text-sm mb-7">
            Connectez-vous avec votre compte Discord pour rejoindre la communauté.
          </p>

          {error && ERROR_MESSAGES[error] && (
            <div className="mb-5 px-4 py-3 bg-red-900/30 border border-red-700/50 rounded text-red-400 text-sm">
              {ERROR_MESSAGES[error]}
            </div>
          )}

          <a
            href="/api/auth/discord"
            className="flex items-center justify-center gap-3 w-full bg-[#5865f2] hover:bg-[#4752c4] text-white font-bold text-sm tracking-wider px-6 py-3.5 rounded transition-colors"
          >
            <DiscordIcon size={20} />
            SE CONNECTER AVEC DISCORD
          </a>

          <p className="text-center text-gray-600 text-[11px] mt-6 leading-relaxed">
            En vous connectant, vous acceptez nos{" "}
            <Link href="/mentions-legales" className="hover:text-gray-400 transition-colors underline">
              conditions d&apos;utilisation
            </Link>
            .
          </p>
        </div>

        <p className="text-center text-gray-600 text-xs mt-5">
          <Link href="/" className="hover:text-gray-400 transition-colors">
            ← Retour au site
          </Link>
        </p>
      </div>
    </div>
  );
}

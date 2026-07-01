"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { X } from "lucide-react";
import DiscordIcon from "@/components/DiscordIcon";

const ERROR_MESSAGES: Record<string, string> = {
  invalid_state: "Requête invalide, veuillez réessayer.",
  token_failed:  "Connexion Discord échouée, veuillez réessayer.",
  user_failed:   "Impossible de récupérer vos informations Discord.",
};

export default function LoginModal() {
  const [open,    setOpen]    = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [returnTo, setReturnTo] = useState("/");

  // Auto-open when URL contains ?loginModal=1 or ?loginError=...
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const loginError  = params.get("loginError");
    const loginModal  = params.get("loginModal");
    if (loginError || loginModal === "1") {
      setError(loginError);
      open_modal();
      // Clean URL without triggering navigation
      params.delete("loginError");
      params.delete("loginModal");
      const clean = params.toString();
      window.history.replaceState(null, "", window.location.pathname + (clean ? `?${clean}` : ""));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Listen for custom event dispatched by any component
  useEffect(() => {
    function handler(e: Event) {
      const ev = e as CustomEvent<{ error?: string }>;
      setError(ev.detail?.error ?? null);
      open_modal();
    }
    window.addEventListener("open-login", handler);
    return () => window.removeEventListener("open-login", handler);
  }, []);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") setOpen(false); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  function open_modal() {
    // Compute clean returnTo from current URL
    const params = new URLSearchParams(window.location.search);
    params.delete("loginModal");
    params.delete("loginError");
    const search = params.toString();
    setReturnTo(window.location.pathname + (search ? `?${search}` : ""));
    setOpen(true);
  }

  if (!open) return null;

  const discordHref = `/api/auth/discord?returnTo=${encodeURIComponent(returnTo)}`;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center px-4 bg-black/70 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
    >
      <div className="relative w-full max-w-sm bg-[#0d1527] border border-[#1c2d47] rounded-xl p-8 shadow-2xl">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-300 transition-colors"
        >
          <X size={18} />
        </button>

        <div className="flex flex-col items-center mb-7">
          <Image
            src="/logo.png"
            alt="Age of Empires France"
            width={68}
            height={68}
            style={{ mixBlendMode: "lighten" }}
          />
          <div className="text-[10px] tracking-[0.2em] text-gray-500 uppercase font-semibold mt-1">
            Espace membre
          </div>
        </div>

        <h2 className="text-lg font-bold text-white mb-1">Connexion</h2>
        <p className="text-gray-500 text-sm mb-6">
          Connectez-vous avec votre compte Discord pour rejoindre la communauté.
        </p>

        {error && (
          <div className="mb-5 px-4 py-3 bg-red-900/30 border border-red-700/50 rounded text-red-400 text-sm">
            {ERROR_MESSAGES[error] ?? "Une erreur est survenue, veuillez réessayer."}
          </div>
        )}

        <a
          href={discordHref}
          className="flex items-center justify-center gap-3 w-full bg-[#5865f2] hover:bg-[#4752c4] text-white font-bold text-sm tracking-wider px-6 py-3.5 rounded transition-colors"
        >
          <DiscordIcon size={20} />
          SE CONNECTER AVEC DISCORD
        </a>

        <p className="text-center text-gray-600 text-[11px] mt-5 leading-relaxed">
          En vous connectant, vous acceptez nos{" "}
          <Link
            href="/mentions-legales"
            className="hover:text-gray-400 transition-colors underline"
            onClick={() => setOpen(false)}
          >
            conditions d&apos;utilisation
          </Link>
          .
        </p>
      </div>
    </div>
  );
}

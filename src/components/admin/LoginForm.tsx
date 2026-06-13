"use client";

import { useActionState } from "react";
import { login } from "@/app/actions/auth";
import { Eye, EyeOff, LogIn, Shield } from "lucide-react";
import { useState } from "react";

export default function LoginForm() {
  const [state, action, pending] = useActionState(login, undefined);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={action} className="space-y-5">
      {state?.error && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded px-4 py-3 text-red-400 text-sm">
          <Shield size={15} className="shrink-0" />
          {state.error}
        </div>
      )}

      <div className="space-y-1.5">
        <label
          htmlFor="username"
          className="block text-xs font-semibold tracking-wider text-muted uppercase"
        >
          Identifiant
        </label>
        <input
          id="username"
          name="username"
          type="text"
          autoComplete="username"
          required
          disabled={pending}
          className="w-full bg-background border border-border-site focus:border-[#c8a32e] focus:outline-none rounded px-4 py-3 text-foreground placeholder-faint text-sm transition-colors disabled:opacity-60"
          placeholder="admin"
        />
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="password"
          className="block text-xs font-semibold tracking-wider text-muted uppercase"
        >
          Mot de passe
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            disabled={pending}
            className="w-full bg-background border border-border-site focus:border-[#c8a32e] focus:outline-none rounded px-4 py-3 pr-11 text-foreground placeholder-faint text-sm transition-colors disabled:opacity-60"
            placeholder="••••••••"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-faint hover:text-muted transition-colors"
            aria-label={showPassword ? "Masquer" : "Afficher"}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full flex items-center justify-center gap-2 bg-[#c8a32e] hover:bg-[#b8922a] disabled:opacity-60 disabled:cursor-not-allowed text-[#080e1a] font-bold text-sm tracking-wider py-3.5 rounded transition-colors"
      >
        <LogIn size={16} />
        {pending ? "Connexion en cours…" : "SE CONNECTER"}
      </button>
    </form>
  );
}

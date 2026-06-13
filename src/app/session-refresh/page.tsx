"use client";

import { useEffect, useRef } from "react";
import { refreshSession } from "@/app/actions/auth";

export default function SessionRefreshPage() {
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    ref.current?.requestSubmit();
  }, []);

  return (
    <div className="min-h-screen bg-[#080e1a] flex items-center justify-center">
      <div className="text-center space-y-6">
        <p className="text-gray-400 text-sm">Mise à jour de vos droits d&apos;accès…</p>
        <form ref={ref} action={refreshSession}>
          <button
            type="submit"
            className="bg-[#c8a32e] hover:bg-[#b8922a] text-[#080e1a] font-bold text-sm tracking-wider px-6 py-3 rounded transition-colors"
          >
            Accéder au back office
          </button>
        </form>
      </div>
    </div>
  );
}

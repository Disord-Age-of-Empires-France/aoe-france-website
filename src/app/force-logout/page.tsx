"use client";

import { useEffect, useRef } from "react";
import { logout } from "@/app/actions/auth";

// Appelé quand le layout admin détecte que le rôle en base est "member"
// mais que le cookie JWT contient encore un rôle BO.
// Auto-soumet le formulaire de déconnexion pour détruire le cookie proprement.
export default function ForceLogoutPage() {
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    ref.current?.requestSubmit();
  }, []);

  return (
    <form ref={ref} action={logout} className="sr-only">
      <button type="submit">Déconnexion</button>
    </form>
  );
}

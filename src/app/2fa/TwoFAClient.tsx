"use client";

import { useState, useActionState, useTransition, useRef, useEffect } from "react";
import { startAuthentication } from "@simplewebauthn/browser";
import type { PublicKeyCredentialRequestOptionsJSON } from "@simplewebauthn/server";
import { ShieldCheck, KeyRound, Key, Loader2, AlertCircle } from "lucide-react";
import { verify2FAAction } from "@/app/actions/totp";
import { initWebAuthnAuthAction, verifyWebAuthnAuthAction } from "@/app/actions/webauthn";

type Method = "totp" | "webauthn";

interface Props {
  hasTOTP:     boolean;
  hasWebAuthn: boolean;
}

export default function TwoFAClient({ hasTOTP, hasWebAuthn }: Props) {
  const defaultMethod: Method = hasWebAuthn ? "webauthn" : "totp";
  const [method, setMethod] = useState<Method>(defaultMethod);
  const [webAuthnError, setWebAuthnError] = useState("");
  const [rememberDevice, setRememberDevice] = useState(false);
  const [webAuthnPending, startWebAuthn] = useTransition();
  const [totpState, totpAction, totpPending] = useActionState(verify2FAAction, undefined);
  const inputRef = useRef<HTMLInputElement>(null);

  const showTabs = hasTOTP && hasWebAuthn;

  useEffect(() => {
    if (method === "totp") inputRef.current?.focus();
  }, [method]);

  function handleWebAuthn() {
    setWebAuthnError("");
    startWebAuthn(async () => {
      const optResult = await initWebAuthnAuthAction();
      if ("error" in optResult) { setWebAuthnError(optResult.error); return; }

      let credential;
      try {
        credential = await startAuthentication({ optionsJSON: optResult.options as PublicKeyCredentialRequestOptionsJSON });
      } catch {
        setWebAuthnError("Clé annulée ou non reconnue. Réessayez.");
        return;
      }

      const result = await verifyWebAuthnAuthAction(JSON.stringify(credential), rememberDevice);
      if (result && "error" in result) setWebAuthnError(result.error);
    });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-[#c8a32e]/10 border border-[#c8a32e]/30 flex items-center justify-center mx-auto mb-4">
            <ShieldCheck size={26} className="text-[#c8a32e]" />
          </div>
          <h1 className="text-xl font-bold text-foreground">Vérification en deux étapes</h1>
          <p className="text-faint text-sm mt-2 leading-relaxed">
            {!showTabs && method === "totp"
              ? "Entrez le code à 6 chiffres de votre application d'authentification."
              : !showTabs && method === "webauthn"
              ? "Insérez votre clé de sécurité et cliquez sur le bouton ci-dessous."
              : "Choisissez votre méthode de vérification."}
          </p>
        </div>

        {/* Sélecteur de méthode (seulement si les deux sont disponibles) */}
        {showTabs && (
          <div className="flex rounded-lg border border-border-site overflow-hidden mb-6">
            <button
              type="button"
              onClick={() => setMethod("webauthn")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold transition-colors ${
                method === "webauthn"
                  ? "bg-[#c8a32e]/10 text-[#c8a32e]"
                  : "text-faint hover:text-muted hover:bg-surface-2"
              }`}
            >
              <Key size={14} />
              Clé de sécurité
            </button>
            <div className="w-px bg-border-site" />
            <button
              type="button"
              onClick={() => setMethod("totp")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold transition-colors ${
                method === "totp"
                  ? "bg-[#c8a32e]/10 text-[#c8a32e]"
                  : "text-faint hover:text-muted hover:bg-surface-2"
              }`}
            >
              <KeyRound size={14} />
              Code TOTP
            </button>
          </div>
        )}

        {/* Option "Se souvenir" partagée */}
        <label className="flex items-center gap-2.5 cursor-pointer group mb-4">
          <input
            type="checkbox"
            checked={rememberDevice}
            onChange={e => setRememberDevice(e.target.checked)}
            className="w-4 h-4 rounded border-border-site accent-[#c8a32e]"
          />
          <span className="text-sm text-muted group-hover:text-foreground transition-colors">
            Se souvenir de cet appareil pendant 30 jours
          </span>
        </label>

        {/* ── WebAuthn ─────────────────────────────────────────────────────── */}
        {method === "webauthn" && (
          <div className="space-y-4">
            <div className="flex flex-col items-center gap-3 py-6 bg-surface border border-border-site rounded-xl">
              <div className="w-14 h-14 rounded-xl bg-surface-2 border border-border-site flex items-center justify-center">
                <Key size={24} className="text-faint" />
              </div>
              <p className="text-sm text-muted text-center px-4">
                Insérez votre clé de sécurité et appuyez sur le bouton, ou touchez la clé si elle est NFC.
              </p>
            </div>

            {webAuthnError && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2.5 text-red-400 text-sm">
                <AlertCircle size={14} className="shrink-0" />
                {webAuthnError}
              </div>
            )}

            <button
              type="button"
              onClick={handleWebAuthn}
              disabled={webAuthnPending}
              className="w-full flex items-center justify-center gap-2 bg-[#c8a32e] hover:bg-[#e5bb44] disabled:opacity-60 text-black font-bold py-3 rounded-lg transition-colors"
            >
              {webAuthnPending ? <Loader2 size={16} className="animate-spin" /> : <Key size={16} />}
              {webAuthnPending ? "En attente de la clé…" : "Utiliser ma clé de sécurité"}
            </button>
          </div>
        )}

        {/* ── TOTP ─────────────────────────────────────────────────────────── */}
        {method === "totp" && (
          <form action={totpAction} className="space-y-4">
            <div>
              <label htmlFor="code" className="block text-xs font-bold text-faint uppercase tracking-wider mb-2">
                Code de vérification
              </label>
              <input
                ref={inputRef}
                id="code"
                name="code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={8}
                placeholder="000000"
                className="w-full bg-surface border border-border-site rounded-lg px-4 py-3 text-foreground text-center text-2xl tracking-[0.5em] font-mono placeholder:text-faint/40 placeholder:text-base placeholder:tracking-normal focus:outline-none focus:border-[#c8a32e]/60 transition-colors"
              />
              <p className="text-xs text-faint mt-1.5 text-center">
                Ou entrez un de vos codes de secours.
              </p>
            </div>

            {/* Transmet remember_device via champ caché synchronisé */}
            <input type="hidden" name="remember_device" value={rememberDevice ? "1" : "0"} />

            {totpState?.error && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2.5 text-red-400 text-sm">
                <AlertCircle size={14} className="shrink-0" />
                {totpState.error}
              </div>
            )}

            <button
              type="submit"
              disabled={totpPending}
              className="w-full flex items-center justify-center gap-2 bg-[#c8a32e] hover:bg-[#e5bb44] disabled:opacity-60 text-black font-bold py-3 rounded-lg transition-colors"
            >
              {totpPending ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />}
              {totpPending ? "Vérification…" : "Vérifier"}
            </button>
          </form>
        )}

        <p className="text-center text-xs text-faint mt-6">
          Problème d&apos;accès ?{" "}
          <a href="/connexion" className="text-[#c8a32e] hover:underline">
            Retour à la connexion
          </a>
        </p>
      </div>
    </div>
  );
}

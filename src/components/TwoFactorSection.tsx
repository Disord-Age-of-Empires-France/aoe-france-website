"use client";

import { useState, useActionState, useTransition } from "react";
import { ShieldCheck, ShieldOff, ShieldAlert, Copy, Check, AlertCircle, Loader2, KeyRound } from "lucide-react";
import { initTOTPSetupAction, confirmTOTPSetupAction, disableTOTPAction } from "@/app/actions/totp";

type Step = "idle" | "setup" | "backup" | "disable";

interface Props {
  totpEnabled:  boolean;
  isAdmin:      boolean;
}

export default function TwoFactorSection({ totpEnabled, isAdmin }: Props) {
  const [step,       setStep]       = useState<Step>("idle");
  const [qrCode,     setQrCode]     = useState<string>("");
  const [secret,     setSecret]     = useState<string>("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [copied,     setCopied]     = useState(false);
  const [initError,  setInitError]  = useState<string>("");
  const [initPending, startInit]    = useTransition();

  const [confirmState, confirmAction, confirmPending] = useActionState(confirmTOTPSetupAction, undefined);
  const [disableState, disableAction, disablePending] = useActionState(disableTOTPAction,    undefined);

  function handleStartSetup() {
    setInitError("");
    startInit(async () => {
      const res = await initTOTPSetupAction();
      if ("error" in res) { setInitError(res.error); return; }
      setQrCode(res.qrCode);
      setSecret(res.secret);
      setStep("setup");
    });
  }

  function handleConfirmSuccess(result: unknown) {
    if (result && typeof result === "object" && "backupCodes" in result) {
      setBackupCodes((result as { backupCodes: string[] }).backupCodes);
      setStep("backup");
    }
  }

  function copyBackupCodes() {
    navigator.clipboard.writeText(backupCodes.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // ── Idle : état initial ──────────────────────────────────────────────────────
  if (step === "idle" && !totpEnabled) {
    return (
      <div className="bg-surface border border-border-site rounded-xl p-5">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-surface-2 border border-border-site flex items-center justify-center shrink-0">
            <ShieldOff size={18} className="text-faint" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-foreground text-sm">Double authentification</p>
            <p className="text-xs text-faint mt-0.5 leading-relaxed">
              {isAdmin
                ? "Obligatoire pour les administrateurs. Protège votre compte avec un code temporaire en plus du mot de passe."
                : "Optionnelle. Protège votre compte avec un code temporaire en plus du mot de passe."}
            </p>
            {initError && (
              <div className="flex items-center gap-1.5 text-red-400 text-xs mt-2">
                <AlertCircle size={12} /> {initError}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={handleStartSetup}
            disabled={initPending}
            className="shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#c8a32e]/10 border border-[#c8a32e]/30 text-[#c8a32e] text-sm font-semibold hover:bg-[#c8a32e]/20 transition-colors disabled:opacity-50"
          >
            {initPending ? <Loader2 size={13} className="animate-spin" /> : <ShieldCheck size={13} />}
            Activer
          </button>
        </div>
      </div>
    );
  }

  // ── Idle : 2FA active ────────────────────────────────────────────────────────
  if (step === "idle" && totpEnabled) {
    return (
      <div className="bg-surface border border-border-site rounded-xl p-5">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <ShieldCheck size={18} className="text-emerald-400" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-foreground text-sm">Double authentification</p>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">ACTIVE</span>
            </div>
            <p className="text-xs text-faint mt-0.5">Votre compte est protégé par un code TOTP à chaque connexion.</p>
          </div>
          <button
            type="button"
            onClick={() => setStep("disable")}
            className="shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-surface-2 border border-border-site text-faint text-sm font-semibold hover:text-red-400 hover:border-red-500/30 transition-colors"
          >
            <ShieldOff size={13} />
            Désactiver
          </button>
        </div>
      </div>
    );
  }

  // ── Setup : scanner le QR code ───────────────────────────────────────────────
  if (step === "setup") {
    return (
      <div className="bg-surface border border-border-site rounded-xl p-5 space-y-5">
        <div className="flex items-center gap-3">
          <ShieldAlert size={18} className="text-[#c8a32e]" />
          <p className="font-semibold text-foreground text-sm">Configurer la double authentification</p>
        </div>

        <ol className="space-y-4 text-sm text-muted">
          <li className="flex gap-3">
            <span className="w-5 h-5 rounded-full bg-[#c8a32e]/15 text-[#c8a32e] text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
            <span>Installez une application d&apos;authentification : <strong className="text-foreground">Google Authenticator</strong>, <strong className="text-foreground">Authy</strong> ou <strong className="text-foreground">1Password</strong>.</span>
          </li>
          <li className="flex gap-3">
            <span className="w-5 h-5 rounded-full bg-[#c8a32e]/15 text-[#c8a32e] text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
            <div className="flex-1">
              <span>Scannez ce QR code ou entrez la clé manuellement.</span>
              <div className="mt-3 flex gap-4 items-start">
                {qrCode && (
                  <img src={qrCode} alt="QR code 2FA" className="w-36 h-36 rounded-lg border border-border-site bg-white p-1" />
                )}
                <div className="flex-1">
                  <p className="text-[10px] font-bold text-faint uppercase tracking-wider mb-1">Clé manuelle</p>
                  <code className="block text-xs font-mono bg-surface-2 border border-border-site rounded px-3 py-2 text-foreground break-all">
                    {secret.match(/.{1,4}/g)?.join(" ")}
                  </code>
                </div>
              </div>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="w-5 h-5 rounded-full bg-[#c8a32e]/15 text-[#c8a32e] text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
            <span>Entrez le code à 6 chiffres affiché dans l&apos;application pour confirmer.</span>
          </li>
        </ol>

        <form
          action={async (fd) => {
            const result = await confirmTOTPSetupAction(undefined, fd);
            handleConfirmSuccess(result);
          }}
          className="space-y-3"
        >
          <input
            name="code"
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="000000"
            autoFocus
            className="w-full bg-surface-2 border border-border-site rounded-lg px-4 py-2.5 text-foreground text-center text-xl tracking-[0.4em] font-mono placeholder:text-faint/40 placeholder:text-sm placeholder:tracking-normal focus:outline-none focus:border-[#c8a32e]/60 transition-colors"
          />

          {confirmState && "error" in confirmState && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 text-red-400 text-xs">
              <AlertCircle size={12} /> {confirmState.error}
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setStep("idle")}
              className="flex-1 py-2.5 rounded-lg bg-surface-2 border border-border-site text-faint text-sm font-semibold hover:text-muted transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={confirmPending}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[#c8a32e] hover:bg-[#e5bb44] disabled:opacity-60 text-black text-sm font-bold transition-colors"
            >
              {confirmPending ? <Loader2 size={13} className="animate-spin" /> : <KeyRound size={13} />}
              Confirmer
            </button>
          </div>
        </form>
      </div>
    );
  }

  // ── Backup codes ─────────────────────────────────────────────────────────────
  if (step === "backup") {
    return (
      <div className="bg-surface border border-emerald-500/30 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-3">
          <ShieldCheck size={18} className="text-emerald-400" />
          <p className="font-semibold text-foreground text-sm">2FA activée — Sauvegardez vos codes de secours</p>
        </div>

        <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg px-4 py-3 text-amber-400 text-xs leading-relaxed">
          ⚠️ Ces codes ne seront affichés <strong>qu&apos;une seule fois</strong>. Notez-les dans un endroit sûr. Chaque code ne peut être utilisé qu&apos;une fois.
        </div>

        <div className="grid grid-cols-2 gap-2">
          {backupCodes.map(code => (
            <code key={code} className="bg-surface-2 border border-border-site rounded px-3 py-1.5 text-sm font-mono text-foreground text-center">
              {code}
            </code>
          ))}
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={copyBackupCodes}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-surface-2 border border-border-site text-sm font-semibold text-faint hover:text-foreground transition-colors"
          >
            {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
            {copied ? "Copié !" : "Copier tous les codes"}
          </button>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="flex-1 py-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-bold hover:bg-emerald-500/15 transition-colors"
          >
            J&apos;ai sauvegardé mes codes
          </button>
        </div>
      </div>
    );
  }

  // ── Disable : confirmer avec le code actuel ──────────────────────────────────
  if (step === "disable") {
    return (
      <div className="bg-surface border border-red-500/20 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-3">
          <ShieldOff size={18} className="text-red-400" />
          <p className="font-semibold text-foreground text-sm">Désactiver la double authentification</p>
        </div>
        <p className="text-xs text-faint leading-relaxed">
          Entrez votre code TOTP actuel ou un code de secours pour confirmer la désactivation.
        </p>

        <form action={disableAction} className="space-y-3">
          <input
            name="code"
            type="text"
            inputMode="numeric"
            maxLength={9}
            placeholder="000000"
            autoFocus
            className="w-full bg-surface-2 border border-border-site rounded-lg px-4 py-2.5 text-foreground text-center text-xl tracking-[0.4em] font-mono placeholder:text-faint/40 placeholder:text-sm placeholder:tracking-normal focus:outline-none focus:border-red-500/40 transition-colors"
          />

          {disableState && "error" in disableState && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 text-red-400 text-xs">
              <AlertCircle size={12} /> {disableState.error}
            </div>
          )}
          {disableState && "success" in disableState && (
            <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-3 py-2 text-emerald-400 text-xs">
              <Check size={12} /> 2FA désactivée. Rechargez la page.
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setStep("idle")}
              className="flex-1 py-2.5 rounded-lg bg-surface-2 border border-border-site text-faint text-sm font-semibold hover:text-muted transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={disablePending}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-bold hover:bg-red-500/15 disabled:opacity-60 transition-colors"
            >
              {disablePending ? <Loader2 size={13} className="animate-spin" /> : <ShieldOff size={13} />}
              Désactiver
            </button>
          </div>
        </form>
      </div>
    );
  }

  return null;
}

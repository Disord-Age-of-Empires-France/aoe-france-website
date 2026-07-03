"use client";

import { useState, useActionState, useTransition } from "react";
import { startRegistration } from "@simplewebauthn/browser";
import type { PublicKeyCredentialCreationOptionsJSON } from "@simplewebauthn/server";
import { Key, Plus, Trash2, Pencil, Check, AlertCircle, Loader2, Shield, X } from "lucide-react";
import { initWebAuthnRegistrationAction, verifyWebAuthnRegistrationAction, removeWebAuthnCredentialAction, renameWebAuthnCredentialAction } from "@/app/actions/webauthn";
import type { WebAuthnCredential } from "@/lib/db";

interface Props {
  credentials: WebAuthnCredential[];
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const m  = Math.floor(ms / 60_000);
  if (m < 1)  return "À l'instant";
  if (m < 60) return `Il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `Il y a ${h}h`;
  const d = Math.floor(h / 24);
  return `Il y a ${d}j`;
}

// ── Suppression d'une clé ─────────────────────────────────────────────────────

function RemoveKey({ cred }: { cred: WebAuthnCredential }) {
  const [confirm, setConfirm] = useState(false);
  const [state, action, pending] = useActionState(removeWebAuthnCredentialAction, undefined);

  if (state && "success" in state) {
    return (
      <span className="flex items-center gap-1 text-xs text-emerald-400">
        <Check size={11} /> Supprimée
      </span>
    );
  }

  if (!confirm) {
    return (
      <button
        type="button"
        onClick={() => setConfirm(true)}
        className="p-1.5 rounded hover:bg-red-500/10 text-faint hover:text-red-400 transition-colors"
        title="Supprimer cette clé"
      >
        <Trash2 size={13} />
      </button>
    );
  }

  return (
    <form action={action} className="flex items-center gap-1.5">
      <input type="hidden" name="credId" value={cred.id} />
      {state && "error" in state && (
        <span className="text-red-400 text-xs">{state.error}</span>
      )}
      <button
        type="submit"
        disabled={pending}
        className="flex items-center gap-1 px-2 py-1 rounded bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-semibold hover:bg-red-500/20 transition-colors"
      >
        {pending ? <Loader2 size={11} className="animate-spin" /> : <Trash2 size={11} />}
        Confirmer
      </button>
      <button
        type="button"
        onClick={() => setConfirm(false)}
        className="p-1.5 rounded hover:bg-surface-2 text-faint transition-colors"
      >
        <X size={13} />
      </button>
    </form>
  );
}

// ── Renommer une clé ──────────────────────────────────────────────────────────

function RenameKey({ cred }: { cred: WebAuthnCredential }) {
  const [editing, setEditing] = useState(false);
  const [state, action, pending] = useActionState(renameWebAuthnCredentialAction, undefined);

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="p-1.5 rounded hover:bg-surface-2 text-faint hover:text-muted transition-colors"
        title="Renommer"
      >
        <Pencil size={13} />
      </button>
    );
  }

  return (
    <form
      action={async (fd) => {
        await action(fd);
        setEditing(false);
      }}
      className="flex items-center gap-1.5"
    >
      <input type="hidden" name="credId" value={cred.id} />
      <input
        name="name"
        type="text"
        defaultValue={cred.name}
        maxLength={40}
        autoFocus
        className="bg-surface-2 border border-border-site rounded px-2 py-1 text-xs text-foreground focus:outline-none focus:border-[#c8a32e]/60 w-36"
      />
      {state && "error" in state && (
        <span className="text-red-400 text-xs">{state.error}</span>
      )}
      <button
        type="submit"
        disabled={pending}
        className="p-1.5 rounded bg-[#c8a32e]/10 border border-[#c8a32e]/30 text-[#c8a32e] hover:bg-[#c8a32e]/20 transition-colors"
      >
        {pending ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />}
      </button>
      <button
        type="button"
        onClick={() => setEditing(false)}
        className="p-1.5 rounded hover:bg-surface-2 text-faint transition-colors"
      >
        <X size={13} />
      </button>
    </form>
  );
}

// ── Section principale ────────────────────────────────────────────────────────

export default function WebAuthnSection({ credentials }: Props) {
  const [adding,     setAdding]     = useState(false);
  const [keyName,    setKeyName]    = useState("");
  const [error,      setError]      = useState("");
  const [registerPending, startRegister] = useTransition();

  function handleAddKey() {
    setError("");
    startRegister(async () => {
      const optResult = await initWebAuthnRegistrationAction();
      if ("error" in optResult) { setError(optResult.error); return; }

      let credential;
      try {
        credential = await startRegistration({ optionsJSON: optResult.options as PublicKeyCredentialCreationOptionsJSON });
      } catch {
        setError("Enregistrement annulé ou clé non reconnue.");
        return;
      }

      const result = await verifyWebAuthnRegistrationAction(JSON.stringify(credential), keyName);
      if (result && "error" in result) { setError(result.error); return; }

      window.location.reload();
    });
  }

  return (
    <div className="bg-surface border border-border-site rounded-xl p-5 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-surface-2 border border-border-site flex items-center justify-center shrink-0">
            <Key size={17} className="text-faint" />
          </div>
          <div>
            <p className="font-semibold text-foreground text-sm">Clés de sécurité physiques</p>
            <p className="text-xs text-faint mt-0.5">YubiKey, FIDO2 — alternative à l&apos;application TOTP.</p>
          </div>
        </div>
        {credentials.length > 0 && (
          <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            {credentials.length} CLÉ{credentials.length > 1 ? "S" : ""}
          </span>
        )}
      </div>

      {/* Liste des clés existantes */}
      {credentials.length > 0 && (
        <ul className="space-y-2">
          {credentials.map(cred => (
            <li
              key={cred.id}
              className="flex items-center gap-3 bg-surface-2 border border-border-site rounded-lg px-3 py-2.5"
            >
              <Shield size={14} className="text-[#c8a32e] shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{cred.name}</p>
                <p className="text-[10px] text-faint">
                  Ajoutée {timeAgo(cred.createdAt)}
                  {cred.lastUsedAt && ` · Utilisée ${timeAgo(cred.lastUsedAt)}`}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <RenameKey cred={cred} />
                <RemoveKey cred={cred} />
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Formulaire d'ajout */}
      {adding ? (
        <div className="space-y-3 pt-1">
          <div>
            <label className="block text-[10px] font-bold text-faint uppercase tracking-wider mb-1.5">
              Nom de la clé (facultatif)
            </label>
            <input
              type="text"
              value={keyName}
              onChange={e => setKeyName(e.target.value)}
              maxLength={40}
              placeholder="ex : YubiKey bureau"
              className="w-full bg-surface-2 border border-border-site rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-faint/50 focus:outline-none focus:border-[#c8a32e]/60 transition-colors"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 text-red-400 text-xs">
              <AlertCircle size={12} /> {error}
            </div>
          )}

          <p className="text-xs text-faint leading-relaxed">
            Insérez votre clé USB puis cliquez sur <strong className="text-muted">Enregistrer la clé</strong>. Votre navigateur vous demandera de toucher la clé.
          </p>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { setAdding(false); setError(""); setKeyName(""); }}
              className="flex-1 py-2 rounded-lg bg-surface-2 border border-border-site text-faint text-sm font-semibold hover:text-muted transition-colors"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleAddKey}
              disabled={registerPending}
              className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-[#c8a32e]/10 border border-[#c8a32e]/30 text-[#c8a32e] text-sm font-semibold hover:bg-[#c8a32e]/20 disabled:opacity-60 transition-colors"
            >
              {registerPending ? <Loader2 size={14} className="animate-spin" /> : <Key size={14} />}
              {registerPending ? "En attente de la clé…" : "Enregistrer la clé"}
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-surface-2 border border-border-site text-faint text-sm font-semibold hover:text-foreground hover:border-[#c8a32e]/30 transition-colors"
        >
          <Plus size={14} />
          Ajouter une clé de sécurité
        </button>
      )}
    </div>
  );
}

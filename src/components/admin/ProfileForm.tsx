"use client";

import { useActionState, useRef, useState } from "react";
import { Save, CheckCircle, AlertCircle, Camera, Check, X, Lock, Eye, EyeOff, MapPin, Globe, Calendar, User as UserIcon, ShieldCheck, KeyRound } from "lucide-react";
import CustomSelect from "./CustomSelect";
import type { SelectItem } from "./CustomSelect";
import DeleteAccountSection from "./DeleteAccountSection";

const LOCATION_OPTIONS: SelectItem[] = [
  { value: "", label: "— Non renseignée —" },
  { group: "Francophonie", items: [
    { value: "France",       label: "France" },
    { value: "Belgique",     label: "Belgique" },
    { value: "Suisse",       label: "Suisse" },
    { value: "Canada",       label: "Canada" },
    { value: "Luxembourg",   label: "Luxembourg" },
    { value: "Monaco",       label: "Monaco" },
    { value: "Maroc",        label: "Maroc" },
    { value: "Algérie",      label: "Algérie" },
    { value: "Tunisie",      label: "Tunisie" },
    { value: "Sénégal",      label: "Sénégal" },
    { value: "Côte d'Ivoire", label: "Côte d'Ivoire" },
  ]},
  { group: "Europe", items: [
    { value: "Allemagne",    label: "Allemagne" },
    { value: "Espagne",      label: "Espagne" },
    { value: "Italie",       label: "Italie" },
    { value: "Pays-Bas",     label: "Pays-Bas" },
    { value: "Portugal",     label: "Portugal" },
    { value: "Pologne",      label: "Pologne" },
    { value: "Royaume-Uni",  label: "Royaume-Uni" },
    { value: "Suède",        label: "Suède" },
  ]},
  { group: "Reste du monde", items: [
    { value: "États-Unis",   label: "États-Unis" },
    { value: "Brésil",       label: "Brésil" },
    { value: "Mexique",      label: "Mexique" },
    { value: "Australie",    label: "Australie" },
    { value: "Japon",        label: "Japon" },
    { value: "Autre",        label: "Autre" },
  ]},
];

const SOCIAL_TYPE_OPTIONS: SelectItem[] = [
  { value: "",          label: "Plateforme" },
  { value: "twitch",    label: "Twitch" },
  { value: "youtube",   label: "YouTube" },
  { value: "twitter",   label: "Twitter / X" },
  { value: "discord",   label: "Discord" },
  { value: "steam",     label: "Steam" },
  { value: "tiktok",    label: "TikTok" },
  { value: "instagram", label: "Instagram" },
  { value: "github",    label: "GitHub" },
  { value: "site_web",  label: "Site web" },
];
import { updateProfileAction } from "@/app/actions/users";
import type { User } from "@/lib/db";

interface Props {
  user: User;
}

type Tab = "profil" | "confidentialite" | "securite";

const TABS: { id: Tab; label: string; Icon: React.ElementType }[] = [
  { id: "profil",          label: "Profil",          Icon: UserIcon    },
  { id: "confidentialite", label: "Confidentialité",  Icon: ShieldCheck },
  { id: "securite",        label: "Sécurité",         Icon: KeyRound    },
];

const INPUT = "w-full bg-background border border-border-site focus:border-[#c8a32e] focus:outline-none rounded px-4 py-3 text-foreground placeholder-faint text-sm transition-colors disabled:opacity-60";

export default function ProfileForm({ user }: Props) {
  const [state, action, pending] = useActionState(updateProfileAction, undefined);
  const [activeTab, setActiveTab] = useState<Tab>("profil");

  const effectiveAvatar = user.avatar || user.discordAvatar || "";
  const [avatarValue,  setAvatarValue]  = useState(effectiveAvatar);
  const [uploading,    setUploading]    = useState(false);
  const [uploadError,  setUploadError]  = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setUploadError(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res  = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json() as { url?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Erreur lors de l'envoi");
      setAvatarValue(data.url ?? "");
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "Erreur inconnue");
    } finally {
      setUploading(false);
    }
  }

  const initials = (user.displayName || user.username).slice(0, 2).toUpperCase();

  const COOLDOWN_DAYS = 120;
  const nameLockedUntil = (() => {
    if (!user.displayNameChangedAt) return null;
    const until = new Date(new Date(user.displayNameChangedAt).getTime() + COOLDOWN_DAYS * 24 * 60 * 60 * 1000);
    return until > new Date() ? until : null;
  })();

  const [locationValue, setLocationValue] = useState(user.location ?? "");
  const [bioValue, setBioValue] = useState(user.bio ?? "");

  const EMPTY_LINK = { type: "", url: "" };
  const initLinks = (): { type: string; url: string }[] => {
    const base = (user.socialLinks ?? []).slice(0, 3);
    while (base.length < 3) base.push({ ...EMPTY_LINK });
    return base;
  };
  const [socialLinks,    setSocialLinks]    = useState<{ type: string; url: string }[]>(initLinks);

  const [profilePublic,    setProfilePublic]    = useState(user.profilePublic);
  const [displayNameValue, setDisplayNameValue] = useState(user.displayName);
  const [showPreview,      setShowPreview]      = useState(false);
  const [currentPwValue, setCurrentPwValue] = useState("");
  const [newPwValue,     setNewPwValue]     = useState("");
  const [confirmPwValue, setConfirmPwValue] = useState("");
  const canChangePassword = currentPwValue.length > 0;

  const CONDITIONS = [
    { label: "12 caractères minimum",  met: newPwValue.length >= 12 },
    { label: "Une lettre majuscule",   met: /[A-Z]/.test(newPwValue) },
    { label: "Une lettre minuscule",   met: /[a-z]/.test(newPwValue) },
    { label: "Un chiffre",             met: /[0-9]/.test(newPwValue) },
    { label: "Un caractère spécial",   met: /[^A-Za-z0-9]/.test(newPwValue) },
  ];

  const score = CONDITIONS.filter((c) => c.met).length;
  const STRENGTH =
    score === 0 ? null
    : score === 1 ? { label: "Très faible", bar: "bg-red-500",     text: "text-red-400",    pct: 20  }
    : score <= 3  ? { label: "Faible",       bar: "bg-orange-500",  text: "text-orange-400", pct: 45  }
    : score === 4 ? { label: "Moyen",         bar: "bg-amber-400",   text: "text-amber-400",  pct: 72  }
                  : { label: "Fort",           bar: "bg-emerald-500", text: "text-emerald-400",pct: 100 };

  const passwordsMatch = confirmPwValue.length > 0 && confirmPwValue === newPwValue;

  return (
    <form action={action} className="space-y-5">
      {state?.success && (
        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 rounded px-4 py-3 text-emerald-400 text-sm">
          <CheckCircle size={15} />
          Profil mis à jour.
        </div>
      )}
      {state?.error && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded px-4 py-3 text-red-400 text-sm">
          <AlertCircle size={15} />
          {state.error}
        </div>
      )}

      {/* Champ caché avatar (toujours soumis) */}
      <input type="hidden" name="avatar" value={avatarValue} />

      <div className="bg-surface border border-border-site rounded-lg overflow-hidden">
        {/* Tab bar */}
        <div className="flex border-b border-border-site">
          {TABS.map(({ id, label, Icon }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 px-5 py-3.5 text-sm font-semibold transition-colors border-b-2 -mb-px ${
                  isActive
                    ? "border-[#c8a32e] text-[#c8a32e]"
                    : "border-transparent text-faint hover:text-muted"
                }`}
              >
                <Icon size={14} />
                {label}
              </button>
            );
          })}
        </div>

        {/* ── Onglet Profil ───────────────────────────────────────────────── */}
        <div className={activeTab === "profil" ? "p-6 space-y-6" : "hidden"}>

          {/* Avatar */}
          <div>
            <p className="text-[10px] font-bold tracking-widest text-faint uppercase mb-4">Photo de profil</p>
            <div className="flex items-center gap-6">
              <div className="relative shrink-0">
                <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-border-site bg-surface-2 flex items-center justify-center">
                  {avatarValue ? (
                    <img src={avatarValue} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl font-bold text-muted">{initials}</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => !uploading && fileInputRef.current?.click()}
                  disabled={uploading}
                  className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#c8a32e] hover:bg-[#b8922a] disabled:opacity-60 flex items-center justify-center transition-colors"
                  title="Changer la photo"
                >
                  <Camera size={13} className="text-[#080e1a]" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                  className="sr-only"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
                />
              </div>
              <div className="space-y-2 min-w-0">
                <p className="text-sm text-muted">
                  {uploading ? "Envoi en cours…" : "Cliquez sur l'icône pour changer votre photo."}
                </p>
                <p className="text-[11px] text-faint">JPG, PNG, WebP, GIF, AVIF · max 5 Mo</p>
                {avatarValue && (
                  <button type="button" onClick={() => setAvatarValue("")} className="text-[11px] text-red-400 hover:text-red-300 transition-colors">
                    Supprimer la photo
                  </button>
                )}
                {uploadError && <p className="text-[11px] text-red-400">{uploadError}</p>}
              </div>
            </div>
          </div>

          {/* Informations */}
          <div className="border-t border-border-site pt-6">
            <p className="text-[10px] font-bold tracking-widest text-faint uppercase mb-4">Informations</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold tracking-wider text-muted uppercase">Identifiant</label>
                <div className="px-4 py-3 bg-surface-3 border border-border-site rounded text-sm text-faint">
                  {user.username}<span className="ml-2 text-[11px]">(non modifiable)</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold tracking-wider text-muted uppercase">Rôle</label>
                <div className="px-4 py-3 bg-surface-3 border border-border-site rounded text-sm text-faint">
                  {user.role === "admin" ? "Administrateur" : user.role === "editor" ? "Éditeur" : "Membre"}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold tracking-wider text-muted uppercase">Nom affiché</label>
                <input
                  name="displayName"
                  type="text"
                  value={displayNameValue}
                  onChange={(e) => setDisplayNameValue(e.target.value)}
                  disabled={pending || !!nameLockedUntil}
                  className={INPUT}
                  placeholder="Prénom Nom"
                />
                {nameLockedUntil ? (
                  <p className="text-[11px] text-amber-400/80 flex items-center gap-1.5">
                    <Lock size={11} />
                    Prochain changement le {nameLockedUntil.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                ) : user.displayNameChangedAt ? (
                  <p className="text-[11px] text-faint">
                    Dernier changement le {new Date(user.displayNameChangedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                ) : null}
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold tracking-wider text-muted uppercase">Email</label>
                <div className="px-4 py-3 bg-surface-3 border border-border-site rounded text-sm text-faint">
                  {user.email || <span className="italic">Non renseigné</span>}
                  <span className="ml-2 text-[11px]">(non modifiable)</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold tracking-wider text-muted uppercase">Localisation</label>
                <CustomSelect
                  name="location"
                  value={locationValue}
                  onChange={setLocationValue}
                  options={LOCATION_OPTIONS}
                  placeholder="— Non renseignée —"
                  disabled={pending}
                />
              </div>

              <div className="md:col-span-2 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold tracking-wider text-muted uppercase">Bio</label>
                  <span className={`text-[11px] tabular-nums ${bioValue.length > 250 ? "text-amber-400" : "text-faint"}`}>
                    {bioValue.length}/280
                  </span>
                </div>
                <textarea
                  name="bio"
                  rows={3}
                  value={bioValue}
                  onChange={(e) => setBioValue(e.target.value.slice(0, 280))}
                  disabled={pending}
                  className={INPUT + " resize-none"}
                  placeholder="Quelques mots sur vous…"
                />
              </div>
            </div>
          </div>

          {/* Liens sociaux */}
          <div className="border-t border-border-site pt-6">
            <p className="text-[10px] font-bold tracking-widest text-faint uppercase mb-4">Liens & réseaux sociaux</p>
            <div className="space-y-3">
              {socialLinks.map((link, i) => (
                <div key={i} className="flex gap-2">
                  <CustomSelect
                    name={`socialType${i}`}
                    value={link.type}
                    onChange={(v) => { const next = [...socialLinks]; next[i] = { ...next[i], type: v }; setSocialLinks(next); }}
                    options={SOCIAL_TYPE_OPTIONS}
                    placeholder="Plateforme"
                    disabled={pending}
                    className="w-44 shrink-0"
                  />
                  <input
                    name={`socialUrl${i}`}
                    type="url"
                    value={link.url}
                    onChange={(e) => { const next = [...socialLinks]; next[i] = { ...next[i], url: e.target.value }; setSocialLinks(next); }}
                    disabled={pending}
                    className={INPUT}
                    placeholder="https://..."
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Onglet Confidentialité ──────────────────────────────────────── */}
        <div className={activeTab === "confidentialite" ? "p-6 space-y-5" : "hidden"}>
          <div>
            <p className="text-[10px] font-bold tracking-widest text-faint uppercase mb-1">Visibilité du profil</p>
            <p className="text-xs text-faint mb-5">Choisissez qui peut voir votre profil public.</p>
          </div>

          <div className="bg-background border border-border-site rounded-lg p-4">
            <label className="flex items-center gap-4 cursor-pointer">
              <div className="relative shrink-0">
                <input
                  type="checkbox"
                  name="profile_public"
                  value="1"
                  checked={profilePublic}
                  onChange={(e) => setProfilePublic(e.target.checked)}
                  disabled={pending}
                  className="sr-only peer"
                />
                <div className="w-10 h-6 bg-surface border border-border-site rounded-full transition-colors peer-checked:bg-[#c8a32e]/20 peer-checked:border-[#c8a32e]/60 peer-disabled:opacity-40" />
                <div className="absolute top-1 left-1 w-4 h-4 bg-muted rounded-full transition-all peer-checked:translate-x-4 peer-checked:bg-[#c8a32e] peer-disabled:opacity-40" />
              </div>
              <div className="flex items-center gap-2">
                {profilePublic
                  ? <Eye    size={14} className="text-[#c8a32e]" />
                  : <EyeOff size={14} className="text-faint" />
                }
                <div>
                  <span className="text-sm font-bold text-foreground">
                    {profilePublic ? "Profil public" : "Profil privé"}
                  </span>
                  <p className="text-xs text-faint mt-0.5">
                    {profilePublic
                      ? "Tous les visiteurs peuvent voir votre profil."
                      : "Votre profil n'est visible que par vous."}
                  </p>
                </div>
              </div>
            </label>
          </div>

          <button
            type="button"
            onClick={() => setShowPreview(true)}
            className="inline-flex items-center gap-2 text-xs text-faint hover:text-[#c8a32e] transition-colors"
          >
            <Eye size={12} />
            {profilePublic ? "Voir mon profil public" : "Voir l'aperçu (profil privé)"}
          </button>

          <div className="border-t border-border-site pt-5">
            <DeleteAccountSection username={user.username} />
          </div>
        </div>

        {/* ── Onglet Sécurité ─────────────────────────────────────────────── */}
        <div className={activeTab === "securite" ? "p-6 space-y-5" : "hidden"}>
          <div>
            <p className="text-[10px] font-bold tracking-widest text-faint uppercase mb-1">Mot de passe</p>
            <p className="text-xs text-faint mb-5">Saisissez d&apos;abord votre mot de passe actuel pour en définir un nouveau.</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold tracking-wider text-muted uppercase">Mot de passe actuel</label>
              <input
                name="currentPassword"
                type="password"
                autoComplete="current-password"
                value={currentPwValue}
                onChange={(e) => setCurrentPwValue(e.target.value)}
                disabled={pending}
                className={INPUT}
                placeholder="••••••••"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-xs font-semibold tracking-wider text-muted uppercase">Nouveau mot de passe</label>
                <input
                  name="newPassword"
                  type="password"
                  autoComplete="new-password"
                  value={newPwValue}
                  onChange={(e) => setNewPwValue(e.target.value)}
                  disabled={pending || !canChangePassword}
                  className={INPUT}
                  placeholder={canChangePassword ? "Min. 12 caractères" : "Saisissez d'abord le mot de passe actuel"}
                />
                {newPwValue.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-faint font-medium">Force</span>
                      {STRENGTH && <span className={`font-bold ${STRENGTH.text}`}>{STRENGTH.label}</span>}
                    </div>
                    <div className="h-1.5 bg-surface-2 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-300 ${STRENGTH?.bar ?? ""}`} style={{ width: `${STRENGTH?.pct ?? 0}%` }} />
                    </div>
                    <ul className="space-y-1 pt-1">
                      {CONDITIONS.map((cond) => (
                        <li key={cond.label} className="flex items-center gap-1.5 text-[11px]">
                          {cond.met ? <Check size={11} className="text-emerald-400 shrink-0" /> : <X size={11} className="text-red-400/70 shrink-0" />}
                          <span className={cond.met ? "text-muted" : "text-faint"}>{cond.label}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold tracking-wider text-muted uppercase">Confirmer</label>
                <input
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPwValue}
                  onChange={(e) => setConfirmPwValue(e.target.value)}
                  disabled={pending || !canChangePassword}
                  className={INPUT}
                  placeholder="••••••••"
                />
                {confirmPwValue.length > 0 && (
                  <p className={`flex items-center gap-1.5 text-[11px] ${passwordsMatch ? "text-emerald-400" : "text-red-400"}`}>
                    {passwordsMatch
                      ? <><Check size={11} />Les mots de passe correspondent</>
                      : <><X    size={11} />Les mots de passe ne correspondent pas</>
                    }
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div>
        <button
          type="submit"
          disabled={pending}
          className="flex items-center gap-2 bg-[#c8a32e] hover:bg-[#b8922a] disabled:opacity-60 disabled:cursor-not-allowed text-[#080e1a] font-bold text-sm tracking-wider px-6 py-3 rounded transition-colors"
        >
          <Save size={15} />
          {pending ? "Enregistrement…" : "ENREGISTRER"}
        </button>
      </div>

      {/* Modale aperçu profil public */}
      {showPreview && <ProfilePreviewModal
        user={user}
        displayName={displayNameValue}
        avatar={avatarValue}
        bio={bioValue}
        location={locationValue}
        socialLinks={socialLinks}
        profilePublic={profilePublic}
        onClose={() => setShowPreview(false)}
      />}
    </form>
  );
}

// ─── Constantes pour la modale ────────────────────────────────────────────────

const ROLE_BADGE: Record<string, { label: string; cls: string }> = {
  admin:  { label: "Administrateur", cls: "text-amber-400 bg-amber-900/20 border-amber-800/40" },
  editor: { label: "Éditeur",         cls: "text-blue-400  bg-blue-900/20  border-blue-800/40"  },
  member: { label: "Membre",          cls: "text-faint     bg-surface-2    border-border-site"   },
};

const SOCIAL_LABEL: Record<string, string> = {
  twitch: "Twitch", youtube: "YouTube", twitter: "Twitter / X",
  discord: "Discord", steam: "Steam", tiktok: "TikTok",
  instagram: "Instagram", github: "GitHub", site_web: "Site web",
};

// ─── Modale ───────────────────────────────────────────────────────────────────

interface PreviewProps {
  user:          import("@/lib/db").User;
  displayName:   string;
  avatar:        string;
  bio:           string;
  location:      string;
  socialLinks:   { type: string; url: string }[];
  profilePublic: boolean;
  onClose:       () => void;
}

function ProfilePreviewModal({ user, displayName, avatar, bio, location, socialLinks, profilePublic, onClose }: PreviewProps) {
  const badge    = ROLE_BADGE[user.role] ?? ROLE_BADGE.member;
  const initials = (displayName || user.username).slice(0, 2).toUpperCase();
  const joinDate = new Date(user.createdAt).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-[2px] p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-surface border border-border-site rounded-xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col">
        {/* Header modale */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-site shrink-0">
          <div>
            <p className="text-sm font-bold text-foreground">Aperçu du profil</p>
            <p className="text-xs text-faint mt-0.5">
              {profilePublic ? "Visible par tous les visiteurs" : "Profil privé — visible uniquement par vous"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-faint hover:text-foreground hover:bg-surface-2 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Contenu scrollable */}
        <div className="overflow-y-auto p-5 space-y-4">
          {/* Carte identité */}
          <div className="bg-surface-2 border border-border-site rounded-xl p-5 flex items-start gap-5">
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-border-site bg-surface flex items-center justify-center shrink-0">
              {avatar
                ? <img src={avatar} alt={displayName} className="w-full h-full object-cover" />
                : <span className="text-xl font-bold text-muted">{initials}</span>
              }
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-base font-black tracking-tight text-foreground">
                  {displayName || user.username}
                </span>
                <span className={`text-[10px] font-bold tracking-wider px-2 py-0.5 rounded border ${badge.cls}`}>
                  {badge.label}
                </span>
                {!profilePublic && (
                  <span className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded border text-faint bg-surface border-border-site flex items-center gap-1">
                    <Lock size={9} /> Privé
                  </span>
                )}
              </div>
              <p className="text-faint text-xs">@{user.username}</p>
              <p className="text-faint text-[11px] mt-1 flex items-center gap-1">
                <Calendar size={10} /> Membre depuis {joinDate}
              </p>
            </div>
          </div>

          {!profilePublic ? (
            <div className="bg-surface-2 border border-border-site rounded-xl p-8 text-center">
              <Lock size={24} className="text-faint mx-auto mb-2" />
              <p className="font-bold text-foreground text-sm mb-1">Ce profil est privé</p>
              <p className="text-faint text-xs">Voici ce que voient les autres membres.</p>
            </div>
          ) : (
            <>
              {bio && (
                <div className="bg-surface-2 border border-border-site rounded-xl p-5">
                  <p className="text-[10px] font-bold tracking-widest text-faint uppercase mb-2">À propos</p>
                  <p className="text-muted text-sm leading-relaxed whitespace-pre-line">{bio}</p>
                </div>
              )}

              {location && (
                <div className="bg-surface-2 border border-border-site rounded-xl px-5 py-3 flex items-center gap-2">
                  <MapPin size={13} className="text-faint shrink-0" />
                  <span className="text-muted text-sm">{location}</span>
                </div>
              )}

              {socialLinks.filter(l => l.type && l.url).length > 0 && (
                <div className="bg-surface-2 border border-border-site rounded-xl p-5">
                  <p className="text-[10px] font-bold tracking-widest text-faint uppercase mb-3">Liens</p>
                  <div className="space-y-2">
                    {socialLinks.filter(l => l.type && l.url).map((link, i) => (
                      <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 group">
                        <span className="w-20 shrink-0 text-[11px] font-semibold text-faint">
                          {SOCIAL_LABEL[link.type] ?? link.type}
                        </span>
                        <span className="text-muted group-hover:text-[#c8a32e] transition-colors text-xs truncate flex items-center gap-1">
                          <Globe size={10} className="text-faint shrink-0" />
                          {link.url}
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {!bio && !location && socialLinks.filter(l => l.type && l.url).length === 0 && (
                <div className="bg-surface-2 border border-border-site rounded-xl p-8 text-center">
                  <p className="text-faint text-sm">Aucune information renseignée.</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

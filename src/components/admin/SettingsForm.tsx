"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { updateSettingsAction } from "@/app/actions/articles";
import { Save, CheckCircle, AlertCircle, TriangleAlert, X, Settings2, LayoutGrid, Wrench } from "lucide-react";
import DateTimePicker from "@/components/admin/DateTimePicker";
import type { SiteSettings } from "@/lib/db";
import { GAME_NAV_ITEMS, SECTION_NAV_ITEMS, type GameId, type SectionId } from "@/lib/nav-items";

interface Props {
  initialSettings: SiteSettings;
}

type Tab = "general" | "navigation" | "maintenance";

const TABS: { id: Tab; label: string; Icon: React.ElementType }[] = [
  { id: "general",     label: "Général",     Icon: Settings2  },
  { id: "navigation",  label: "Navigation",  Icon: LayoutGrid },
  { id: "maintenance", label: "Maintenance", Icon: Wrench     },
];

const FEATURES: { key: "feature_news" | "feature_guides" | "feature_community"; sectionId: SectionId; label: string }[] = [
  { key: "feature_news",      sectionId: "news",      label: "Actualités" },
  { key: "feature_guides",    sectionId: "guides",    label: "Guides" },
  { key: "feature_community", sectionId: "community", label: "Communauté" },
];

const GAME_FEATURES: { key: "feature_game_aoe2" | "feature_game_aoe3" | "feature_game_aoe4" | "feature_game_aom"; gameId: GameId; label: string }[] = [
  { key: "feature_game_aoe2", gameId: "aoe2", label: "AoE II: DE"   },
  { key: "feature_game_aoe3", gameId: "aoe3", label: "AoE III: DE"  },
  { key: "feature_game_aoe4", gameId: "aoe4", label: "AoE IV"       },
  { key: "feature_game_aom",  gameId: "aom",  label: "AoM: Retold"  },
];

const INPUT = "w-full bg-background border border-border-site focus:border-[#c8a32e] focus:outline-none rounded px-4 py-3 text-foreground placeholder-faint text-sm transition-colors disabled:opacity-60";

function Toggle({ name, defaultChecked, disabled }: { name: string; defaultChecked: boolean; disabled: boolean }) {
  return (
    <div className="relative shrink-0">
      <input type="checkbox" name={name} value="1" defaultChecked={defaultChecked} disabled={disabled} className="sr-only peer" />
      <div className="w-10 h-6 bg-background border border-border-site rounded-full transition-colors peer-checked:bg-[#c8a32e]/20 peer-checked:border-[#c8a32e]/60 peer-disabled:opacity-40" />
      <div className="absolute top-1 left-1 w-4 h-4 bg-muted rounded-full transition-all peer-checked:translate-x-4 peer-checked:bg-[#c8a32e] peer-disabled:opacity-40" />
    </div>
  );
}

export default function SettingsForm({ initialSettings }: Props) {
  const [state, action, pending] = useActionState(updateSettingsAction, undefined);

  const maintenanceActive = initialSettings.maintenance.active;
  const [endAt, setEndAt]         = useState(initialSettings.maintenance.endAt ?? "");
  const [showSuccess, setShowSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("general");
  const prevPendingRef = useRef(false);

  useEffect(() => {
    if (state?.success) {
      setShowSuccess(true);
      const id = setTimeout(() => setShowSuccess(false), 10_000);
      return () => clearTimeout(id);
    }
  }, [state]);

  useEffect(() => {
    if (!pending && prevPendingRef.current) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    prevPendingRef.current = pending;
  }, [pending]);

  return (
    <form action={action} className="space-y-5">

      {/* Bannière maintenance active */}
      {maintenanceActive && (
        <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/40 rounded-lg px-5 py-4 text-red-400">
          <TriangleAlert size={18} className="shrink-0" />
          <div>
            <p className="font-bold text-sm">Le site est actuellement en maintenance</p>
            <p className="text-xs text-red-400/80 mt-0.5">Seuls les administrateurs peuvent accéder au site.</p>
          </div>
        </div>
      )}

      {/* Notifications */}
      {showSuccess && (
        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 rounded px-4 py-3 text-emerald-400 text-sm">
          <CheckCircle size={15} />
          Paramètres enregistrés avec succès.
        </div>
      )}
      {state?.error && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded px-4 py-3 text-red-400 text-sm">
          <AlertCircle size={15} />
          {state.error}
        </div>
      )}

      {/* Onglets */}
      <div className="bg-surface border border-border-site rounded-lg overflow-hidden">
        {/* Tab bar */}
        <div className="flex border-b border-border-site">
          {TABS.map(({ id, label, Icon }) => {
            const isActive = activeTab === id;
            const hasBadge = id === "maintenance" && maintenanceActive;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={`relative flex items-center gap-2 px-5 py-3.5 text-sm font-semibold transition-colors border-b-2 -mb-px ${
                  isActive
                    ? "border-[#c8a32e] text-[#c8a32e]"
                    : "border-transparent text-faint hover:text-muted"
                }`}
              >
                <Icon size={14} />
                {label}
                {hasBadge && (
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 absolute top-3 right-3" />
                )}
              </button>
            );
          })}
        </div>

        {/* ── Général ───────────────────────────────────────────────── */}
        <div className={activeTab === "general" ? "p-6 space-y-6" : "hidden"}>
          <div className="space-y-5">
            <div>
              <p className="text-[10px] font-bold tracking-widest text-faint uppercase mb-4">Identité du site</p>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold tracking-wider text-muted uppercase">
                  Nom du site
                </label>
                <input
                  name="siteName"
                  type="text"
                  defaultValue={initialSettings.siteName}
                  disabled={pending}
                  className={INPUT}
                />
              </div>
            </div>

            <div className="border-t border-border-site pt-5">
              <p className="text-[10px] font-bold tracking-widest text-faint uppercase mb-4">Discord</p>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold tracking-wider text-muted uppercase">
                  Lien d&apos;invitation <span className="text-red-400">*</span>
                </label>
                <input
                  name="discordInvite"
                  type="text"
                  defaultValue={initialSettings.discordInvite}
                  disabled={pending}
                  placeholder="https://discord.gg/xxxxxx"
                  className={INPUT}
                />
                <p className="text-xs text-faint">Utilisé sur tous les boutons Discord du site.</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Navigation ────────────────────────────────────────────── */}
        <div className={activeTab === "navigation" ? "p-6 space-y-8" : "hidden"}>

          {/* Sections */}
          <div>
            <p className="text-[10px] font-bold tracking-widest text-faint uppercase mb-1">Sections</p>
            <p className="text-xs text-faint mb-5">Désactiver une section la retire du menu. Choisissez aussi les pages visibles dans son menu déroulant.</p>
            <div className="space-y-5">
              {FEATURES.map(({ key, sectionId, label }) => {
                const enabled      = initialSettings.features[sectionId];
                const enabledItems = initialSettings.navItems[sectionId];
                return (
                  <div key={key} className="bg-background border border-border-site rounded-lg p-4 space-y-3">
                    <label className="flex items-center gap-4 cursor-pointer">
                      <Toggle name={key} defaultChecked={enabled} disabled={pending} />
                      <span className="text-sm font-bold text-foreground">{label}</span>
                    </label>
                    {SECTION_NAV_ITEMS[sectionId].length > 0 && (
                      <div className="ml-14 flex flex-wrap gap-2">
                        {SECTION_NAV_ITEMS[sectionId].map((item) => (
                          <label
                            key={item.key}
                            className="flex items-center gap-2 px-3 py-1.5 border border-border-site rounded cursor-pointer hover:border-[#c8a32e]/40 transition-colors has-[:checked]:border-[#c8a32e]/60 has-[:checked]:bg-[#c8a32e]/5"
                          >
                            <input
                              type="checkbox"
                              name={`navbar_items_${sectionId}`}
                              value={item.key}
                              defaultChecked={enabledItems.includes(item.key)}
                              disabled={pending}
                              className="accent-[#c8a32e] w-3.5 h-3.5"
                            />
                            <span className="text-xs font-medium text-foreground">{item.label}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Jeux */}
          <div className="border-t border-border-site pt-6">
            <p className="text-[10px] font-bold tracking-widest text-faint uppercase mb-1">Jeux</p>
            <p className="text-xs text-faint mb-5">Désactiver un jeu le retire de la navbar et de la section « Nos univers ».</p>
            <div className="space-y-5">
              {GAME_FEATURES.map(({ key, gameId, label }) => {
                const enabled      = initialSettings.features.games[gameId];
                const enabledItems = initialSettings.navItems[gameId];
                return (
                  <div key={key} className="bg-background border border-border-site rounded-lg p-4 space-y-3">
                    <label className="flex items-center gap-4 cursor-pointer">
                      <Toggle name={key} defaultChecked={enabled} disabled={pending} />
                      <span className="text-sm font-bold text-foreground">{label}</span>
                    </label>
                    {GAME_NAV_ITEMS[gameId].length > 0 && (
                      <div className="ml-14 flex flex-wrap gap-2">
                        {GAME_NAV_ITEMS[gameId].map((item) => (
                          <label
                            key={item.key}
                            className="flex items-center gap-2 px-3 py-1.5 border border-border-site rounded cursor-pointer hover:border-[#c8a32e]/40 transition-colors has-[:checked]:border-[#c8a32e]/60 has-[:checked]:bg-[#c8a32e]/5"
                          >
                            <input
                              type="checkbox"
                              name={`navbar_items_${gameId}`}
                              value={item.key}
                              defaultChecked={enabledItems.includes(item.key)}
                              disabled={pending}
                              className="accent-[#c8a32e] w-3.5 h-3.5"
                            />
                            <span className="text-xs font-medium text-foreground">{item.label}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Maintenance ───────────────────────────────────────────── */}
        <div className={activeTab === "maintenance" ? "p-6 space-y-6" : "hidden"}>
          <div>
            <p className="text-[10px] font-bold tracking-widest text-faint uppercase mb-1">Mode maintenance</p>
            <p className="text-xs text-faint mb-5">
              Quand activée, seuls les administrateurs peuvent accéder au site. Les autres visiteurs voient la page de maintenance.
            </p>
          </div>

          {/* Toggle */}
          <div className={`bg-background border rounded-lg p-4 ${maintenanceActive ? "border-red-500/40" : "border-border-site"}`}>
            <label className="flex items-center gap-4 cursor-pointer">
              <div className="relative shrink-0">
                <input
                  type="checkbox"
                  name="maintenance_mode"
                  value="1"
                  defaultChecked={maintenanceActive}
                  disabled={pending}
                  className="sr-only peer"
                />
                <div className="w-10 h-6 bg-surface border border-border-site rounded-full transition-colors peer-checked:bg-red-500/20 peer-checked:border-red-500/60 peer-disabled:opacity-40" />
                <div className="absolute top-1 left-1 w-4 h-4 bg-muted rounded-full transition-all peer-checked:translate-x-4 peer-checked:bg-red-500 peer-disabled:opacity-40" />
              </div>
              <div>
                <span className="text-sm font-bold text-foreground">Activer la maintenance</span>
                <p className="text-xs text-faint mt-0.5">Le site sera inaccessible au public</p>
              </div>
            </label>
          </div>

          {/* Message */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold tracking-wider text-muted uppercase">
              Message affiché aux visiteurs
            </label>
            <textarea
              name="maintenance_message"
              rows={3}
              defaultValue={initialSettings.maintenance.message}
              disabled={pending}
              placeholder="Le site est actuellement en maintenance. Nous revenons très bientôt !"
              className="w-full bg-background border border-border-site focus:border-[#c8a32e] focus:outline-none rounded px-4 py-3 text-foreground placeholder-faint text-sm transition-colors disabled:opacity-60 resize-none"
            />
            <p className="text-xs text-faint">Laissez vide pour utiliser le message par défaut.</p>
          </div>

          {/* Compte à rebours */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold tracking-wider text-muted uppercase">
                Retour estimé <span className="normal-case font-normal text-faint">(optionnel)</span>
              </label>
              {endAt && (
                <button
                  type="button"
                  onClick={() => setEndAt("")}
                  className="flex items-center gap-1 text-faint hover:text-red-400 text-[11px] font-medium transition-colors"
                >
                  <X size={11} /> Effacer
                </button>
              )}
            </div>
            <input type="hidden" name="maintenance_end" value={endAt} />
            <DateTimePicker value={endAt} onChange={setEndAt} minDate={new Date()} disabled={pending} />
            <p className="text-xs text-faint">
              Si renseigné, un compte à rebours s&apos;affiche sur la page de maintenance.
            </p>
          </div>
        </div>
      </div>

      {/* Bouton enregistrer */}
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
    </form>
  );
}

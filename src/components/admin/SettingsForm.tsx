"use client";

import { useActionState } from "react";
import { updateSettingsAction } from "@/app/actions/articles";
import { Save, CheckCircle, AlertCircle } from "lucide-react";
import type { SiteSettings } from "@/lib/db";
import { GAME_NAV_ITEMS, SECTION_NAV_ITEMS, type GameId, type SectionId } from "@/lib/nav-items";

interface Props {
  initialSettings: SiteSettings;
}

const FEATURES: { key: "feature_news" | "feature_guides" | "feature_community"; sectionId: SectionId; label: string }[] = [
  { key: "feature_news",      sectionId: "news",      label: "Actualités" },
  { key: "feature_guides",    sectionId: "guides",    label: "Guides" },
  { key: "feature_community", sectionId: "community", label: "Communauté" },
];

const GAME_FEATURES: { key: "feature_game_aoe2" | "feature_game_aoe3" | "feature_game_aoe4" | "feature_game_aom"; gameId: GameId; label: string }[] = [
  { key: "feature_game_aoe2", gameId: "aoe2", label: "AoE II: DE" },
  { key: "feature_game_aoe3", gameId: "aoe3", label: "AoE III: DE" },
  { key: "feature_game_aoe4", gameId: "aoe4", label: "AoE IV" },
  { key: "feature_game_aom",  gameId: "aom",  label: "AoM: Retold" },
];

function featureEnabled(settings: SiteSettings, sectionId: SectionId): boolean {
  return settings.features[sectionId];
}

function gameEnabled(settings: SiteSettings, gameId: GameId): boolean {
  return settings.features.games[gameId];
}

const INPUT = "w-full bg-background border border-border-site focus:border-[#c8a32e] focus:outline-none rounded px-4 py-3 text-foreground placeholder-faint text-sm transition-colors disabled:opacity-60";

export default function SettingsForm({ initialSettings }: Props) {
  const [state, action, pending] = useActionState(updateSettingsAction, undefined);

  return (
    <form action={action} className="space-y-6">
      {state?.success && (
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

      {/* Général */}
      <div className="bg-surface border border-border-site rounded-lg p-6 space-y-5">
        <h2 className="font-bold text-foreground text-sm tracking-wide border-b border-border-site pb-4">
          Général
        </h2>
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

      {/* Discord */}
      <div className="bg-surface border border-border-site rounded-lg p-6 space-y-5">
        <h2 className="font-bold text-foreground text-sm tracking-wide border-b border-border-site pb-4">
          Discord
        </h2>
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold tracking-wider text-muted uppercase">
            Lien d&apos;invitation Discord <span className="text-red-400">*</span>
          </label>
          <input
            name="discordInvite"
            type="text"
            defaultValue={initialSettings.discordInvite}
            disabled={pending}
            placeholder="https://discord.gg/xxxxxx"
            className={INPUT}
          />
          <p className="text-xs text-faint">
            Ce lien est utilisé sur tous les boutons Discord du site.
          </p>
        </div>
      </div>

      {/* Modules */}
      <div className="bg-surface border border-border-site rounded-lg p-6 space-y-6">
        <div className="border-b border-border-site pb-4">
          <h2 className="font-bold text-foreground text-sm tracking-wide">Modules</h2>
          <p className="text-xs text-faint mt-1">
            Désactiver un module le retire du menu. Vous pouvez aussi choisir quelles pages apparaissent dans son menu déroulant.
          </p>
        </div>
        <div className="space-y-6">
          {FEATURES.map(({ key, sectionId, label }) => {
            const enabled      = featureEnabled(initialSettings, sectionId);
            const enabledItems = initialSettings.navItems[sectionId];
            return (
              <div key={key} className="space-y-3">
                <label className="flex items-center gap-4 cursor-pointer">
                  <div className="relative shrink-0">
                    <input type="checkbox" name={key} value="1" defaultChecked={enabled} disabled={pending} className="sr-only peer" />
                    <div className="w-10 h-6 bg-background border border-border-site rounded-full transition-colors peer-checked:bg-[#c8a32e]/20 peer-checked:border-[#c8a32e]/60 peer-disabled:opacity-40" />
                    <div className="absolute top-1 left-1 w-4 h-4 bg-muted rounded-full transition-all peer-checked:translate-x-4 peer-checked:bg-[#c8a32e] peer-disabled:opacity-40" />
                  </div>
                  <span className="text-sm font-bold text-foreground">{label}</span>
                </label>
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
              </div>
            );
          })}
        </div>
      </div>

      {/* Jeux */}
      <div className="bg-surface border border-border-site rounded-lg p-6 space-y-6">
        <div className="border-b border-border-site pb-4">
          <h2 className="font-bold text-foreground text-sm tracking-wide">Jeux</h2>
          <p className="text-xs text-faint mt-1">
            Désactiver un jeu le retire de la navbar et de la section « Nos univers ». Vous pouvez aussi choisir quelles pages apparaissent dans son menu déroulant.
          </p>
        </div>
        <div className="space-y-6">
          {GAME_FEATURES.map(({ key, gameId, label }) => {
            const enabled = gameEnabled(initialSettings, gameId);
            const enabledItems = initialSettings.navItems[gameId];
            return (
              <div key={key} className="space-y-3">
                {/* Toggle jeu */}
                <label className="flex items-center gap-4 cursor-pointer">
                  <div className="relative shrink-0">
                    <input type="checkbox" name={key} value="1" defaultChecked={enabled} disabled={pending} className="sr-only peer" />
                    <div className="w-10 h-6 bg-background border border-border-site rounded-full transition-colors peer-checked:bg-[#c8a32e]/20 peer-checked:border-[#c8a32e]/60 peer-disabled:opacity-40" />
                    <div className="absolute top-1 left-1 w-4 h-4 bg-muted rounded-full transition-all peer-checked:translate-x-4 peer-checked:bg-[#c8a32e] peer-disabled:opacity-40" />
                  </div>
                  <span className="text-sm font-bold text-foreground">{label}</span>
                </label>
                {/* Items du dropdown */}
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
              </div>
            );
          })}
        </div>
      </div>

      <div className="pt-1">
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

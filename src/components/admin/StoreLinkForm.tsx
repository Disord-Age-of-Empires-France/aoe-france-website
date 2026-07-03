"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Save, AlertCircle, ArrowLeft } from "lucide-react";
import type { StoreLink, StoreType } from "@/lib/db";

const GAMES = [
  { value: "aoe2", label: "AoE II: DE" },
  { value: "aoe3", label: "AoE III: DE" },
  { value: "aoe4", label: "AoE IV" },
  { value: "aom",  label: "AoM: Retold" },
];

const STORE_TYPES: { value: StoreType; label: string }[] = [
  { value: "steam",     label: "Steam" },
  { value: "xbox",      label: "Xbox / Microsoft Store" },
  { value: "ms_store",  label: "Microsoft Store (PC)" },
  { value: "ps_store",  label: "PlayStation Store" },
  { value: "game_pass", label: "Xbox Game Pass" },
  { value: "other",     label: "Autre (affilié, revendeur…)" },
];

const INPUT = "w-full bg-background border border-border-site focus:border-[#c8a32e] focus:outline-none rounded px-4 py-3 text-foreground placeholder-faint text-sm transition-colors disabled:opacity-60";
const LABEL = "block text-xs font-semibold tracking-wider text-muted uppercase mb-1.5";

interface Props {
  action: (prev: unknown, formData: FormData) => Promise<{ error?: string } | undefined>;
  link?: StoreLink;
  mode: "create" | "edit";
  defaultGame?: string;
}

function Toggle({ name, label, sub, defaultChecked, disabled }: { name: string; label: string; sub?: string; defaultChecked: boolean; disabled: boolean }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <div className="relative shrink-0">
        <input type="checkbox" name={name} value="1" defaultChecked={defaultChecked} disabled={disabled} className="sr-only peer" />
        <div className="w-10 h-6 bg-background border border-border-site rounded-full transition-colors peer-checked:bg-[#c8a32e]/20 peer-checked:border-[#c8a32e]/60 peer-disabled:opacity-40" />
        <div className="absolute top-1 left-1 w-4 h-4 bg-muted rounded-full transition-all peer-checked:translate-x-4 peer-checked:bg-[#c8a32e] peer-disabled:opacity-40" />
      </div>
      <div>
        <span className="text-sm font-bold text-foreground">{label}</span>
        {sub && <p className="text-xs text-faint">{sub}</p>}
      </div>
    </label>
  );
}

export default function StoreLinkForm({ action, link, mode, defaultGame }: Props) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="space-y-5">
      {state?.error && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded px-4 py-3 text-red-400 text-sm">
          <AlertCircle size={15} /> {state.error}
        </div>
      )}

      <div className="bg-surface border border-border-site rounded-xl p-6 space-y-6">

        {/* Jeu + Store */}
        <div>
          <p className="text-[10px] font-bold tracking-widest text-faint uppercase mb-5">Identification</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={LABEL}>Jeu <span className="text-red-400">*</span></label>
              <select name="game" defaultValue={link?.game ?? defaultGame ?? "aoe4"} disabled={pending} className={INPUT + " cursor-pointer"}>
                {GAMES.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
              </select>
            </div>
            <div>
              <label className={LABEL}>Type de store <span className="text-red-400">*</span></label>
              <select name="storeType" defaultValue={link?.storeType ?? "steam"} disabled={pending} className={INPUT + " cursor-pointer"}>
                {STORE_TYPES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>
          <div className="mt-4">
            <label className={LABEL}>Nom affiché <span className="text-red-400">*</span></label>
            <input name="storeName" type="text" required defaultValue={link?.storeName} disabled={pending}
              placeholder="ex: Steam, Instant Gaming, Xbox Game Pass…" className={INPUT} />
            <p className="text-xs text-faint mt-1">Nom visible par les utilisateurs sur la page boutique.</p>
          </div>
        </div>

        {/* URL */}
        <div className="border-t border-border-site pt-5">
          <p className="text-[10px] font-bold tracking-widest text-faint uppercase mb-5">Lien</p>
          <div>
            <label className={LABEL}>URL <span className="text-red-400">*</span></label>
            <input name="url" type="url" required defaultValue={link?.url} disabled={pending}
              placeholder="https://store.steampowered.com/app/..." className={INPUT} />
          </div>
        </div>

        {/* Prix */}
        <div className="border-t border-border-site pt-5">
          <p className="text-[10px] font-bold tracking-widest text-faint uppercase mb-2">Prix</p>
          <p className="text-xs text-faint mb-4">
            Pour Steam, le prix est récupéré automatiquement. Pour les autres stores, renseignez-le manuellement.
            Ce champ est aussi utilisé comme fallback si l'API Steam est indisponible.
          </p>
          <div>
            <label className={LABEL}>Prix affiché</label>
            <input name="priceDisplay" type="text" defaultValue={link?.priceDisplay} disabled={pending}
              placeholder="ex: 59,99€ — Inclus Game Pass — Gratuit" className={INPUT} />
          </div>
        </div>

        {/* Badges et options */}
        <div className="border-t border-border-site pt-5">
          <p className="text-[10px] font-bold tracking-widest text-faint uppercase mb-5">Badges & options</p>
          <div className="space-y-4">
            <div>
              <label className={LABEL}>Badge manuel</label>
              <input name="badge" type="text" defaultValue={link?.badge} disabled={pending}
                placeholder="ex: Officiel, Meilleur prix, DLC inclus…" className={INPUT} />
              <p className="text-xs text-faint mt-1">Affiché en surimpression sur la carte. Laissez vide pour ne pas en afficher.</p>
            </div>
            <div className="grid sm:grid-cols-3 gap-4 pt-2">
              <Toggle name="isAffiliate" label="Lien affilié" sub="Affiche un badge * partenaire" defaultChecked={link?.isAffiliate ?? false} disabled={pending} />
              <Toggle name="isGamePass"  label="Game Pass"    sub="Affiche le badge Game Pass"   defaultChecked={link?.isGamePass  ?? false} disabled={pending} />
              <Toggle name="active"      label="Actif"        sub="Visible sur le site public"   defaultChecked={link ? link.active : true} disabled={pending} />
            </div>
          </div>
        </div>

        {/* Ordre */}
        <div className="border-t border-border-site pt-5">
          <label className={LABEL}>Ordre d&apos;affichage</label>
          <input name="position" type="number" min="0" defaultValue={link?.position ?? 0} disabled={pending} className={INPUT} />
          <p className="text-xs text-faint mt-1">Plus petit = affiché en premier (Steam officiel en 0, affiliés après).</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending}
          className="flex items-center gap-2 bg-[#c8a32e] hover:bg-[#b8922a] disabled:opacity-60 disabled:cursor-not-allowed text-[#080e1a] font-bold text-sm tracking-wider px-6 py-3 rounded transition-colors">
          <Save size={15} />
          {pending ? "Enregistrement…" : mode === "create" ? "CRÉER" : "ENREGISTRER"}
        </button>
        <Link href="/admin/store" className="px-5 py-3 rounded border border-border-site text-faint text-sm font-medium hover:text-foreground transition-colors flex items-center gap-2">
          <ArrowLeft size={14} /> Annuler
        </Link>
      </div>
    </form>
  );
}

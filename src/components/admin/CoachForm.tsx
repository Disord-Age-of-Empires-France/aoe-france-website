"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Save, AlertCircle, ArrowLeft } from "lucide-react";
import type { Coach } from "@/lib/db";

const AOE4_CIVS = [
  "Anglais", "Français", "Mongols", "Chinois", "Sultanat de Delhi", "Rus",
  "Abbassides", "Sacré-Empire", "Ottomans", "Maliens", "Byzantins",
  "Japonais", "Ordre du Dragon", "Héritage de Zhu Xi", "Ayyoubides", "Seldjoukides",
];

const AOE4_RANKS = [
  "Bronze I", "Bronze II", "Bronze III",
  "Silver I", "Silver II", "Silver III",
  "Gold I", "Gold II", "Gold III",
  "Platinum I", "Platinum II", "Platinum III",
  "Diamond I", "Diamond II", "Diamond III",
  "Conqueror I", "Conqueror II", "Conqueror III",
];

const INPUT  = "w-full bg-background border border-border-site focus:border-[#c8a32e] focus:outline-none rounded px-4 py-3 text-foreground placeholder-faint text-sm transition-colors disabled:opacity-60";
const LABEL  = "block text-xs font-semibold tracking-wider text-muted uppercase mb-1.5";

interface Props {
  action: (prev: unknown, formData: FormData) => Promise<{ error?: string } | undefined>;
  coach?: Coach;
  mode: "create" | "edit";
}

export default function CoachForm({ action, coach, mode }: Props) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="space-y-5">
      {state?.error && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded px-4 py-3 text-red-400 text-sm">
          <AlertCircle size={15} /> {state.error}
        </div>
      )}

      <div className="bg-surface border border-border-site rounded-xl p-6 space-y-6">

        {/* Identité */}
        <div>
          <p className="text-[10px] font-bold tracking-widest text-faint uppercase mb-5">Identité</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={LABEL}>Pseudo AoE <span className="text-red-400">*</span></label>
              <input name="pseudoAoe" type="text" required defaultValue={coach?.pseudoAoe} disabled={pending} placeholder="ex: Dirtus" className={INPUT} />
            </div>
            <div>
              <label className={LABEL}>Nom Discord <span className="text-red-400">*</span></label>
              <input name="discordName" type="text" required defaultValue={coach?.discordName} disabled={pending} placeholder="ex: dirtus#0001" className={INPUT} />
            </div>
          </div>
        </div>

        {/* Niveau */}
        <div className="border-t border-border-site pt-5">
          <p className="text-[10px] font-bold tracking-widest text-faint uppercase mb-5">Niveau</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={LABEL}>Rang</label>
              <select name="rank" defaultValue={coach?.rank ?? ""} disabled={pending}
                className={INPUT + " cursor-pointer"}>
                <option value="">— Sélectionner —</option>
                {AOE4_RANKS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className={LABEL}>ELO</label>
              <input name="elo" type="number" min="0" max="9999" defaultValue={coach?.elo || ""} disabled={pending} placeholder="ex: 2150" className={INPUT} />
            </div>
          </div>
        </div>

        {/* Civilisations */}
        <div className="border-t border-border-site pt-5">
          <p className="text-[10px] font-bold tracking-widest text-faint uppercase mb-3">Civilisations jouées</p>
          <div className="flex flex-wrap gap-2">
            {AOE4_CIVS.map(civ => (
              <label key={civ} className="flex items-center gap-2 px-3 py-1.5 border border-border-site rounded cursor-pointer hover:border-[#c8a32e]/40 transition-colors has-[:checked]:border-[#c8a32e]/60 has-[:checked]:bg-[#c8a32e]/5">
                <input
                  type="checkbox"
                  name="civilizations"
                  value={civ}
                  defaultChecked={coach?.civilizations.includes(civ)}
                  disabled={pending}
                  className="accent-[#c8a32e] w-3.5 h-3.5"
                />
                <span className="text-xs font-medium text-foreground">{civ}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Coaching */}
        <div className="border-t border-border-site pt-5">
          <p className="text-[10px] font-bold tracking-widest text-faint uppercase mb-5">Coaching</p>
          <div className="space-y-4">
            <div>
              <label className={LABEL}>Format de coaching</label>
              <textarea name="coachingFormat" rows={2} defaultValue={coach?.coachingFormat} disabled={pending}
                placeholder="ex: Sessions 1h en direct, analyse de replays, suivi personnalisé"
                className="w-full bg-background border border-border-site focus:border-[#c8a32e] focus:outline-none rounded px-4 py-3 text-foreground placeholder-faint text-sm transition-colors disabled:opacity-60 resize-none"
              />
            </div>
            <div>
              <label className={LABEL}>Expérience AoE</label>
              <textarea name="experience" rows={2} defaultValue={coach?.experience} disabled={pending}
                placeholder="ex: 5 ans de jeu compétitif, top 100 classement mondial Saison 10"
                className="w-full bg-background border border-border-site focus:border-[#c8a32e] focus:outline-none rounded px-4 py-3 text-foreground placeholder-faint text-sm transition-colors disabled:opacity-60 resize-none"
              />
            </div>
            <div>
              <label className={LABEL}>Prix</label>
              <input name="price" type="text" defaultValue={coach?.price} disabled={pending}
                placeholder="ex: 15€/h — Sur demande" className={INPUT} />
            </div>
          </div>
        </div>

        {/* Liens & médias */}
        <div className="border-t border-border-site pt-5">
          <p className="text-[10px] font-bold tracking-widest text-faint uppercase mb-5">Liens & médias</p>
          <div className="space-y-4">
            <div>
              <label className={LABEL}>Lien AoE 4 World</label>
              <input name="aoeWorldLink" type="url" defaultValue={coach?.aoeWorldLink} disabled={pending}
                placeholder="https://aoe4world.com/players/..." className={INPUT} />
            </div>
            <div>
              <label className={LABEL}>Avatar (URL)</label>
              <input name="avatar" type="url" defaultValue={coach?.avatar} disabled={pending}
                placeholder="https://..." className={INPUT} />
              <p className="text-xs text-faint mt-1">Photo ou avatar du coach. Laissez vide pour utiliser les initiales.</p>
            </div>
          </div>
        </div>

        {/* Options */}
        <div className="border-t border-border-site pt-5">
          <p className="text-[10px] font-bold tracking-widest text-faint uppercase mb-5">Options</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={LABEL}>Ordre d&apos;affichage</label>
              <input name="position" type="number" min="0" defaultValue={coach?.position ?? 0} disabled={pending} className={INPUT} />
              <p className="text-xs text-faint mt-1">Plus petit = affiché en premier.</p>
            </div>
            <div className="flex flex-col justify-center">
              <label className="flex items-center gap-3 cursor-pointer">
                <div className="relative shrink-0">
                  <input type="checkbox" name="active" value="1" defaultChecked={coach ? coach.active : true} disabled={pending} className="sr-only peer" />
                  <div className="w-10 h-6 bg-background border border-border-site rounded-full transition-colors peer-checked:bg-[#c8a32e]/20 peer-checked:border-[#c8a32e]/60 peer-disabled:opacity-40" />
                  <div className="absolute top-1 left-1 w-4 h-4 bg-muted rounded-full transition-all peer-checked:translate-x-4 peer-checked:bg-[#c8a32e] peer-disabled:opacity-40" />
                </div>
                <div>
                  <span className="text-sm font-bold text-foreground">Visible</span>
                  <p className="text-xs text-faint">Affiché sur la page publique</p>
                </div>
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending}
          className="flex items-center gap-2 bg-[#c8a32e] hover:bg-[#b8922a] disabled:opacity-60 disabled:cursor-not-allowed text-[#080e1a] font-bold text-sm tracking-wider px-6 py-3 rounded transition-colors">
          <Save size={15} />
          {pending ? "Enregistrement…" : mode === "create" ? "CRÉER" : "ENREGISTRER"}
        </button>
        <Link href="/admin/coaching" className="px-5 py-3 rounded border border-border-site text-faint text-sm font-medium hover:text-foreground transition-colors flex items-center gap-2">
          <ArrowLeft size={14} /> Annuler
        </Link>
      </div>
    </form>
  );
}

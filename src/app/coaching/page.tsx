import { notFound } from "next/navigation";
import Link from "next/link";
import { ExternalLink, MessageSquare, Star } from "lucide-react";
import { getCoaches, getSettings } from "@/lib/db";
import { getSession } from "@/lib/session";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Coaching — Age of Empires France",
  description: "Améliorez votre niveau avec nos coachs francophones certifiés. Sessions personnalisées, analyse de replays et accompagnement sur mesure.",
};

const RANK_COLORS: Record<string, string> = {
  Bronze:    "text-orange-700 bg-orange-900/20 border-orange-700/30",
  Silver:    "text-slate-300  bg-slate-800/40  border-slate-500/30",
  Gold:      "text-yellow-400 bg-yellow-900/20 border-yellow-500/30",
  Platinum:  "text-cyan-400   bg-cyan-900/20   border-cyan-500/30",
  Diamond:   "text-blue-400   bg-blue-900/20   border-blue-500/30",
  Conqueror: "text-[#c8a32e]  bg-[#c8a32e]/10  border-[#c8a32e]/30",
};

function rankColor(rank: string) {
  for (const [key, cls] of Object.entries(RANK_COLORS)) {
    if (rank.startsWith(key)) return cls;
  }
  return "text-faint bg-surface-2 border-border-site";
}

export default async function CoachingPage() {
  const [settings, session, coaches] = await Promise.all([
    getSettings(),
    getSession(),
    getCoaches(true),
  ]);

  if (!settings.features.coaching) notFound();

  const discordInvite = settings.discordInvite;

  return (
    <>
      <Navbar
        discordInvite={discordInvite}
        session={session ? { username: session.username, role: session.role } : undefined}
        features={{ ...settings.features, navItems: settings.navItems }}
        maintenanceActive={settings.maintenance.active}
        maintenanceEndAt={settings.maintenance.endAt}
      />

      <main className="flex-1 pt-24 pb-20">

        {/* ── Hero ──────────────────────────────────────────────── */}
        <section className="max-w-4xl mx-auto px-4 text-center py-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#c8a32e]/30 bg-[#c8a32e]/5 text-[#c8a32e] text-xs font-bold tracking-widest uppercase mb-6">
            <Star size={11} fill="currentColor" /> Coaching AoE France
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-foreground leading-tight mb-5">
            Progressez avec un coach<br />
            <span className="text-[#c8a32e]">francophone</span>
          </h1>
          <p className="text-muted text-lg max-w-2xl mx-auto leading-relaxed">
            Que vous soyez débutant ou joueur confirmé, nos coachs vous accompagnent pour améliorer
            votre maîtrise du jeu&nbsp;: macro-économie, micro-gestion, build orders et lecture de partie.
          </p>
        </section>

        {/* ── Comment ça marche ─────────────────────────────────── */}
        <section className="max-w-4xl mx-auto px-4 mb-16">
          <div className="bg-surface border border-border-site rounded-2xl p-8">
            <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
              <MessageSquare size={20} className="text-[#c8a32e]" />
              Comment faire une demande ?
            </h2>
            <div className="grid sm:grid-cols-3 gap-6">
              {[
                { step: "1", title: "Rejoindre le Discord", desc: "Connectez-vous à notre serveur Discord communautaire." },
                { step: "2", title: "Ouvrir un ticket", desc: "Dans le salon dédié, créez un ticket coaching avec votre niveau et vos objectifs." },
                { step: "3", title: "Être mis en relation", desc: "Un coach disponible vous contacte pour planifier votre première session." },
              ].map(({ step, title, desc }) => (
                <div key={step} className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-[#c8a32e]/10 border border-[#c8a32e]/30 text-[#c8a32e] font-bold text-sm flex items-center justify-center shrink-0">
                    {step}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-sm mb-1">{title}</p>
                    <p className="text-xs text-faint leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8 pt-6 border-t border-border-site flex flex-col sm:flex-row items-center gap-4">
              <a
                href={discordInvite}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-6 py-3 rounded-lg bg-[#5865f2] hover:bg-[#4752c4] text-white font-bold text-sm transition-colors"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
                </svg>
                Rejoindre le Discord
              </a>
              <p className="text-xs text-faint text-center sm:text-left">
                Accès au salon ticket directement depuis le serveur dans la catégorie <strong className="text-muted">Coaching</strong>.
              </p>
            </div>
          </div>
        </section>

        {/* ── Grille de coachs ──────────────────────────────────── */}
        {coaches.length > 0 && (
          <section className="max-w-5xl mx-auto px-4">
            <h2 className="text-2xl font-bold text-foreground mb-8 text-center">
              Nos coachs
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {coaches.map(coach => (
                <div key={coach.id} className="bg-surface border border-border-site rounded-2xl p-6 flex flex-col gap-4 hover:border-[#c8a32e]/30 transition-colors">

                  {/* Avatar + identité */}
                  <div className="flex items-center gap-4">
                    {coach.avatar ? (
                      <img src={coach.avatar} alt={coach.pseudoAoe} className="w-14 h-14 rounded-full object-cover border-2 border-[#c8a32e]/20 shrink-0" />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-[#c8a32e]/10 border-2 border-[#c8a32e]/20 text-[#c8a32e] flex items-center justify-center text-xl font-bold shrink-0">
                        {coach.pseudoAoe.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-bold text-foreground text-base leading-tight truncate">{coach.pseudoAoe}</p>
                      <p className="text-xs text-faint truncate">{coach.discordName}</p>
                    </div>
                  </div>

                  {/* Rang + ELO */}
                  {(coach.rank || coach.elo > 0) && (
                    <div className="flex items-center gap-2 flex-wrap">
                      {coach.rank && (
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${rankColor(coach.rank)}`}>
                          {coach.rank}
                        </span>
                      )}
                      {coach.elo > 0 && (
                        <span className="text-xs text-faint font-semibold">{coach.elo} ELO</span>
                      )}
                    </div>
                  )}

                  {/* Civilisations */}
                  {coach.civilizations.length > 0 && (
                    <div>
                      <p className="text-[10px] font-bold tracking-widest text-faint uppercase mb-1.5">Civs jouées</p>
                      <p className="text-xs text-muted leading-relaxed">{coach.civilizations.join(", ")}</p>
                    </div>
                  )}

                  {/* Format */}
                  {coach.coachingFormat && (
                    <div>
                      <p className="text-[10px] font-bold tracking-widest text-faint uppercase mb-1.5">Format</p>
                      <p className="text-xs text-muted leading-relaxed">{coach.coachingFormat}</p>
                    </div>
                  )}

                  {/* Expérience */}
                  {coach.experience && (
                    <div>
                      <p className="text-[10px] font-bold tracking-widest text-faint uppercase mb-1.5">Expérience</p>
                      <p className="text-xs text-muted leading-relaxed">{coach.experience}</p>
                    </div>
                  )}

                  {/* Footer : prix + lien */}
                  <div className="mt-auto pt-4 border-t border-border-site flex items-center justify-between gap-3">
                    <span className="text-sm font-bold text-[#c8a32e]">
                      {coach.price || "Sur demande"}
                    </span>
                    <div className="flex items-center gap-2">
                      {coach.aoeWorldLink && (
                        <a href={coach.aoeWorldLink} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-faint hover:text-[#c8a32e] transition-colors font-medium">
                          <ExternalLink size={11} /> AoE4 World
                        </a>
                      )}
                      <a href={discordInvite} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#5865f2]/10 border border-[#5865f2]/30 text-[#7289da] text-xs font-bold hover:bg-[#5865f2]/20 transition-colors">
                        Contacter
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Aucun coach : page active mais vide */}
        {coaches.length === 0 && (
          <section className="max-w-2xl mx-auto px-4 text-center py-10">
            <div className="bg-surface border border-border-site rounded-2xl p-10">
              <p className="text-faint text-sm">La liste des coachs sera bientôt disponible.</p>
              <p className="text-xs text-faint mt-2">En attendant, faites votre demande directement sur notre Discord.</p>
              <a href={discordInvite} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 rounded-lg bg-[#5865f2] hover:bg-[#4752c4] text-white font-bold text-sm transition-colors">
                Rejoindre le Discord
              </a>
            </div>
          </section>
        )}

        <div className="text-center mt-12">
          <Link href="/" className="text-xs text-faint hover:text-[#c8a32e] transition-colors">
            ← Retour à l&apos;accueil
          </Link>
        </div>
      </main>

      <Footer />
    </>
  );
}

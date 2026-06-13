import Link from "next/link";
import { Users, Hash, Volume2, Shield, Star, MessageCircle, Trophy, BookOpen, Calendar, Megaphone } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import DiscordIcon from "@/components/DiscordIcon";
import BotCommandWidget from "@/components/BotCommandWidget";
import { getSettings, getBotCommands } from "@/lib/db";
import { getSession } from "@/lib/session";
import { gateFeature } from "@/lib/public-access";

export const metadata = {
  title: "Discord — Communauté Age of Empires France",
  description: "Rejoignez le Discord francophone Age of Empires. Des milliers de joueurs, des salons dédiés à chaque jeu, des tournois et bien plus.",
};

const STATS = [
  { value: "4 000+", label: "Membres" },
  { value: "40+",    label: "Salons" },
  { value: "5",      label: "Jeux couverts" },
  { value: "24/7",   label: "Actif" },
];

const CHANNELS = [
  {
    category: "INFORMATIONS",
    color: "text-[#c8a32e]",
    items: [
      { icon: <Megaphone size={14} />, name: "annonces",        desc: "Actualités officielles et annonces importantes" },
      { icon: <Star       size={14} />, name: "regles",          desc: "Règles du serveur et code de conduite" },
      { icon: <BookOpen   size={14} />, name: "presentation",    desc: "Présentez-vous à la communauté" },
    ],
  },
  {
    category: "GÉNÉRAL",
    color: "text-blue-400",
    items: [
      { icon: <Hash         size={14} />, name: "discussion-generale", desc: "Le salon principal pour tout sujet" },
      { icon: <Hash         size={14} />, name: "off-topic",           desc: "Discussions hors jeu" },
      { icon: <Volume2      size={14} />, name: "vocal-général",       desc: "Salon vocal ouvert à tous" },
    ],
  },
  {
    category: "AGE OF EMPIRES",
    color: "text-purple-400",
    items: [
      { icon: <Hash size={14} />, name: "aoe2-discussion",  desc: "Age of Empires II : DE" },
      { icon: <Hash size={14} />, name: "aoe3-discussion",  desc: "Age of Empires III : DE" },
      { icon: <Hash size={14} />, name: "aoe4-discussion",  desc: "Age of Empires IV" },
      { icon: <Hash size={14} />, name: "aom-discussion",   desc: "Age of Mythology : Retold" },
    ],
  },
  {
    category: "COMPÉTITIF",
    color: "text-emerald-400",
    items: [
      { icon: <Trophy   size={14} />, name: "tournois",      desc: "Annonces et résultats des tournois" },
      { icon: <Hash     size={14} />, name: "recherche-1v1", desc: "Trouvez des adversaires pour jouer" },
      { icon: <Volume2  size={14} />, name: "scrim-voice",   desc: "Salons vocaux pour les parties" },
    ],
  },
];

const ROLES = [
  { name: "Admin",        color: "bg-amber-800/60 text-amber-300 border-amber-700/40",    desc: "Équipe d'administration" },
  { name: "Modérateur",   color: "bg-red-800/60 text-red-300 border-red-700/40",          desc: "Modération du serveur" },
  { name: "AOE II",       color: "bg-purple-800/60 text-purple-300 border-purple-700/40", desc: "Joueurs Age of Empires II" },
  { name: "AOE III",      color: "bg-green-800/60 text-green-300 border-green-700/40",    desc: "Joueurs Age of Empires III" },
  { name: "AOE IV",       color: "bg-blue-800/60 text-blue-300 border-blue-700/40",       desc: "Joueurs Age of Empires IV" },
  { name: "AOM: RETOLD",  color: "bg-amber-800/60 text-amber-300 border-amber-700/40",    desc: "Joueurs Age of Mythology" },
  { name: "Compétiteur",  color: "bg-rose-800/60 text-rose-300 border-rose-700/40",       desc: "Joueurs actifs en tournoi" },
  { name: "Membre",       color: "bg-gray-800/60 text-gray-300 border-gray-700/40",       desc: "Membre de la communauté" },
];

const WHY_JOIN = [
  {
    icon: <Users size={22} />,
    title: "Une communauté active",
    desc: "Plus de 4 000 joueurs francophones passionnés par la franchise Age of Empires, du débutant au compétiteur.",
  },
  {
    icon: <MessageCircle size={22} />,
    title: "Salons dédiés par jeu",
    desc: "Chaque opus a ses propres salons de discussion, d'aide et de recherche de parties.",
  },
  {
    icon: <Trophy size={22} />,
    title: "Tournois & événements",
    desc: "Participez à des tournois réguliers organisés par la communauté, toutes catégories confondues.",
  },
  {
    icon: <BookOpen size={22} />,
    title: "Guides & stratégies",
    desc: "Des ressources partagées par les joueurs les plus expérimentés pour progresser rapidement. Sessions de coaching organisées par des joueurs expérimentés pour aider dans vos objectifs",
  },
  {
    icon: <Calendar size={22} />,
    title: "Nouveautés & Mises à jour",
    desc: "Salons dédiés par jeu aux mises à jour avec traduction en français, pour être le plus informé possible.",
  },
  {
    icon: <Shield size={22} />,
    title: "Communauté saine",
    desc: "Un serveur modéré activement pour garantir une atmosphère bienveillante et respectueuse.",
  },
];

export default async function DiscordPage() {
  const [settings, session, botCommands] = await Promise.all([getSettings(), getSession(), getBotCommands()]);
  gateFeature(settings, session, settings.features.community);
  gateFeature(settings, session, settings.navItems.community.includes("discord"));
  const { discordInvite } = settings;

  return (
    <>
      <Navbar discordInvite={discordInvite} session={session} features={{ ...settings.features, navItems: settings.navItems }} />

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <div className="pt-16 bg-background">
        <div className="relative overflow-hidden border-b border-border-site">
          {/* Gradient orb background */}
          <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-[#5865f2]/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-[#c8a32e]/8 blur-3xl pointer-events-none" />

          <div className="max-w-7xl mx-auto px-4 py-20 relative z-10">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-8 h-8 rounded-full bg-[#5865f2] flex items-center justify-center">
                  <DiscordIcon size={16} />
                </div>
                <span className="text-[#5865f2] text-xs font-bold tracking-[0.25em] uppercase">Serveur Discord officiel</span>
              </div>

              <h1 className="text-4xl md:text-5xl font-bold text-foreground leading-tight tracking-wide mb-5">
                LA COMMUNAUTÉ<br />
                <span className="text-[#c8a32e]">FRANCOPHONE</span><br />
                AGE OF EMPIRES
              </h1>

              <p className="text-muted text-base leading-relaxed mb-10 max-w-lg">
                Rejoignez le plus grand serveur Discord francophone dédié à la franchise Age of Empires.
                Discussions, stratégies, tournois et bien plus vous attendent.
              </p>

              <div className="flex flex-wrap gap-4">
                <a
                  href={discordInvite}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 bg-[#5865f2] hover:bg-[#4752c4] text-white font-bold text-sm tracking-wider px-8 py-4 rounded transition-colors"
                >
                  <DiscordIcon size={18} />
                  REJOINDRE LE SERVEUR
                </a>
                <Link
                  href="/actualites"
                  className="flex items-center gap-2.5 border border-border-site hover:border-[#c8a32e]/50 text-muted hover:text-[#c8a32e] font-bold text-sm tracking-wider px-8 py-4 rounded transition-colors"
                >
                  VOIR LES ACTUALITÉS
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Stats ─────────────────────────────────────────────────────────── */}
      <div className="bg-surface-3 border-b border-border-site">
        <div className="max-w-7xl mx-auto px-4 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {STATS.map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-3xl font-black text-foreground tracking-tight">{s.value}</div>
                <div className="text-xs font-bold tracking-[0.18em] text-faint uppercase mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <main className="bg-background">

        {/* ── Pourquoi rejoindre ──────────────────────────────────────────── */}
        <section className="max-w-7xl mx-auto px-4 py-20">
          <div className="mb-12">
            <p className="text-[#c8a32e] text-xs font-bold tracking-[0.3em] mb-3">POURQUOI NOUS REJOINDRE</p>
            <h2 className="text-3xl font-bold text-foreground tracking-wide">Ce que vous trouverez</h2>
            <div className="w-12 h-0.5 bg-[#c8a32e] mt-4" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {WHY_JOIN.map((item) => (
              <div
                key={item.title}
                className="bg-surface border border-border-site hover:border-[#5865f2]/30 rounded-lg p-6 transition-colors group"
              >
                <div className="text-[#5865f2] mb-4 group-hover:text-[#c8a32e] transition-colors">
                  {item.icon}
                </div>
                <h3 className="font-bold text-foreground text-sm tracking-wide mb-2">{item.title}</h3>
                <p className="text-faint text-xs leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Aperçu des salons ───────────────────────────────────────────── */}
        <section className="border-t border-border-site">
          <div className="max-w-7xl mx-auto px-4 py-20">
            <div className="mb-12">
              <p className="text-[#c8a32e] text-xs font-bold tracking-[0.3em] mb-3">ORGANISATION</p>
              <h2 className="text-3xl font-bold text-foreground tracking-wide">Aperçu des salons</h2>
              <div className="w-12 h-0.5 bg-[#c8a32e] mt-4" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Discord preview mockup — couleurs Discord hardcodées intentionnellement */}
              <div className="bg-[#313338] rounded-xl overflow-hidden border border-black/20 shadow-2xl">
                {/* Server header */}
                <div className="bg-[#2b2d31] px-4 py-3 border-b border-black/20 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#5865f2] flex items-center justify-center shrink-0">
                    <DiscordIcon size={14} />
                  </div>
                  <span className="font-bold text-white text-sm">Age of Empires France</span>
                  <div className="ml-auto flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="text-emerald-400 text-[11px] font-medium">En ligne</span>
                  </div>
                </div>

                {/* Channel list */}
                <div className="p-3 space-y-4 max-h-80 overflow-y-auto scrollbar-hide">
                  {CHANNELS.map((cat) => (
                    <div key={cat.category}>
                      <p className={`text-[10px] font-bold tracking-[0.15em] px-2 mb-1.5 ${cat.color}`}>
                        {cat.category}
                      </p>
                      {cat.items.map((ch) => (
                        <div
                          key={ch.name}
                          className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-white/5 cursor-default group"
                        >
                          <span className="text-[#80848e] group-hover:text-[#dbdee1] transition-colors shrink-0">
                            {ch.icon}
                          </span>
                          <span className="text-[#80848e] group-hover:text-[#dbdee1] text-sm transition-colors">
                            {ch.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              {/* Channel descriptions */}
              <div className="space-y-3">
                {CHANNELS.map((cat) => (
                  <div key={cat.category} className="bg-surface border border-border-site rounded-lg p-4">
                    <p className={`text-[10px] font-bold tracking-[0.2em] mb-3 ${cat.color}`}>
                      {cat.category}
                    </p>
                    <div className="space-y-2">
                      {cat.items.map((ch) => (
                        <div key={ch.name} className="flex items-start gap-2.5">
                          <span className="text-faint mt-0.5 shrink-0">{ch.icon}</span>
                          <div>
                            <span className="text-muted text-xs font-mono">#{ch.name}</span>
                            <span className="text-faint text-xs"> — {ch.desc}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Rôles ───────────────────────────────────────────────────────── */}
        <section className="border-t border-border-site">
          <div className="max-w-7xl mx-auto px-4 py-20">
            <div className="mb-12">
              <p className="text-[#c8a32e] text-xs font-bold tracking-[0.3em] mb-3">RÔLES</p>
              <h2 className="text-3xl font-bold text-foreground tracking-wide">Les rôles du serveur</h2>
              <div className="w-12 h-0.5 bg-[#c8a32e] mt-4" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {ROLES.map((role) => (
                <div key={role.name} className="bg-surface border border-border-site rounded-lg p-4 flex items-start gap-3">
                  <span className={`text-[11px] font-bold tracking-wider px-2.5 py-1 rounded border shrink-0 mt-0.5 ${role.color}`}>
                    {role.name}
                  </span>
                  <p className="text-faint text-xs leading-relaxed">{role.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Bot Discord ─────────────────────────────────────────────────── */}
        {botCommands.length > 0 && (
          <section className="border-t border-border-site">
            <div className="max-w-7xl mx-auto px-4 py-20">
              <div className="mb-12">
                <p className="text-[#c8a32e] text-xs font-bold tracking-[0.3em] mb-3">BOT DISCORD</p>
                <h2 className="text-3xl font-bold text-foreground tracking-wide">Commandes disponibles</h2>
                <div className="w-12 h-0.5 bg-[#c8a32e] mt-4" />
                <p className="text-faint text-sm mt-4 max-w-xl">
                  Notre bot personnalisé enrichit votre expérience sur le serveur. Cliquez sur une commande pour voir un aperçu de sa réponse.
                </p>
              </div>
              <BotCommandWidget commands={botCommands} />
            </div>
          </section>
        )}

        {/* ── CTA final ───────────────────────────────────────────────────── */}
        <section className="border-t border-border-site">
          <div className="max-w-7xl mx-auto px-4 py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#5865f2] flex items-center justify-center mx-auto mb-8">
              <DiscordIcon size={32} />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-wide mb-4">
              Prêt à rejoindre l&apos;aventure ?
            </h2>
            <p className="text-muted text-base max-w-lg mx-auto mb-10">
              Cliquez sur le bouton ci-dessous pour accéder directement au serveur Discord
              Age of Empires France et rejoindre la communauté.
            </p>
            <a
              href={discordInvite}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 bg-[#5865f2] hover:bg-[#4752c4] text-white font-bold text-sm tracking-wider px-10 py-5 rounded-lg transition-colors text-lg"
            >
              <DiscordIcon size={22} />
              REJOINDRE LE DISCORD
            </a>
            <p className="text-faint text-xs mt-6">Gratuit · Aucun compte requis pour rejoindre</p>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

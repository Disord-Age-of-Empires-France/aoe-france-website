import Image from "next/image";
import Link from "next/link";
import { Calendar, ChevronRight, Sword, Globe, Users, Trophy, BookOpen, Star } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getPublishedArticles, getSettings } from "@/lib/db";
import { getSession } from "@/lib/session";
import { gateFeature } from "@/lib/public-access";
import type { Article } from "@/lib/db";
import BuyWidget from "@/components/BuyWidget";

export const metadata = {
  title: "Age of Empires II — Présentation | AoE France",
  description: "Découvrez Age of Empires II : le jeu de stratégie médiéval légendaire avec plus de 45 civilisations, campagnes épiques et une communauté toujours vivante.",
};

const BADGE_CLASSES: Record<string, string> = {
  blue:   "bg-blue-800/70 text-blue-200",
  amber:  "bg-amber-800/70 text-amber-200",
  green:  "bg-green-800/70 text-green-200",
  red:    "bg-red-800/70 text-red-200",
  purple: "bg-purple-800/70 text-purple-200",
};

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" }).format(new Date(iso));
  } catch { return iso; }
}

const KEY_FEATURES = [
  {
    icon: Sword,
    title: "45+ civilisations",
    description: "La plus grande diversité de la série : chaque civilisation dispose d'une unité unique, de bonus économiques et de technologies propres.",
  },
  {
    icon: Globe,
    title: "Campagnes légendaires",
    description: "Revivez les batailles de Gengis Khan, Joan of Arc, Saladin et bien d'autres à travers des dizaines d'heures de campagnes scénarisées.",
  },
  {
    icon: Users,
    title: "Compétition vivante",
    description: "Malgré ses 25 ans d'existence, AoE II possède l'une des scènes compétitives les plus actives avec des tournois mondiaux réguliers.",
  },
  {
    icon: Trophy,
    title: "Esport historique",
    description: "Des joueurs légendaires comme TheViper, Hera et Yo dominent la scène mondiale. Des tournois avec des prize pools de plusieurs dizaines de milliers d'euros.",
  },
  {
    icon: BookOpen,
    title: "Contenu permanent",
    description: "Depuis l'édition Definitive de 2019, de nouvelles civilisations et campagnes sont régulièrement ajoutées par les développeurs.",
  },
  {
    icon: Star,
    title: "Modding actif",
    description: "Une communauté de moddeurs produit des scenarios, campagnes et modes de jeu supplémentaires disponibles directement depuis le jeu.",
  },
];

// Civilisations groupées par extension
const CIVS_BASE = [
  "Aztèques", "Berbères", "Britanniques", "Bulgares", "Byzantins", "Celtes",
  "Chinois", "Cumans", "Éthiopiens", "Francs", "Goths", "Hongrois",
  "Incas", "Indiens", "Italiens", "Japonais", "Khmers", "Coréens",
  "Lituaniens", "Maïas", "Maliens", "Maures", "Mongols", "Perses",
  "Portugais", "Sarrasins", "Slaves", "Espagnols", "Tatars", "Teutons",
  "Turcs", "Vietnamiens", "Vikings",
];

const CIVS_DLC: { name: string; civs: string[] }[] = [
  {
    name: "The African Kingdoms",
    civs: ["Éthiopiens", "Maliens", "Portugais", "Sarrasins"],
  },
  {
    name: "Rise of the Rajas",
    civs: ["Birmans", "Khmers", "Malais", "Vietnamiens"],
  },
  {
    name: "Lords of the West",
    civs: ["Bourguignons", "Siciliens"],
  },
  {
    name: "Dawn of the Dukes",
    civs: ["Bohémiens", "Polonais"],
  },
  {
    name: "Dynasties of India",
    civs: ["Bengalis", "Dravidiens", "Gurjaras", "Hindustanis"],
  },
  {
    name: "Return of Rome",
    civs: ["Romains"],
  },
  {
    name: "The Mountain Royals",
    civs: ["Arméniens", "Géorgiens"],
  },
  {
    name: "Victors and Vanquished",
    civs: ["Vietcongs", "Lombards", "Rutènes"],
  },
];

function ArticleCard({ article }: { article: Article }) {
  return (
    <Link
      href={`/actualites/${article.id}`}
      className="flex gap-4 p-4 rounded-lg bg-surface border border-border-site hover:border-purple-600/40 transition-all group"
    >
      <div className="shrink-0 w-20 h-16 rounded bg-surface-2 border border-border-site overflow-hidden">
        {article.thumbnail && (
          <img src={article.thumbnail} alt={article.title} loading="lazy" className="w-full h-full object-cover" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap gap-1 mb-1.5">
          {article.categories.map((cat) => (
            <span key={cat} className={`text-[10px] font-bold tracking-wider px-2 py-0.5 rounded ${BADGE_CLASSES[article.badgeColor] ?? BADGE_CLASSES.purple}`}>
              {cat}
            </span>
          ))}
        </div>
        <h3 className="font-bold text-sm text-foreground group-hover:text-purple-400 transition-colors leading-snug line-clamp-2 mb-1">
          {article.title}
        </h3>
        <p className="text-[11px] text-faint">{formatDate(article.date)}</p>
      </div>
    </Link>
  );
}

export default async function Aoe2PresentationPage() {
  const [allArticles, settings, session] = await Promise.all([
    getPublishedArticles(),
    getSettings(),
    getSession(),
  ]);

  gateFeature(settings, session, settings.features.games.aoe2);

  const articles = allArticles
    .filter((a) => a.categories.includes("AOE II"))
    .slice(0, 6);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar
        discordInvite={settings.discordInvite}
        session={session}
        features={{ ...settings.features, navItems: settings.navItems }} maintenanceActive={settings.maintenance.active}
        maintenanceEndAt={settings.maintenance.endAt}
      />

      <main className="flex-1">
        {/* ── Hero ───────────────────────────────────────────────────────── */}
        <div className="relative border-b border-border-site overflow-hidden bg-black">
          <Image src="/aoe2/bg.jpg" alt="" fill className="object-cover object-center opacity-40" priority />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(168,85,247,0.15)_0%,_transparent_60%)]" />
          <div className="absolute top-0 right-0 w-px h-full bg-gradient-to-b from-purple-500/20 via-transparent to-transparent" />

          <div className="relative max-w-7xl mx-auto px-4 py-16 md:py-24">
            <div className="max-w-3xl">
              <div className="flex items-center gap-2 text-[11px] text-faint font-semibold tracking-widest uppercase mb-6">
                <Link href="/" className="hover:text-[#c8a32e] transition-colors">Accueil</Link>
                <ChevronRight size={12} />
                <span className="text-purple-400">AOE II</span>
                <ChevronRight size={12} />
                <span>Présentation</span>
              </div>

              <div className="flex items-center gap-3 mb-4">
                <span className="text-[10px] font-bold tracking-widest text-purple-400 bg-purple-900/40 border border-purple-800/50 px-3 py-1 rounded">
                  AOE II
                </span>
                <span className="text-[10px] text-faint tracking-wider">30 septembre 1999</span>
              </div>

              <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground leading-none mb-3">
                AGE OF EMPIRES II
              </h1>
              <div className="w-16 h-1 bg-purple-500 rounded mb-6" />

              <p className="text-muted text-lg leading-relaxed max-w-2xl mb-8">
                Le monument indestructible du jeu de stratégie en temps réel. Sorti en{" "}
                <strong className="text-foreground">1999</strong>, réédité en Definitive Edition en{" "}
                <strong className="text-foreground">2019</strong>, Age of Empires II reste plus populaire
                que jamais avec une communauté mondiale et une scène compétitive extrêmement active.
              </p>

              <div className="flex flex-wrap gap-4 text-sm">
                {[
                  { label: "Développeur", value: "Ensemble Studios / FE" },
                  { label: "Éditeur",     value: "Xbox Game Studios" },
                  { label: "Sortie DE",   value: "22 nov. 2019" },
                  { label: "Plateformes", value: "PC · Xbox · Mobile" },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-background border border-border-site rounded px-4 py-2.5">
                    <div className="text-[10px] text-faint font-semibold tracking-wider uppercase mb-0.5">{label}</div>
                    <div className="text-foreground font-semibold text-sm">{value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-12 space-y-16">

          {/* ── Présentation ───────────────────────────────────────────────── */}
          <section>
            <h2 className="text-xl font-bold tracking-[0.12em] text-foreground uppercase mb-2">Le jeu</h2>
            <div className="w-10 h-0.5 bg-purple-500 mb-8" />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 flex flex-col gap-4 text-muted leading-relaxed">
                <p>
                  Age of Empires II vous plonge dans le Moyen Âge, de la chute de Rome à l&apos;essor
                  de l&apos;Empire ottoman. Vous dirigez votre peuple à travers{" "}
                  <strong className="text-foreground">5 âges historiques</strong> — du Sombre Âge à
                  l&apos;Âge Impérial — en récoltant des ressources, construisant des bâtiments et menant
                  vos armées au combat.
                </p>
                <p>
                  Avec plus de <strong className="text-foreground">45 civilisations</strong>, chacune
                  avec des unités uniques, des bonus économiques distinctifs et des arbres technologiques
                  partiels, AoE II offre une profondeur stratégique exceptionnelle. La diversité des
                  styles de jeu est telle que chaque partie est différente.
                </p>
                <p>
                  La <strong className="text-foreground">Definitive Edition</strong> de 2019 a modernisé
                  graphismes, interface et accessibilité tout en préservant l&apos;essence qui a fait
                  le succès du jeu original. Des DLCs continuent d&apos;ajouter régulièrement de nouvelles
                  civilisations et campagnes.
                </p>
                <div className="mt-auto">
                  <BuyWidget game="aoe2" steamAppId={settings.steamAppIds.aoe2} promoText={settings.promoTexts.aoe2} compact />
                </div>
              </div>

              <div className="space-y-3">
                <div className="bg-surface border border-border-site rounded-lg p-5">
                  <p className="text-[10px] font-bold tracking-widest text-faint uppercase mb-4">Points clés</p>
                  <ul className="space-y-3">
                    {[
                      "45+ civilisations asymétriques",
                      "Campagnes scénarisées légendaires",
                      "Esport très actif en 2024",
                      "Mises à jour régulières",
                      "Steam Workshop & mods",
                      "Classement ELO et ranked",
                    ].map((point) => (
                      <li key={point} className="flex items-start gap-2.5 text-sm text-muted">
                        <span className="text-purple-400 mt-0.5 shrink-0">◆</span>
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>

                <Link
                  href="/aoe2/civilisations"
                  className="flex items-center justify-between gap-2 w-full bg-purple-900/30 border border-purple-800/50 hover:border-purple-500/60 text-purple-300 hover:text-purple-200 rounded-lg px-5 py-3.5 text-sm font-semibold transition-colors group"
                >
                  <span>Voir toutes les civilisations</span>
                  <ChevronRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
                </Link>
                <Link
                  href="/aoe2/guides"
                  className="flex items-center justify-between gap-2 w-full bg-surface border border-border-site hover:border-[#c8a32e]/40 text-muted hover:text-[#c8a32e] rounded-lg px-5 py-3.5 text-sm font-semibold transition-colors group"
                >
                  <span>Guides et stratégies</span>
                  <ChevronRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>
          </section>

          {/* ── Points forts ───────────────────────────────────────────────── */}
          <section>
            <h2 className="text-xl font-bold tracking-[0.12em] text-foreground uppercase mb-2">Points forts</h2>
            <div className="w-10 h-0.5 bg-purple-500 mb-8" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {KEY_FEATURES.map(({ icon: Icon, title, description }) => (
                <div key={title} className="bg-surface border border-border-site rounded-lg p-5 hover:border-purple-600/30 transition-colors">
                  <div className="w-9 h-9 rounded-lg bg-purple-900/40 border border-purple-800/40 flex items-center justify-center text-purple-400 mb-4">
                    <Icon size={17} />
                  </div>
                  <h3 className="font-bold text-foreground text-sm mb-2">{title}</h3>
                  <p className="text-muted text-sm leading-relaxed">{description}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ── Civilisations ──────────────────────────────────────────────── */}
          <section>
            <div className="flex items-end justify-between mb-2">
              <h2 className="text-xl font-bold tracking-[0.12em] text-foreground uppercase">
                Civilisations
              </h2>
              <Link
                href="/aoe2/civilisations"
                className="text-[11px] text-faint hover:text-purple-400 transition-colors font-semibold tracking-wider flex items-center gap-1"
              >
                Toutes les civs <ChevronRight size={12} />
              </Link>
            </div>
            <div className="w-10 h-0.5 bg-purple-500 mb-8" />

            {/* Jeu de base */}
            <div className="mb-6">
              <p className="text-[10px] font-bold tracking-widest text-faint uppercase mb-4 flex items-center gap-2">
                <span className="w-4 h-px bg-border-site inline-block" />
                Jeu de base — {CIVS_BASE.length} civilisations
                <span className="flex-1 h-px bg-border-site inline-block" />
              </p>
              <div className="flex flex-wrap gap-2">
                {CIVS_BASE.map((civ) => (
                  <span
                    key={civ}
                    className="text-xs font-semibold text-purple-200 bg-purple-900/30 border border-purple-800/40 px-3 py-1.5 rounded"
                  >
                    {civ}
                  </span>
                ))}
              </div>
            </div>

            {/* DLCs */}
            <div className="space-y-5">
              {CIVS_DLC.map(({ name, civs }) => (
                <div key={name}>
                  <p className="text-[10px] font-bold tracking-widest text-faint uppercase mb-3 flex items-center gap-2">
                    <span className="w-4 h-px bg-border-site inline-block" />
                    {name} — {civs.length} civ{civs.length > 1 ? "s" : ""}
                    <span className="flex-1 h-px bg-border-site inline-block" />
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {civs.map((civ) => (
                      <span
                        key={civ}
                        className="text-xs font-semibold text-purple-300 bg-purple-900/20 border border-purple-800/30 border-dashed px-3 py-1.5 rounded"
                      >
                        {civ}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── Actualités ─────────────────────────────────────────────────── */}
          <section>
            <div className="flex items-end justify-between mb-2">
              <h2 className="text-xl font-bold tracking-[0.12em] text-foreground uppercase">
                Actualités AOE II
              </h2>
              <Link
                href="/actualites"
                className="text-[11px] text-faint hover:text-[#c8a32e] transition-colors font-semibold tracking-wider flex items-center gap-1"
              >
                Toutes les actualités <ChevronRight size={12} />
              </Link>
            </div>
            <div className="w-10 h-0.5 bg-purple-500 mb-8" />

            {articles.length === 0 ? (
              <div className="bg-surface border border-border-site rounded-lg p-12 text-center">
                <Calendar size={28} className="text-faint mx-auto mb-3" />
                <p className="text-faint text-sm">Aucune actualité AOE II publiée pour l&apos;instant.</p>
                <Link
                  href="/actualites"
                  className="mt-4 inline-block text-[11px] font-bold tracking-wider text-[#c8a32e] hover:underline"
                >
                  Voir toutes les actualités →
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {articles.map((article) => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </div>
            )}
          </section>

          {/* ── Navigation ─────────────────────────────────────────────────── */}
          <section className="border-t border-border-site pt-10">
            <p className="text-[10px] font-bold tracking-widest text-faint uppercase mb-6">Explorer AOE II</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { href: "/aoe2/civilisations", label: "Civilisations", desc: "Toutes les civs en détail", icon: Globe },
                { href: "/aoe2/guides",        label: "Guides",        desc: "Stratégies et Build Orders", icon: BookOpen },
                { href: "/aoe2/tournois",      label: "Tournois",      desc: "Compétitions et classements", icon: Trophy },
              ].map(({ href, label, desc, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-4 bg-surface border border-border-site hover:border-purple-600/40 rounded-lg p-5 transition-colors group"
                >
                  <div className="w-10 h-10 rounded-lg bg-purple-900/30 border border-purple-800/40 flex items-center justify-center text-purple-400 shrink-0 group-hover:bg-purple-900/50 transition-colors">
                    <Icon size={18} />
                  </div>
                  <div>
                    <div className="font-bold text-foreground text-sm group-hover:text-purple-400 transition-colors">{label}</div>
                    <div className="text-faint text-xs mt-0.5">{desc}</div>
                  </div>
                  <ChevronRight size={14} className="text-faint ml-auto group-hover:translate-x-0.5 transition-transform" />
                </Link>
              ))}
            </div>
          </section>

        </div>
      </main>

      <Footer />
    </div>
  );
}

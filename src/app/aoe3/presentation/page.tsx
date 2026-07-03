import Image from "next/image";
import Link from "next/link";
import { Calendar, ChevronRight, Sword, Globe, Users, Trophy, BookOpen, Star } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getPublishedArticles, getSettings } from "@/lib/db";
import { getSession } from "@/lib/session";
import { gateFeature } from "@/lib/public-access";
import type { Article } from "@/lib/db";
import CivIcon from "@/components/aoe4/CivIcon";
import BuyWidget from "@/components/BuyWidget";

export const metadata = {
  title: "Age of Empires III — Présentation | AoE France",
  description: "Découvrez Age of Empires III : la colonisation de l'Amérique, les cartes Home City et 16 civilisations uniques. La Definitive Edition remet ce classique au goût du jour.",
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
    title: "Home City",
    description: "Un système de cartes unique : votre ville natale envoie des renforts et des ressources au front. Personnalisez votre deck entre les parties.",
  },
  {
    icon: Globe,
    title: "Ère de la Colonisation",
    description: "Couvrant le XVIe au XIXe siècle, AoE III dépeint l'expansion européenne dans les Amériques et l'Asie avec ses richesses et ses conflits.",
  },
  {
    icon: Users,
    title: "16 civilisations",
    description: "Des Espagnols aux Hausa, en passant par les Aztèques et les Japonais, chaque civ apporte un style de jeu radicalement différent.",
  },
  {
    icon: Trophy,
    title: "Compétition internationale",
    description: "Une scène compétitive dédiée avec des tournois internationaux, des streamers spécialisés et un classement ELO actif.",
  },
  {
    icon: BookOpen,
    title: "Campagnes épiques",
    description: "La saga des Black Family sur 3 générations, plus des campagnes supplémentaires en DLC pour chaque civilisation ou région.",
  },
  {
    icon: Star,
    title: "Definitive Edition",
    description: "Rééditée en 2020 avec refonte graphique, deux nouvelles civilisations (Suédois, Incas), deux retirées et des centaines de corrections.",
  },
];

const CIVS_BASE: { name: string; slug: string; description: string }[] = [
  { name: "Espagnols",   slug: "spanish",   description: "Cavalerie de mission, Soldados et économie avancée grâce aux Encomiendas." },
  { name: "Britanniques",slug: "british",   description: "Musketeers de renommée mondiale, économie domestique et améliorations de ferme." },
  { name: "Français",    slug: "french",    description: "Coureurs des bois polyvalents, alliés amérindiens et cavalerie légère." },
  { name: "Portugais",   slug: "portuguese",description: "Cassadores d'élite, navires de guerre puissants et bonus d'exploration." },
  { name: "Néerlandais", slug: "dutch",     description: "Banques générant de l'or, Ruyters mercenaires et économie financière." },
  { name: "Russes",      slug: "russian",   description: "Masse d'unités à faible coût, Cosaques et streltsy pour le nombre." },
  { name: "Ottomans",    slug: "ottoman",   description: "Janissaires gratuits, Abus Guns et croissance automatique de la population." },
  { name: "Allemands",   slug: "german",    description: "Ulhans de cavalerie, Doppelsöldners et settlers supplémentaires dès le début." },
];

const CIVS_DLC: { name: string; slug: string; description: string }[] = [
  { name: "Aztèques",    slug: "aztec",     description: "Warriors-Priests, Eagle Runner Knights et économie tribale unique." },
  { name: "Sioux",       slug: "sioux",     description: "Guerriers montés à cheval, pas de villageois classiques — économie nomade." },
  { name: "Iroquois",    slug: "iroquois",  description: "Tomahawks et Mantlets, économie forestière avec les War Huts." },
  { name: "Indiens",     slug: "indian",    description: "Éléphants de guerre, Sepoys et économie de soieries." },
  { name: "Japonais",    slug: "japanese",  description: "Samouraïs, Ashigarus et économie basée sur les sanctuaires Shinto." },
  { name: "Chinois",     slug: "chinese",   description: "Bannermen, Monks et production en masse par le système de Dynasties." },
  { name: "Suédois",     slug: "swedish",   description: "Carolean d'infanterie d'élite, Hakkapeliittas cavaliers finlandais." },
  { name: "Hausa",       slug: "hausa",     description: "Commerce sahelien, Fulani Archer Riders et fortifications africaines." },
  { name: "Éthiopiens",  slug: "ethiopian", description: "Shotel Warriors, Neftenya et murailles défensives d'enceinte." },
  { name: "Incas",       slug: "inca",      description: "Chancas, Huaraca et économie andine basée sur les Mitas." },
  { name: "Mexicains",   slug: "mexican",   description: "Révolutions multiples, Soldaderas et unités mixtes coloniales et autochtones." },
  { name: "États-Unis",  slug: "usa",       description: "Minutemen, Regulators et unité de la Guerre de Sécession." },
];

function ArticleCard({ article }: { article: Article }) {
  return (
    <Link
      href={`/actualites/${article.id}`}
      className="flex gap-4 p-4 rounded-lg bg-surface border border-border-site hover:border-green-600/40 transition-all group"
    >
      <div className="shrink-0 w-20 h-16 rounded bg-surface-2 border border-border-site overflow-hidden">
        {article.thumbnail && (
          <img src={article.thumbnail} alt={article.title} loading="lazy" className="w-full h-full object-cover" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap gap-1 mb-1.5">
          {article.categories.map((cat) => (
            <span key={cat} className={`text-[10px] font-bold tracking-wider px-2 py-0.5 rounded ${BADGE_CLASSES[article.badgeColor] ?? BADGE_CLASSES.green}`}>
              {cat}
            </span>
          ))}
        </div>
        <h3 className="font-bold text-sm text-foreground group-hover:text-green-400 transition-colors leading-snug line-clamp-2 mb-1">
          {article.title}
        </h3>
        <p className="text-[11px] text-faint">{formatDate(article.date)}</p>
      </div>
    </Link>
  );
}

export default async function Aoe3PresentationPage() {
  const [allArticles, settings, session] = await Promise.all([
    getPublishedArticles(),
    getSettings(),
    getSession(),
  ]);

  gateFeature(settings, session, settings.features.games.aoe3);

  const articles = allArticles
    .filter((a) => a.categories.includes("AOE III"))
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
          <Image src="/aoe3/bg.jpg" alt="" fill className="object-cover object-center opacity-40" priority />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(34,197,94,0.15)_0%,_transparent_60%)]" />
          <div className="absolute top-0 right-0 w-px h-full bg-gradient-to-b from-green-500/20 via-transparent to-transparent" />

          <div className="relative max-w-7xl mx-auto px-4 py-16 md:py-24">
            <div className="max-w-3xl">
              <div className="flex items-center gap-2 text-[11px] text-faint font-semibold tracking-widest uppercase mb-6">
                <Link href="/" className="hover:text-[#c8a32e] transition-colors">Accueil</Link>
                <ChevronRight size={12} />
                <span className="text-green-400">AOE III</span>
                <ChevronRight size={12} />
                <span>Présentation</span>
              </div>

              <div className="flex items-center gap-3 mb-4">
                <span className="text-[10px] font-bold tracking-widest text-green-400 bg-green-900/40 border border-green-800/50 px-3 py-1 rounded">
                  AOE III
                </span>
                <span className="text-[10px] text-faint tracking-wider">18 octobre 2005</span>
              </div>

              <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground leading-none mb-3">
                AGE OF EMPIRES III
              </h1>
              <div className="w-16 h-1 bg-green-500 rounded mb-6" />

              <p className="text-muted text-lg leading-relaxed max-w-2xl mb-8">
                L&apos;ère de la conquête et de la colonisation. Développé par{" "}
                <strong className="text-foreground">Ensemble Studios</strong>, Age of Empires III
                introduit un système révolutionnaire de cartes Home City et transpose la saga
                dans un contexte plus récent, du XVIe au XIXe siècle.
              </p>

              <div className="flex flex-wrap gap-4 text-sm">
                {[
                  { label: "Développeur", value: "Ensemble Studios / FE" },
                  { label: "Éditeur",     value: "Xbox Game Studios" },
                  { label: "Sortie DE",   value: "15 oct. 2020" },
                  { label: "Plateformes", value: "PC · Mac" },
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
            <div className="w-10 h-0.5 bg-green-500 mb-8" />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 flex flex-col gap-4 text-muted leading-relaxed">
                <p>
                  Age of Empires III vous transporte à l&apos;ère de la colonisation, entre le{" "}
                  <strong className="text-foreground">XVIe et XIXe siècle</strong>. Vous guidez des
                  puissances coloniales européennes et des nations autochtones dans la conquête et la
                  défense du Nouveau Monde.
                </p>
                <p>
                  La grande innovation du jeu est le système de{" "}
                  <strong className="text-foreground">Home City</strong> : votre ville natale en Europe
                  vous envoie des cartes de soutien (unités, ressources, technologies) que vous avez
                  choisies avant la partie. Ce deck personnalisé ajoute une couche de stratégie unique
                  en dehors de la partie elle-même.
                </p>
                <p>
                  La <strong className="text-foreground">Definitive Edition</strong> de 2020 a
                  entièrement rénové le jeu avec de nouveaux graphismes, des améliorations de l&apos;IA,
                  des corrections d&apos;équilibre et deux nouvelles civilisations gratuites (Suédois et
                  Incas), faisant d&apos;AoE III le plus accessible qu&apos;il n&apos;ait jamais été.
                </p>
                <div className="mt-auto">
                  <BuyWidget game="aoe3" steamAppId={settings.steamAppIds.aoe3} promoText={settings.promoTexts.aoe3} compact />
                </div>
              </div>

              <div className="space-y-3">
                <div className="bg-surface border border-border-site rounded-lg p-5">
                  <p className="text-[10px] font-bold tracking-widest text-faint uppercase mb-4">Points clés</p>
                  <ul className="space-y-3">
                    {[
                      "16 civilisations asymétriques",
                      "Système de deck Home City",
                      "3 campanges historiques",
                      "Coopération 2v2v2v2",
                      "Classement ELO ranked",
                      "Gratuit via Xbox Game Pass",
                    ].map((point) => (
                      <li key={point} className="flex items-start gap-2.5 text-sm text-muted">
                        <span className="text-green-400 mt-0.5 shrink-0">◆</span>
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>

                <Link
                  href="/aoe3/civilisations"
                  className="flex items-center justify-between gap-2 w-full bg-green-900/30 border border-green-800/50 hover:border-green-500/60 text-green-300 hover:text-green-200 rounded-lg px-5 py-3.5 text-sm font-semibold transition-colors group"
                >
                  <span>Voir toutes les civilisations</span>
                  <ChevronRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
                </Link>
                <Link
                  href="/aoe3/guides"
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
            <div className="w-10 h-0.5 bg-green-500 mb-8" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {KEY_FEATURES.map(({ icon: Icon, title, description }) => (
                <div key={title} className="bg-surface border border-border-site rounded-lg p-5 hover:border-green-600/30 transition-colors">
                  <div className="w-9 h-9 rounded-lg bg-green-900/40 border border-green-800/40 flex items-center justify-center text-green-400 mb-4">
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
                href="/aoe3/civilisations"
                className="text-[11px] text-faint hover:text-green-400 transition-colors font-semibold tracking-wider flex items-center gap-1"
              >
                Toutes les civs <ChevronRight size={12} />
              </Link>
            </div>
            <div className="w-10 h-0.5 bg-green-500 mb-8" />

            {/* Jeu de base */}
            <div className="mb-6">
              <p className="text-[10px] font-bold tracking-widest text-faint uppercase mb-4 flex items-center gap-2">
                <span className="w-4 h-px bg-border-site inline-block" />
                Jeu de base — {CIVS_BASE.length} civilisations
                <span className="flex-1 h-px bg-border-site inline-block" />
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {CIVS_BASE.map(({ name, slug, description }) => (
                  <div key={name} className="bg-surface border border-border-site rounded-lg p-4 hover:border-green-600/30 transition-colors">
                    <div className="mb-3">
                      <CivIcon slug={slug} name={name} basePath="/aoe3/civs/" color="green" />
                    </div>
                    <h3 className="font-bold text-foreground text-sm mb-1.5">{name}</h3>
                    <p className="text-faint text-xs leading-relaxed">{description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* DLC */}
            <div className="mt-6">
              <p className="text-[10px] font-bold tracking-widest text-faint uppercase mb-4 flex items-center gap-2">
                <span className="w-4 h-px bg-border-site inline-block" />
                DLCs &amp; Definitive Edition — {CIVS_DLC.length} civilisations
                <span className="flex-1 h-px bg-border-site inline-block" />
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {CIVS_DLC.map(({ name, slug, description }) => (
                  <div key={name} className="bg-surface border border-border-site rounded-lg p-4 border-dashed hover:border-green-600/30 transition-colors">
                    <div className="mb-3">
                      <CivIcon slug={slug} name={name} basePath="/aoe3/civs/" color="green" />
                    </div>
                    <h3 className="font-bold text-foreground text-sm mb-1.5">{name}</h3>
                    <p className="text-faint text-xs leading-relaxed">{description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── Actualités ─────────────────────────────────────────────────── */}
          <section>
            <div className="flex items-end justify-between mb-2">
              <h2 className="text-xl font-bold tracking-[0.12em] text-foreground uppercase">
                Actualités AOE III
              </h2>
              <Link
                href="/actualites"
                className="text-[11px] text-faint hover:text-[#c8a32e] transition-colors font-semibold tracking-wider flex items-center gap-1"
              >
                Toutes les actualités <ChevronRight size={12} />
              </Link>
            </div>
            <div className="w-10 h-0.5 bg-green-500 mb-8" />

            {articles.length === 0 ? (
              <div className="bg-surface border border-border-site rounded-lg p-12 text-center">
                <Calendar size={28} className="text-faint mx-auto mb-3" />
                <p className="text-faint text-sm">Aucune actualité AOE III publiée pour l&apos;instant.</p>
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
            <p className="text-[10px] font-bold tracking-widest text-faint uppercase mb-6">Explorer AOE III</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { href: "/aoe3/civilisations", label: "Civilisations", desc: "Toutes les civs en détail", icon: Globe },
                { href: "/aoe3/guides",        label: "Guides",        desc: "Stratégies et Build Orders", icon: BookOpen },
                { href: "/aoe3/tournois",      label: "Tournois",      desc: "Compétitions et classements", icon: Trophy },
              ].map(({ href, label, desc, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-4 bg-surface border border-border-site hover:border-green-600/40 rounded-lg p-5 transition-colors group"
                >
                  <div className="w-10 h-10 rounded-lg bg-green-900/30 border border-green-800/40 flex items-center justify-center text-green-400 shrink-0 group-hover:bg-green-900/50 transition-colors">
                    <Icon size={18} />
                  </div>
                  <div>
                    <div className="font-bold text-foreground text-sm group-hover:text-green-400 transition-colors">{label}</div>
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

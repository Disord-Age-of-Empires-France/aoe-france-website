import Image from "next/image";
import Link from "next/link";
import { Calendar, ChevronRight, Zap, Globe, Users, Trophy, BookOpen, Star } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getPublishedArticles, getSettings } from "@/lib/db";
import { getSession } from "@/lib/session";
import { gateFeature } from "@/lib/public-access";
import type { Article } from "@/lib/db";
import CivIcon from "@/components/aoe4/CivIcon";
import BuyWidget from "@/components/BuyWidget";

export const metadata = {
  title: "Age of Mythology: Retold — Présentation | AoE France",
  description: "Découvrez Age of Mythology: Retold, la renaissance du jeu de stratégie mythologique. Dieux grecs, nordiques, égyptiens et bien d'autres affrontent leurs légions dans des batailles épiques.",
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
    icon: Zap,
    title: "Pouvoirs divins",
    description: "Chaque panthéon dispose de pouvoirs divins spectaculaires : météores, tremblements de terre, tempêtes, résurrection — la magie change le cours des batailles.",
  },
  {
    icon: Globe,
    title: "5 panthéons",
    description: "Grecs, Nordiques, Égyptiens, Atlantes et Chinois — chaque panthéon a son économie, ses créatures mythologiques et ses stratégies propres.",
  },
  {
    icon: Users,
    title: "Créatures mythologiques",
    description: "Minotaures, Cyclopes, Phénix, Dragons et bien d'autres créatures légendaires combattent aux côtés de vos armées mortelles.",
  },
  {
    icon: Trophy,
    title: "Compétition renouvelée",
    description: "Retold redonne vie à la scène compétitive avec de nouveaux équilibrages, un classement refait et des tournois organisés par la communauté.",
  },
  {
    icon: BookOpen,
    title: "Campagne de The Fall of the Trident",
    description: "Suivez Arkantos à travers une épopée épique mêlant mythologie grecque, égyptienne et nordique dans une grande histoire de héros.",
  },
  {
    icon: Star,
    title: "Refonte visuelle totale",
    description: "Retold remaster entièrement les graphismes avec des effets de particules modernes, des créatures réanimées et un éclairage dynamique spectaculaire.",
  },
];

// Panthéons avec leurs dieux majeurs — slug = fichier dans /public/aom/gods/
const PANTHEONS: {
  name:        string;
  color:       string;
  slug:        string;
  description: string;
  gods:        { name: string; slug: string; description: string }[];
}[] = [
  {
    name:        "Grecs",
    color:       "amber",
    slug:        "greek",
    description: "Les Grecs s'appuient sur une économie solide et des héros puissants. Leurs créatures — Cyclopes, Centaures, Méduses — excellent au combat direct.",
    gods: [
      { name: "Zeus",      slug: "zeus",      description: "Bonus hoplites, foudre divine, unités favorisées." },
      { name: "Hades",     slug: "hades",     description: "Armée de squelettes, économie de mort et résurrection." },
      { name: "Poseidon",  slug: "poseidon",  description: "Cavalerie hippocamp, pêche améliorée et Hippocampes." },
    ],
  },
  {
    name:        "Nordiques",
    color:       "amber",
    slug:        "norse",
    description: "Les Nordiques sont agressifs et nomades. Les Hersirs génèrent de la Faveur au combat, et les géants de glace ou de feu dévastent les rangs ennemis.",
    gods: [
      { name: "Thor",      slug: "thor",      description: "Nains mineurs, armures de marteau et foudre de Mjolnir." },
      { name: "Odin",      slug: "odin",      description: "Corbeaux éclaireurs, bonus de pillage et Einherjar d'élite." },
      { name: "Loki",      slug: "loki",      description: "Hersirs évoquant des monstres, tromperie et embuscades." },
    ],
  },
  {
    name:        "Égyptiens",
    color:       "amber",
    slug:        "egyptian",
    description: "Les Égyptiens génèrent de la Faveur grâce à leurs monuments. Leurs prêtres soignent et convertissent, tandis que les pharaons renforcent les bâtiments.",
    gods: [
      { name: "Ra",        slug: "ra",        description: "Économie solaire, villages améliorés et bonus de Faveur." },
      { name: "Isis",      slug: "isis",      description: "Monuments puissants, monuments de magie et sphinx gardiens." },
      { name: "Set",       slug: "set",       description: "Animation d'animaux, armée d'ombres et corruption." },
    ],
  },
  {
    name:        "Atlantes",
    color:       "amber",
    slug:        "atlantean",
    description: "Les Atlantes ont des citoyens qui fonctionnent comme des travailleurs et des soldats. Leurs dieux titanesques peuvent être invoqués pour une puissance divine ultime.",
    gods: [
      { name: "Kronos",    slug: "kronos",    description: "Contrôle du temps, téléportation de bâtiments, économie décalée." },
      { name: "Oranos",    slug: "oranos",    description: "Unités aériennes, bonus d'expédition et combat céleste." },
      { name: "Gaia",      slug: "gaia",      description: "Régénération, forêts défensives et terrains mouvants." },
    ],
  },
  {
    name:        "Chinois",
    color:       "amber",
    slug:        "chinese",
    description: "Les Chinois génèrent de la Faveur grâce à des ermites. Leurs dragons et leurs zodiaques offrent une grande variété de tactiques et de pouvoirs.",
    gods: [
      { name: "Fu Xi",     slug: "fuxi",      description: "Bonus de Faveur, animaux de l'armée et force terrestre." },
      { name: "Nu Wa",     slug: "nuwa",      description: "Dragons de soutien, création et fertilité des terres." },
      { name: "Shennong",  slug: "shennong",  description: "Agriculture améliorée, poisons végétaux et armées paysannes." },
    ],
  },
];

function ArticleCard({ article }: { article: Article }) {
  return (
    <Link
      href={`/actualites/${article.id}`}
      className="flex gap-4 p-4 rounded-lg bg-surface border border-border-site hover:border-amber-600/40 transition-all group"
    >
      <div className="shrink-0 w-20 h-16 rounded bg-surface-2 border border-border-site overflow-hidden">
        {article.thumbnail && (
          <img src={article.thumbnail} alt={article.title} loading="lazy" className="w-full h-full object-cover" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap gap-1 mb-1.5">
          {article.categories.map((cat) => (
            <span key={cat} className={`text-[10px] font-bold tracking-wider px-2 py-0.5 rounded ${BADGE_CLASSES[article.badgeColor] ?? BADGE_CLASSES.amber}`}>
              {cat}
            </span>
          ))}
        </div>
        <h3 className="font-bold text-sm text-foreground group-hover:text-amber-400 transition-colors leading-snug line-clamp-2 mb-1">
          {article.title}
        </h3>
        <p className="text-[11px] text-faint">{formatDate(article.date)}</p>
      </div>
    </Link>
  );
}

export default async function AomRetoldPresentationPage() {
  const [allArticles, settings, session] = await Promise.all([
    getPublishedArticles(),
    getSettings(),
    getSession(),
  ]);

  gateFeature(settings, session, settings.features.games.aom);

  const articles = allArticles
    .filter((a) => a.categories.includes("AOM: RETOLD"))
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
          <Image src="/aom/bg.jpg" alt="" fill className="object-cover object-center opacity-40" priority />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(245,158,11,0.15)_0%,_transparent_60%)]" />
          <div className="absolute top-0 right-0 w-px h-full bg-gradient-to-b from-amber-500/20 via-transparent to-transparent" />

          <div className="relative max-w-7xl mx-auto px-4 py-16 md:py-24">
            <div className="max-w-3xl">
              <div className="flex items-center gap-2 text-[11px] text-faint font-semibold tracking-widest uppercase mb-6">
                <Link href="/" className="hover:text-[#c8a32e] transition-colors">Accueil</Link>
                <ChevronRight size={12} />
                <span className="text-amber-400">AOM: RETOLD</span>
                <ChevronRight size={12} />
                <span>Présentation</span>
              </div>

              <div className="flex items-center gap-3 mb-4">
                <span className="text-[10px] font-bold tracking-widest text-amber-400 bg-amber-900/40 border border-amber-800/50 px-3 py-1 rounded">
                  AOM: RETOLD
                </span>
                <span className="text-[10px] text-faint tracking-wider">4 septembre 2024</span>
              </div>

              <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground leading-none mb-3">
                AGE OF MYTHOLOGY: RETOLD
              </h1>
              <div className="w-16 h-1 bg-amber-500 rounded mb-6" />

              <p className="text-muted text-lg leading-relaxed max-w-2xl mb-8">
                La mythologie entre en guerre. Développé par{" "}
                <strong className="text-foreground">World&apos;s Edge</strong>, Age of Mythology: Retold
                est un remaster complet du classique de 2002 — graphismes modernes, équilibre revu
                et un nouveau panthéon chinois pour enrichir les 5 civilisations légendaires.
              </p>

              <div className="flex flex-wrap gap-4 text-sm">
                {[
                  { label: "Développeur", value: "World's Edge / FE" },
                  { label: "Éditeur",     value: "Xbox Game Studios" },
                  { label: "Sortie",      value: "4 sept. 2024" },
                  { label: "Plateformes", value: "PC · Xbox" },
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
            <div className="w-10 h-0.5 bg-amber-500 mb-8" />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 flex flex-col gap-4 text-muted leading-relaxed">
                <p>
                  Age of Mythology: Retold transpose la formule de la saga Age of Empires dans le monde
                  de la{" "}<strong className="text-foreground">mythologie antique</strong>. Vous choisissez
                  un panthéon de dieux — Grecs, Nordiques, Égyptiens, Atlantes ou Chinois — et invoquez
                  des créatures légendaires et des pouvoirs divins pour écraser vos adversaires.
                </p>
                <p>
                  À chaque avancée dans les âges, vous choisissez un{" "}
                  <strong className="text-foreground">dieu mineur</strong> qui vous octroie un pouvoir
                  divin unique et un accès à de nouvelles créatures mythologiques. Cette mécanique crée
                  une profondeur de personnalisation inégalée en multijoueur.
                </p>
                <p>
                  Retold a entièrement refait les{" "}
                  <strong className="text-foreground">graphismes et les effets visuels</strong> : les
                  créatures sont redessinées, les sorts et explosions repensés, et l&apos;éclairage
                  dynamique donne vie aux champs de bataille mythologiques comme jamais auparavant.
                </p>
                <div className="mt-auto">
                  <BuyWidget game="aom" steamAppId={settings.steamAppIds.aom} promoText={settings.promoTexts.aom} compact />
                </div>
              </div>

              <div className="space-y-3">
                <div className="bg-surface border border-border-site rounded-lg p-5">
                  <p className="text-[10px] font-bold tracking-widest text-faint uppercase mb-4">Points clés</p>
                  <ul className="space-y-3">
                    {[
                      "5 panthéons / 15 dieux majeurs",
                      "Créatures mythologiques uniques",
                      "Pouvoirs divins spectaculaires",
                      "Campagne épique multi-mythologie",
                      "Multijoueur classé rénové",
                      "Disponible sur Xbox Game Pass",
                    ].map((point) => (
                      <li key={point} className="flex items-start gap-2.5 text-sm text-muted">
                        <span className="text-amber-400 mt-0.5 shrink-0">◆</span>
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>

                <Link
                  href="/aom-retold/pantheons"
                  className="flex items-center justify-between gap-2 w-full bg-amber-900/30 border border-amber-800/50 hover:border-amber-500/60 text-amber-300 hover:text-amber-200 rounded-lg px-5 py-3.5 text-sm font-semibold transition-colors group"
                >
                  <span>Voir tous les panthéons</span>
                  <ChevronRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
                </Link>
                <Link
                  href="/aom-retold/guides"
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
            <div className="w-10 h-0.5 bg-amber-500 mb-8" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {KEY_FEATURES.map(({ icon: Icon, title, description }) => (
                <div key={title} className="bg-surface border border-border-site rounded-lg p-5 hover:border-amber-600/30 transition-colors">
                  <div className="w-9 h-9 rounded-lg bg-amber-900/40 border border-amber-800/40 flex items-center justify-center text-amber-400 mb-4">
                    <Icon size={17} />
                  </div>
                  <h3 className="font-bold text-foreground text-sm mb-2">{title}</h3>
                  <p className="text-muted text-sm leading-relaxed">{description}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ── Panthéons ──────────────────────────────────────────────────── */}
          <section>
            <div className="flex items-end justify-between mb-2">
              <h2 className="text-xl font-bold tracking-[0.12em] text-foreground uppercase">
                Panthéons &amp; Dieux
              </h2>
              <Link
                href="/aom-retold/pantheons"
                className="text-[11px] text-faint hover:text-amber-400 transition-colors font-semibold tracking-wider flex items-center gap-1"
              >
                Tous les panthéons <ChevronRight size={12} />
              </Link>
            </div>
            <div className="w-10 h-0.5 bg-amber-500 mb-8" />

            <div className="space-y-8">
              {PANTHEONS.map(({ name, slug, description, gods }) => (
                <div key={name}>
                  <p className="text-[10px] font-bold tracking-widest text-faint uppercase mb-4 flex items-center gap-2">
                    <span className="w-4 h-px bg-border-site inline-block" />
                    Panthéon {name}
                    <span className="flex-1 h-px bg-border-site inline-block" />
                  </p>

                  <div className="bg-surface border border-border-site rounded-lg p-5 mb-4">
                    <div className="flex items-start gap-4">
                      <CivIcon slug={slug} name={name} basePath="/aom/gods/" color="amber" />
                      <p className="text-sm text-muted leading-relaxed">{description}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {gods.map(({ name: godName, slug: godSlug, description: godDesc }) => (
                      <div key={godName} className="bg-surface border border-border-site rounded-lg p-4 hover:border-amber-600/30 transition-colors">
                        <div className="flex items-center gap-3 mb-2">
                          <CivIcon slug={godSlug} name={godName} basePath="/aom/gods/" color="amber" />
                          <h3 className="font-bold text-foreground text-sm">{godName}</h3>
                        </div>
                        <p className="text-faint text-xs leading-relaxed">{godDesc}</p>
                      </div>
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
                Actualités AOM: Retold
              </h2>
              <Link
                href="/actualites"
                className="text-[11px] text-faint hover:text-[#c8a32e] transition-colors font-semibold tracking-wider flex items-center gap-1"
              >
                Toutes les actualités <ChevronRight size={12} />
              </Link>
            </div>
            <div className="w-10 h-0.5 bg-amber-500 mb-8" />

            {articles.length === 0 ? (
              <div className="bg-surface border border-border-site rounded-lg p-12 text-center">
                <Calendar size={28} className="text-faint mx-auto mb-3" />
                <p className="text-faint text-sm">Aucune actualité AOM: Retold publiée pour l&apos;instant.</p>
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
            <p className="text-[10px] font-bold tracking-widest text-faint uppercase mb-6">Explorer AOM: Retold</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { href: "/aom-retold/pantheons", label: "Panthéons",  desc: "Tous les dieux en détail", icon: Globe },
                { href: "/aom-retold/guides",    label: "Guides",     desc: "Stratégies et Build Orders", icon: BookOpen },
                { href: "/aom-retold/tournois",  label: "Tournois",   desc: "Compétitions et classements", icon: Trophy },
              ].map(({ href, label, desc, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-4 bg-surface border border-border-site hover:border-amber-600/40 rounded-lg p-5 transition-colors group"
                >
                  <div className="w-10 h-10 rounded-lg bg-amber-900/30 border border-amber-800/40 flex items-center justify-center text-amber-400 shrink-0 group-hover:bg-amber-900/50 transition-colors">
                    <Icon size={18} />
                  </div>
                  <div>
                    <div className="font-bold text-foreground text-sm group-hover:text-amber-400 transition-colors">{label}</div>
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

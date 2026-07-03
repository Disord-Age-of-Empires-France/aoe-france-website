import Image from "next/image";
import Link from "next/link";
import { Calendar, ChevronRight, Sword, Globe, Users, Trophy, BookOpen, Star } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getPublishedArticles, getSettings } from "@/lib/db";
import BuyWidget from "@/components/BuyWidget";
import { getSession } from "@/lib/session";
import { gateFeature } from "@/lib/public-access";
import type { Article } from "@/lib/db";
import CivIcon from "@/components/aoe4/CivIcon";

export const metadata = {
  title: "Age of Empires IV — Présentation | AoE France",
  description: "Découvrez Age of Empires IV : histoire, civilisations, campagnes et multijoueur. Tout sur le quatrième opus de la saga légendaire.",
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

// ─── Données ──────────────────────────────────────────────────────────────────

const KEY_FEATURES = [
  {
    icon: Sword,
    title: "Campagnes historiques",
    description: "4 campagnes épiques couvrant des siècles d'histoire : la Guerre de Cent Ans, la Reconquista, la montée de Moscou et l'Empire mongol.",
  },
  {
    icon: Globe,
    title: "23 civilisations",
    description: "Des civilisations profondes et asymétriques, chacune avec ses propres unités, technologies et style de jeu unique.",
  },
  {
    icon: Users,
    title: "Multijoueur compétitif",
    description: "Un système de classement ELO, des parties classées 1v1 jusqu'au 4v4, et une scène esport active avec des tournois réguliers.",
  },
  {
    icon: Trophy,
    title: "Contenu régulier",
    description: "Des saisons continues apportent de nouvelles civilisations variantes, modes de jeu et événements tout au long de l'année.",
  },
  {
    icon: BookOpen,
    title: "Narration immersive",
    description: "Des documentaires en jeu avec de vraies archives historiques, des experts et des images de lieux authentiques.",
  },
  {
    icon: Star,
    title: "Art directionnel unique",
    description: "Un style visuel lisible en compétition tout en restant magnifique, avec des effets météo et des saisons dynamiques.",
  },
];

// slug = nom du fichier dans /public/aoe4/civs/ (sans extension)
const CIVS_BASE = [
  { name: "Anglais",           slug: "english",  description: "Archers longbowmen redoutables et économie solide basée sur les moulins." },
  { name: "Chinois",           slug: "chinese",  description: "Poudre à canon précoce, Dynasties et technologies uniques par âge." },
  { name: "Sultanat de Delhi", slug: "delhi",    description: "Technologies libres grâce aux mosquées savantes et éléphants de guerre." },
  { name: "Français",          slug: "french",   description: "Cavalerie d'élite, château avancé et économie commerciale puissante." },
  { name: "Saint-Empire",      slug: "hre",      description: "Reliques sacrées, Prelats pour booster les villageois et Landsknechts." },
  { name: "Mongols",           slug: "mongols",  description: "Armée nomade entièrement mobile, campements déplaçables et cavalerie éclair." },
  { name: "Rus",               slug: "rus",      description: "Économie forestière, boyards cavaliers et tanière de chasseurs." },
  { name: "Abbassides",        slug: "abbasid",  description: "Arbre technologique Maison de la Sagesse, unités de chameau et adaptation." },
];

const CIVS_DLC = [
  { name: "Ottomans",          slug: "ottomans", description: "Janissaires d'élite, bâtiments gratuits générés automatiquement et Vizir Points." },
  { name: "Maliens",           slug: "malians",  description: "Commerce transsaharien, Donso et construction sans bois grâce à l'argile." },
  { name: "Japonais",          slug: "japanese", description: "Samouraïs, Shinto et monastères bouddhistes pour des bonus économiques." },
  { name: "Byzantins",         slug: "byzantine",description: "Défense de Catafalque, Mercenaires et capacités de troc entre modes." },
];

const CIVS_VARIANTS_1 = [
  { name: "Jeanne d'Arc",       slug: "jeanne",    description: "Version héroïque des Français centrée sur Jeanne comme unité principale." },
  { name: "Ordre du Dragon",    slug: "dragon",    description: "Chevaliers du Saint-Empire avec vampirisme et technologies draconiques." },
  { name: "Ayyoubides",         slug: "ayyubids",  description: "Agilité défensive et offres commerciales uniques dérivées des Abbassides." },
  { name: "Héritage de Zhu Xi", slug: "zhuxi",     description: "Légistes Song et production de poudre à canon amplifiée des Chinois." },
];

const CIVS_VARIANTS_2 = [
  { name: "Horde d'Or",         slug: "golden-horde", description: "Variante mongole spécialisée dans les raids éclair et la domination de la steppe." },
  { name: "House of Lancaster", slug: "lancaster",    description: "Variante anglaise issue de la guerre des Deux-Roses, centrée sur l'infanterie disciplinée." },
  { name: "Dynastie Tughlaq",   slug: "tughlaq",      description: "Variante du Sultanat de Delhi avec architecture défensive massive et administration centralisée." },
  { name: "Sengoku Daimyo",     slug: "sengoku",      description: "Variante japonaise du Japon féodal en guerre, maîtresse des seigneurs de guerre et des clans." },
  { name: "Macédoniens",        slug: "macedonian",   description: "Héritiers d'Alexandre, maîtres de la phalange et de la guerre de mouvement rapide." },
  { name: "Chevaliers du Temple", slug: "templar",    description: "Ordre militaire chrétien alliant foi inébranlable et puissance de combat redoutable." },
  { name: "Dynastie Jin",       slug: "jin",          description: "Chine du nord sous les Jurchen, mêlant traditions chinoises et techniques de guerre nomades." },
];

// ─── Composant article ─────────────────────────────────────────────────────────

function ArticleCard({ article }: { article: Article }) {
  return (
    <Link
      href={`/actualites/${article.id}`}
      className="flex gap-4 p-4 rounded-lg bg-surface border border-border-site hover:border-blue-600/40 transition-all group"
    >
      <div className="shrink-0 w-20 h-16 rounded bg-surface-2 border border-border-site overflow-hidden">
        {article.thumbnail && (
          <img src={article.thumbnail} alt={article.title} loading="lazy" className="w-full h-full object-cover" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap gap-1 mb-1.5">
          {article.categories.map((cat) => (
            <span key={cat} className={`text-[10px] font-bold tracking-wider px-2 py-0.5 rounded ${BADGE_CLASSES[article.badgeColor] ?? BADGE_CLASSES.blue}`}>
              {cat}
            </span>
          ))}
        </div>
        <h3 className="font-bold text-sm text-foreground group-hover:text-blue-400 transition-colors leading-snug line-clamp-2 mb-1">
          {article.title}
        </h3>
        <p className="text-[11px] text-faint">{formatDate(article.date)}</p>
      </div>
    </Link>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function Aoe4PresentationPage() {
  const [allArticles, settings, session] = await Promise.all([
    getPublishedArticles(),
    getSettings(),
    getSession(),
  ]);

  gateFeature(settings, session, settings.features.games.aoe4);

  const articles = allArticles
    .filter((a) => a.categories.includes("AOE IV"))
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
          <Image src="/aoe4/bg.jpg" alt="" fill className="object-cover object-center opacity-40" priority />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(59,130,246,0.15)_0%,_transparent_60%)]" />
          <div className="absolute top-0 right-0 w-px h-full bg-gradient-to-b from-blue-500/20 via-transparent to-transparent" />

          <div className="relative max-w-7xl mx-auto px-4 py-16 md:py-24">
            <div className="max-w-3xl">
              {/* Breadcrumb */}
              <div className="flex items-center gap-2 text-[11px] text-faint font-semibold tracking-widest uppercase mb-6">
                <Link href="/" className="hover:text-[#c8a32e] transition-colors">Accueil</Link>
                <ChevronRight size={12} />
                <span className="text-blue-400">AOE IV</span>
                <ChevronRight size={12} />
                <span>Présentation</span>
              </div>

              <div className="flex items-center gap-3 mb-4">
                <span className="text-[10px] font-bold tracking-widest text-blue-400 bg-blue-900/40 border border-blue-800/50 px-3 py-1 rounded">
                  AOE IV
                </span>
                <span className="text-[10px] text-faint tracking-wider">28 octobre 2021</span>
              </div>

              <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground leading-none mb-3">
                AGE OF EMPIRES IV
              </h1>
              <div className="w-16 h-1 bg-blue-500 rounded mb-6" />

              <p className="text-muted text-lg leading-relaxed max-w-2xl mb-8">
                Le retour triomphal d&apos;une saga légendaire. Développé par{" "}
                <strong className="text-foreground">Relic Entertainment</strong> et{" "}
                <strong className="text-foreground">World&apos;s Edge</strong>, Age of Empires IV
                allie la profondeur stratégique de la série à une narration historique inédite
                et un design asymétrique poussé.
              </p>

              {/* Meta infos */}
              <div className="flex flex-wrap gap-4 text-sm">
                {[
                  { label: "Développeur", value: "Relic / World's Edge" },
                  { label: "Éditeur",     value: "Xbox Game Studios" },
                  { label: "Sortie",      value: "28 oct. 2021" },
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
            <h2 className="text-xl font-bold tracking-[0.12em] text-foreground uppercase mb-2">
              Le jeu
            </h2>
            <div className="w-10 h-0.5 bg-blue-500 mb-8" />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 flex flex-col gap-4 text-muted leading-relaxed">
                <p>
                  Age of Empires IV est un jeu de stratégie en temps réel qui vous transporte au cœur
                  du Moyen Âge, couvrant plus de <strong className="text-foreground">500 ans d&apos;histoire</strong> entre
                  le IX<sup>e</sup> et le XV<sup>e</sup> siècle. Quatrième opus principal de la série mythique
                  lancée en 1997, il revient aux origines médiévales tout en modernisant profondément
                  la formule.
                </p>
                <p>
                  Avec <strong className="text-foreground">23 civilisations</strong> profondément asymétriques, chaque
                  peuple dispose de sa propre identité de jeu, d&apos;unités exclusives et d&apos;arbres
                  technologiques distincts. Contrairement à ses prédécesseurs, AoE IV mise sur
                  la <strong className="text-foreground">lisibilité compétitive</strong> sans sacrifier la richesse
                  stratégique.
                </p>
                <p>
                  Les <strong className="text-foreground">campagnes historiques</strong> intègrent de véritables
                  documentaires filmés dans des lieux emblématiques, avec des historiens et
                  des experts qui contextualisent chaque bataille. Une approche unique qui rend
                  l&apos;apprentissage de l&apos;histoire aussi captivant que le jeu lui-même.
                </p>
                <div className="mt-auto">
                  <BuyWidget game="aoe4" steamAppId={settings.steamAppIds.aoe4} promoText={settings.promoTexts.aoe4} compact />
                </div>
              </div>

              <div className="space-y-3">
                <div className="bg-surface border border-border-site rounded-lg p-5">
                  <p className="text-[10px] font-bold tracking-widest text-faint uppercase mb-4">Points clés</p>
                  <ul className="space-y-3">
                    {[
                      "23 civilisations asymétriques",
                      "4 campagnes historiques",
                      "Documentaires intégrés",
                      "Classement ELO compétitif",
                      "Saisons avec nouveau contenu",
                      "Support Xbox et cross-play",
                    ].map((point) => (
                      <li key={point} className="flex items-start gap-2.5 text-sm text-muted">
                        <span className="text-blue-400 mt-0.5 shrink-0">◆</span>
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>

                <Link
                  href="/aoe4/civilisations"
                  className="flex items-center justify-between gap-2 w-full bg-blue-900/30 border border-blue-800/50 hover:border-blue-500/60 text-blue-300 hover:text-blue-200 rounded-lg px-5 py-3.5 text-sm font-semibold transition-colors group"
                >
                  <span>Voir toutes les civilisations</span>
                  <ChevronRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
                </Link>
                <Link
                  href="/aoe4/guides"
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
            <h2 className="text-xl font-bold tracking-[0.12em] text-foreground uppercase mb-2">
              Points forts
            </h2>
            <div className="w-10 h-0.5 bg-blue-500 mb-8" />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {KEY_FEATURES.map(({ icon: Icon, title, description }) => (
                <div key={title} className="bg-surface border border-border-site rounded-lg p-5 hover:border-blue-600/30 transition-colors">
                  <div className="w-9 h-9 rounded-lg bg-blue-900/40 border border-blue-800/40 flex items-center justify-center text-blue-400 mb-4">
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
                href="/aoe4/civilisations"
                className="text-[11px] text-faint hover:text-blue-400 transition-colors font-semibold tracking-wider flex items-center gap-1"
              >
                Toutes les civs <ChevronRight size={12} />
              </Link>
            </div>
            <div className="w-10 h-0.5 bg-blue-500 mb-8" />

            {/* Civs de base */}
            <div className="mb-2">
              <p className="text-[10px] font-bold tracking-widest text-faint uppercase mb-4 flex items-center gap-2">
                <span className="w-4 h-px bg-border-site inline-block" />
                Jeu de base — 8 civilisations
                <span className="flex-1 h-px bg-border-site inline-block" />
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {CIVS_BASE.map(({ name, slug, description }) => (
                  <div key={name} className="bg-surface border border-border-site rounded-lg p-4 hover:border-blue-600/30 transition-colors">
                    <div className="mb-3"><CivIcon slug={slug} name={name} /></div>
                    <h3 className="font-bold text-foreground text-sm mb-1.5">{name}</h3>
                    <p className="text-faint text-xs leading-relaxed">{description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* DLC */}
            <div className="mb-2 mt-6">
              <p className="text-[10px] font-bold tracking-widest text-faint uppercase mb-4 flex items-center gap-2">
                <span className="w-4 h-px bg-border-site inline-block" />
                The Sultans Ascend — 4 civilisations
                <span className="flex-1 h-px bg-border-site inline-block" />
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {CIVS_DLC.map(({ name, slug, description }) => (
                  <div key={name} className="bg-surface border border-border-site rounded-lg p-4 hover:border-blue-600/30 transition-colors">
                    <div className="mb-3"><CivIcon slug={slug} name={name} /></div>
                    <h3 className="font-bold text-foreground text-sm mb-1.5">{name}</h3>
                    <p className="text-faint text-xs leading-relaxed">{description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Variantes vague 1 */}
            <div className="mt-6">
              <p className="text-[10px] font-bold tracking-widest text-faint uppercase mb-4 flex items-center gap-2">
                <span className="w-4 h-px bg-border-site inline-block" />
                Civilisations variantes — saisons 1
                <span className="flex-1 h-px bg-border-site inline-block" />
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {CIVS_VARIANTS_1.map(({ name, slug, description }) => (
                  <div key={name} className="bg-surface border border-border-site rounded-lg p-4 border-dashed hover:border-blue-600/30 transition-colors">
                    <div className="mb-3"><CivIcon slug={slug} name={name} /></div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <h3 className="font-bold text-foreground text-sm">{name}</h3>
                      <span className="text-[9px] font-bold tracking-wider text-blue-400 bg-blue-900/40 px-1.5 py-0.5 rounded">VARIANTE</span>
                    </div>
                    <p className="text-faint text-xs leading-relaxed">{description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Variantes vague 2 */}
            <div className="mt-6">
              <p className="text-[10px] font-bold tracking-widest text-faint uppercase mb-4 flex items-center gap-2">
                <span className="w-4 h-px bg-border-site inline-block" />
                Civilisations variantes — saisons 2
                <span className="flex-1 h-px bg-border-site inline-block" />
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {CIVS_VARIANTS_2.map(({ name, slug, description }) => (
                  <div key={name} className="bg-surface border border-border-site rounded-lg p-4 border-dashed hover:border-blue-600/30 transition-colors">
                    <div className="mb-3"><CivIcon slug={slug} name={name} /></div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <h3 className="font-bold text-foreground text-sm">{name}</h3>
                      <span className="text-[9px] font-bold tracking-wider text-blue-400 bg-blue-900/40 px-1.5 py-0.5 rounded">VARIANTE</span>
                    </div>
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
                Actualités AOE IV
              </h2>
              <Link
                href="/actualites"
                className="text-[11px] text-faint hover:text-[#c8a32e] transition-colors font-semibold tracking-wider flex items-center gap-1"
              >
                Toutes les actualités <ChevronRight size={12} />
              </Link>
            </div>
            <div className="w-10 h-0.5 bg-blue-500 mb-8" />

            {articles.length === 0 ? (
              <div className="bg-surface border border-border-site rounded-lg p-12 text-center">
                <Calendar size={28} className="text-faint mx-auto mb-3" />
                <p className="text-faint text-sm">Aucune actualité AOE IV publiée pour l&apos;instant.</p>
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

          {/* ── Navigation sections ─────────────────────────────────────────── */}
          <section className="border-t border-border-site pt-10">
            <p className="text-[10px] font-bold tracking-widest text-faint uppercase mb-6">
              Explorer AOE IV
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { href: "/aoe4/civilisations", label: "Civilisations", desc: "Toutes les civs en détail", icon: Globe },
                { href: "/aoe4/guides",        label: "Guides",        desc: "Stratégies et Build Orders", icon: BookOpen },
                { href: "/aoe4/tournois",      label: "Tournois",      desc: "Compétitions et classements", icon: Trophy },
              ].map(({ href, label, desc, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-4 bg-surface border border-border-site hover:border-blue-600/40 rounded-lg p-5 transition-colors group"
                >
                  <div className="w-10 h-10 rounded-lg bg-blue-900/30 border border-blue-800/40 flex items-center justify-center text-blue-400 shrink-0 group-hover:bg-blue-900/50 transition-colors">
                    <Icon size={18} />
                  </div>
                  <div>
                    <div className="font-bold text-foreground text-sm group-hover:text-blue-400 transition-colors">{label}</div>
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

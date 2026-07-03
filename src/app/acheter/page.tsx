import { getSettings, getStoreLinksByGame } from "@/lib/db";
import { getSession } from "@/lib/session";
import { getSteamPrice } from "@/lib/steam-price";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ExternalLink, Tag, Zap, ShoppingCart } from "lucide-react";
import Link from "next/link";
import type { StoreLink } from "@/lib/db";

export const metadata = {
  title: "Acheter — Age of Empires France",
  description: "Retrouvez tous les liens pour acheter les jeux Age of Empires : Steam, Xbox Game Pass, Microsoft Store, PlayStation Store et revendeurs partenaires.",
};

const GAMES = [
  { id: "aoe2", label: "AoE II: DE",   subtitle: "Age of Empires II: Definitive Edition", accent: "text-purple-400", border: "border-purple-500/30" },
  { id: "aoe3", label: "AoE III: DE",  subtitle: "Age of Empires III: Definitive Edition", accent: "text-green-400",  border: "border-green-500/30"  },
  { id: "aoe4", label: "AoE IV",       subtitle: "Age of Empires IV",                       accent: "text-blue-400",   border: "border-blue-500/30"   },
  { id: "aom",  label: "AoM: Retold",  subtitle: "Age of Mythology: Retold",                accent: "text-amber-400",  border: "border-amber-500/30"  },
];

const STORE_ICON: Record<string, string> = {
  steam: "🎮", xbox: "🟢", ms_store: "🪟", ps_store: "🎮", game_pass: "✅", other: "🛒",
};

const STORE_COLOR: Record<string, string> = {
  steam:     "border-[#1b2838]/60 hover:border-[#66c0f4]/40 bg-[#1b2838]/20",
  xbox:      "border-[#107c10]/40 hover:border-[#107c10]/70 bg-[#107c10]/10",
  ms_store:  "border-blue-500/30  hover:border-blue-400/50  bg-blue-900/10",
  ps_store:  "border-blue-700/40  hover:border-blue-500/50  bg-blue-800/10",
  game_pass: "border-[#107c10]/40 hover:border-[#107c10]/70 bg-[#107c10]/10",
  other:     "border-border-site   hover:border-[#c8a32e]/30 bg-surface-2",
};

interface EnrichedLink { link: StoreLink; steamFinal?: string; steamInitial?: string; discount?: number }

export default async function AcheterPage() {
  const [settings, session] = await Promise.all([getSettings(), getSession()]);

  // Fetch all links + Steam prices in parallel
  const results = await Promise.all(
    GAMES.map(async game => {
      const [links, steamPrice] = await Promise.all([
        getStoreLinksByGame(game.id, true),
        getSteamPrice(settings.steamAppIds[game.id as keyof typeof settings.steamAppIds]),
      ]);
      const enriched: EnrichedLink[] = links.map(link => {
        if (link.storeType === "steam" && steamPrice) {
          return {
            link,
            steamFinal:   steamPrice.final,
            steamInitial: steamPrice.discountPercent > 0 ? steamPrice.initial : undefined,
            discount:     steamPrice.discountPercent > 0 ? steamPrice.discountPercent : undefined,
          };
        }
        return { link };
      });
      return { ...game, enriched, promoText: settings.promoTexts[game.id as keyof typeof settings.promoTexts] };
    })
  );

  return (
    <>
      <Navbar
        discordInvite={settings.discordInvite}
        session={session ? { username: session.username, role: session.role } : undefined}
        features={{ ...settings.features, navItems: settings.navItems }}
        maintenanceActive={settings.maintenance.active}
        maintenanceEndAt={settings.maintenance.endAt}
      />

      <main className="flex-1 pt-24 pb-20">
        {/* Hero */}
        <section className="max-w-4xl mx-auto px-4 text-center py-14">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#c8a32e]/30 bg-[#c8a32e]/5 text-[#c8a32e] text-xs font-bold tracking-widest uppercase mb-6">
            <ShoppingCart size={11} /> Boutique
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-foreground leading-tight mb-4">
            Acheter un jeu
            <span className="text-[#c8a32e]"> Age of Empires</span>
          </h1>
          <p className="text-muted text-lg max-w-xl mx-auto">
            Retrouvez les meilleures offres sur toutes les plateformes — stores officiels et revendeurs partenaires.
          </p>
        </section>

        {/* Grille des jeux */}
        <div className="max-w-5xl mx-auto px-4 space-y-8">
          {results.map(({ id, label, subtitle, accent, border, enriched, promoText }) => {
            if (enriched.length === 0) return null;
            const hasDiscount = enriched.some(e => (e.discount ?? 0) > 0);

            return (
              <div key={id} className={`bg-surface border ${border} rounded-2xl overflow-hidden`}>
                {/* Header */}
                <div className="px-6 py-4 border-b border-border-site flex items-center justify-between">
                  <div>
                    <p className={`text-[10px] font-bold tracking-[0.2em] uppercase ${accent} mb-0.5`}>{label}</p>
                    <p className="text-sm font-semibold text-foreground">{subtitle}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {hasDiscount && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                        <Zap size={9} fill="currentColor" /> En promo
                      </span>
                    )}
                    <Tag size={14} className={accent} />
                  </div>
                </div>

                <div className="p-6">
                  {/* Bannière promo manuelle */}
                  {promoText && (
                    <div className="mb-4 px-4 py-2.5 rounded-lg bg-[#c8a32e]/10 border border-[#c8a32e]/30 text-[#c8a32e] text-sm font-semibold">
                      🔥 {promoText}
                    </div>
                  )}

                  <div className="grid sm:grid-cols-2 gap-2">
                    {enriched.map(({ link, steamFinal, steamInitial, discount }) => {
                      const displayPrice = steamFinal ?? link.priceDisplay;
                      const colorCls = STORE_COLOR[link.storeType] ?? STORE_COLOR.other;

                      return (
                        <a
                          key={link.id}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all group ${colorCls}`}
                        >
                          <span className="text-lg shrink-0">{STORE_ICON[link.storeType] ?? "🛒"}</span>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-semibold text-foreground text-sm">{link.storeName}</span>
                              {link.badge && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#c8a32e]/15 text-[#c8a32e] border border-[#c8a32e]/25">{link.badge}</span>
                              )}
                              {link.isGamePass && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-green-900/40 text-green-400 border border-green-500/25">Game Pass</span>
                              )}
                              {discount && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-900/40 text-emerald-400 border border-emerald-500/25">-{discount}%</span>
                              )}
                            </div>
                            {link.isAffiliate && <p className="text-[10px] text-faint mt-0.5">* Lien partenaire</p>}
                          </div>

                          {displayPrice && (
                            <div className="text-right shrink-0">
                              <div className="text-sm font-bold text-foreground">{displayPrice}</div>
                              {steamInitial && <div className="text-xs text-faint line-through">{steamInitial}</div>}
                            </div>
                          )}

                          <ExternalLink size={12} className="text-faint group-hover:text-[#c8a32e] transition-colors shrink-0" />
                        </a>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}

          {results.every(r => r.enriched.length === 0) && (
            <div className="text-center py-20">
              <ShoppingCart size={32} className="text-faint mx-auto mb-3" />
              <p className="text-faint">Les liens d&apos;achat seront bientôt disponibles.</p>
            </div>
          )}

          {/* Note légale affiliés */}
          {results.some(r => r.enriched.some(e => e.link.isAffiliate)) && (
            <p className="text-center text-[11px] text-faint pt-2">
              * Certains liens sont des liens partenaires. AoE France peut percevoir une commission sans surcoût pour vous.
            </p>
          )}
        </div>

        <div className="text-center mt-12">
          <Link href="/" className="text-xs text-faint hover:text-[#c8a32e] transition-colors">← Retour à l&apos;accueil</Link>
        </div>
      </main>

      <Footer />
    </>
  );
}

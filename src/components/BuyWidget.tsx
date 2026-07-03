import { ExternalLink, Tag, Zap, ShoppingCart } from "lucide-react";
import { getStoreLinksByGame } from "@/lib/db";
import { getSteamPrice } from "@/lib/steam-price";
import type { StoreLink } from "@/lib/db";

const STORE_ICON: Record<string, string> = {
  steam:     "🎮",
  xbox:      "🟢",
  ms_store:  "🪟",
  ps_store:  "🎮",
  game_pass: "✅",
  other:     "🛒",
};

const STORE_COLOR: Record<string, string> = {
  steam:     "border-[#1b2838]/60 hover:border-[#66c0f4]/40 bg-[#1b2838]/20",
  xbox:      "border-[#107c10]/40 hover:border-[#107c10]/70 bg-[#107c10]/10",
  ms_store:  "border-blue-500/30  hover:border-blue-400/50  bg-blue-900/10",
  ps_store:  "border-blue-700/40  hover:border-blue-500/50  bg-blue-800/10",
  game_pass: "border-[#107c10]/40 hover:border-[#107c10]/70 bg-[#107c10]/10",
  other:     "border-border-site   hover:border-[#c8a32e]/30 bg-surface-2",
};

interface Props {
  game:        string;
  steamAppId?: string;
  promoText?:  string;
  compact?:    boolean;
}

interface EnrichedLink {
  link:          StoreLink;
  steamFinal?:   string;
  steamInitial?: string;
  discount?:     number;
}

export default async function BuyWidget({ game, steamAppId, promoText, compact = false }: Props) {
  const links = await getStoreLinksByGame(game, true);
  if (links.length === 0) return null;

  const steamPrice = steamAppId ? await getSteamPrice(steamAppId) : null;

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

  const hasDiscount = enriched.some(e => (e.discount ?? 0) > 0);

  // ── Format compact (pages de présentation) ────────────────────────────────
  if (compact) {
    return (
      <div className="bg-surface/60 border border-border-site rounded-xl px-4 py-3">
        <div className="flex items-center gap-2 mb-2.5">
          <ShoppingCart size={13} className="text-[#c8a32e]" />
          <span className="text-xs font-bold text-faint uppercase tracking-wide">Acheter le jeu</span>
          {promoText && (
            <span className="text-[11px] font-semibold text-[#c8a32e] bg-[#c8a32e]/10 border border-[#c8a32e]/25 px-2 py-0.5 rounded-full">
              🔥 {promoText}
            </span>
          )}
          {hasDiscount && !promoText && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
              <Zap size={9} fill="currentColor" /> En promo
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {enriched.map(({ link, steamFinal, steamInitial, discount }) => {
            const displayPrice = steamFinal ?? link.priceDisplay;
            const colorCls = STORE_COLOR[link.storeType] ?? STORE_COLOR.other;

            return (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-2.5 px-3.5 py-2 rounded-lg border transition-all group ${colorCls}`}
              >
                <span className="text-lg leading-none">{STORE_ICON[link.storeType] ?? "🛒"}</span>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-semibold text-foreground text-sm leading-tight">{link.storeName}</span>
                    {link.isGamePass && (
                      <span className="text-[10px] font-bold px-1 py-0.5 rounded bg-green-900/40 text-green-400 border border-green-500/25 leading-none">GP</span>
                    )}
                    {discount && (
                      <span className="text-[10px] font-bold text-emerald-400 leading-none">-{discount}%</span>
                    )}
                  </div>
                  {displayPrice && (
                    <div className="text-xs text-faint leading-tight mt-0.5">
                      <span className="font-bold text-foreground">{displayPrice}</span>
                      {steamInitial && <span className="line-through ml-1">{steamInitial}</span>}
                    </div>
                  )}
                </div>
                <ExternalLink size={12} className="text-faint group-hover:text-[#c8a32e] transition-colors shrink-0 ml-0.5" />
              </a>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Format complet (page /acheter) ────────────────────────────────────────
  return (
    <section className="bg-surface border border-border-site rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-foreground flex items-center gap-2">
          <Tag size={16} className="text-[#c8a32e]" />
          Acheter le jeu
        </h2>
        {hasDiscount && (
          <span className="flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
            <Zap size={10} fill="currentColor" /> En promo
          </span>
        )}
      </div>

      {promoText && (
        <div className="mb-4 px-4 py-2.5 rounded-lg bg-[#c8a32e]/10 border border-[#c8a32e]/30 text-[#c8a32e] text-sm font-semibold">
          🔥 {promoText}
        </div>
      )}

      <div className="space-y-2">
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

              <ExternalLink size={13} className="text-faint group-hover:text-[#c8a32e] transition-colors shrink-0" />
            </a>
          );
        })}
      </div>
    </section>
  );
}

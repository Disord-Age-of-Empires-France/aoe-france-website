export interface SteamPriceInfo {
  initial:         string;
  final:           string;
  discountPercent: number;
  isFree:          boolean;
}

export async function getSteamPrice(appId: string): Promise<SteamPriceInfo | null> {
  if (!appId) return null;
  try {
    const res = await fetch(
      `https://store.steampowered.com/api/appdetails?appids=${appId}&cc=fr&filters=price_overview,is_free`,
      { next: { revalidate: 1800 } }
    );
    if (!res.ok) return null;
    const json = await res.json() as Record<string, { success: boolean; data: Record<string, unknown> }>;
    const entry = json[appId];
    if (!entry?.success) return null;
    const data = entry.data;
    if (data.is_free) return { initial: "Gratuit", final: "Gratuit", discountPercent: 0, isFree: true };
    const po = data.price_overview as Record<string, unknown> | undefined;
    if (!po) return null;
    return {
      initial:         String(po.initial_formatted  ?? ""),
      final:           String(po.final_formatted    ?? ""),
      discountPercent: Number(po.discount_percent   ?? 0),
      isFree:          false,
    };
  } catch {
    return null;
  }
}

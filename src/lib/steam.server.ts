/** جلب بيانات متجر Steam من الخادم (بأسعار أوكرانيا UAH) */

const CC = "ua";

export type SteamItem = {
  appId: number;
  name: string;
  image: string;
  uahFinal: number; // بالسنت
  uahInitial: number;
  discount: number;
  /** true فقط إذا أكد المتجر أن اللعبة مجانية */
  isFree?: boolean;
  /** true إذا كانت اللعبة لم تصدر بعد */
  comingSoon?: boolean;
};

export type SteamDetails = SteamItem & {
  description: string;
  developers: string[];
  genres: string[];
  /** YYYY-MM-DD أو null إذا لم يُعلن */
  released: string | null;
  comingSoon: boolean;
};

const safeJson = async (url: string): Promise<unknown> => {
  const res = await fetch(url, { headers: { "accept-language": "ar,en" } });
  if (!res.ok) throw new Error(`Steam ${res.status}`);
  return res.json();
};

type RawSpecial = {
  id: number;
  name: string;
  header_image?: string;
  large_capsule_image?: string;
  final_price?: number;
  original_price?: number | null;
  discount_percent?: number;
};

export async function fetchSpecials(): Promise<SteamItem[]> {
  const data = (await safeJson(
    `https://store.steampowered.com/api/featuredcategories?cc=${CC}&l=arabic`,
  )) as Record<string, { items?: RawSpecial[] }>;

  const buckets = ["specials", "top_sellers", "new_releases"];
  const seen = new Set<number>();
  const out: SteamItem[] = [];

  for (const key of buckets) {
    for (const it of data[key]?.items ?? []) {
      if (!it.id || seen.has(it.id)) continue;
      seen.add(it.id);
      out.push({
        appId: it.id,
        name: it.name,
        image:
          it.header_image ??
          it.large_capsule_image ??
          `https://cdn.cloudflare.steamstatic.com/steam/apps/${it.id}/header.jpg`,
        uahFinal: it.final_price ?? 0,
        uahInitial: it.original_price ?? it.final_price ?? 0,
        discount: it.discount_percent ?? 0,
        isFree: false,
      });
    }
  }
  return out;
}

type RawSearch = {
  items?: {
    id: number;
    name: string;
    tiny_image?: string;
    price?: { initial?: number; final?: number };
  }[];
};

export async function searchSteam(term: string): Promise<SteamItem[]> {
  const q = term.trim();
  if (!q) return [];
  const data = (await safeJson(
    `https://store.steampowered.com/api/storesearch?term=${encodeURIComponent(q)}&cc=${CC}&l=arabic`,
  )) as RawSearch;

  return (data.items ?? []).map((it) => {
    const final = it.price?.final ?? 0;
    const initial = it.price?.initial ?? final;
    return {
      appId: it.id,
      name: it.name,
      image: `https://cdn.cloudflare.steamstatic.com/steam/apps/${it.id}/header.jpg`,
      uahFinal: final,
      uahInitial: initial,
      discount: initial > final && initial > 0 ? Math.round((1 - final / initial) * 100) : 0,
      isFree: false,
    };
  });
}

const strip = (html: string) => html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

export async function fetchAppDetails(appId: number): Promise<SteamDetails | null> {
  const data = (await safeJson(
    `https://store.steampowered.com/api/appdetails?appids=${appId}&cc=${CC}&l=arabic`,
  )) as Record<string, { success?: boolean; data?: Record<string, unknown> }>;

  const node = data[String(appId)];
  if (!node?.success || !node.data) return null;
  const d = node.data as {
    name: string;
    header_image?: string;
    short_description?: string;
    is_free?: boolean;
    developers?: string[];
    genres?: { description: string }[];
    price_overview?: { initial: number; final: number; discount_percent: number };
    release_date?: { coming_soon?: boolean; date?: string };
  };

  const rawDate = d.release_date?.date ?? "";
  const parsed = rawDate ? new Date(rawDate) : null;
  const released =
    parsed && !Number.isNaN(parsed.getTime()) ? parsed.toISOString().slice(0, 10) : null;

  return {
    appId,
    name: d.name,
    image:
      d.header_image ?? `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/header.jpg`,
    uahFinal: d.price_overview?.final ?? 0,
    uahInitial: d.price_overview?.initial ?? d.price_overview?.final ?? 0,
    discount: d.price_overview?.discount_percent ?? 0,
    isFree: Boolean(d.is_free),
    description: strip(d.short_description ?? ""),
    developers: d.developers ?? [],
    genres: (d.genres ?? []).map((g) => g.description),
    released,
    comingSoon: Boolean(d.release_date?.coming_soon),
  };
}

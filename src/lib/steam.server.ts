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
  /** YYYY-MM-DD أو null إذا لم يُعلن */
  released?: string | null;
};

export type SteamDetails = SteamItem & {
  description: string;
  /** لقطات رسمية من المتجر (وإطارات الفيديوهات الدعائية) */
  screenshots: string[];
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

type RawSearchItem = {
  id: number;
  name: string;
  type?: string;
  tiny_image?: string;
  price?: { initial?: number; final?: number };
};

type RawSearch = { items?: RawSearchItem[] };

const ASSETS = "https://shared.akamai.steamstatic.com/store_item_assets/steam";

/**
 * ستيم يخزّن صور الحزم (bundle/sub/package) تحت مسار subs وليس apps.
 * نرقّي الصورة المصغّرة إلى غلاف كامل، وإلا نبني رابط CDN حسب النوع.
 */
export const storeImage = (it: { id: number; type?: string; tiny_image?: string }) => {
  const tiny = it.tiny_image;
  if (tiny) {
    const full = tiny
      .replace("capsule_sm_120", "header")
      .replace("capsule_231x87", "header")
      .replace("capsule_184x69", "header");
    if (full) return full.startsWith("//") ? `https:${full}` : full;
  }
  const kind = (it.type ?? "app").toLowerCase();
  if (kind === "app") return `${ASSETS}/apps/${it.id}/header.jpg`;
  return `${ASSETS}/subs/${it.id}/header.jpg`;
};


const parseDate = (raw: string | undefined | null) => {
  const parsed = raw ? new Date(raw) : null;
  return parsed && !Number.isNaN(parsed.getTime()) ? parsed.toISOString().slice(0, 10) : null;
};

export async function searchSteam(term: string): Promise<SteamItem[]> {
  const q = term.trim();
  if (!q) return [];
  const data = (await safeJson(
    `https://store.steampowered.com/api/storesearch?term=${encodeURIComponent(q)}&cc=${CC}&l=arabic`,
  )) as RawSearch;

  const base: SteamItem[] = (data.items ?? []).map((it) => {
    const final = it.price?.final ?? 0;
    const initial = it.price?.initial ?? final;
    return {
      appId: it.id,
      name: it.name,
      image: storeImage(it),
      uahFinal: final,
      uahInitial: initial,
      discount: initial > final && initial > 0 ? Math.round((1 - final / initial) * 100) : 0,
      isFree: false,
    };
  });

  // إثراء النتائج بتاريخ الإصدار من صفحة المتجر (بالتوازي ومع تجاهل الأخطاء)
  const enriched = await Promise.all(
    base.slice(0, 16).map(async (item) => {
      const d = await fetchAppDetails(item.appId).catch(() => null);
      if (!d) return item;
      return {
        ...item,
        released: d.released,
        comingSoon: d.comingSoon,
        isFree: Boolean(d.isFree),
        uahFinal: d.uahFinal || item.uahFinal,
        uahInitial: d.uahInitial || item.uahInitial,
        discount: d.discount || item.discount,
      };
    }),
  );
  return [...enriched, ...base.slice(16)];
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
    screenshots?: { path_thumbnail?: string; path_full?: string }[];
    movies?: { thumbnail?: string }[];
    release_date?: { coming_soon?: boolean; date?: string };
  };

  const released = parseDate(d.release_date?.date);
  const shots = [
    ...(d.screenshots ?? []).map((s) => s.path_full || s.path_thumbnail || ""),
    ...(d.movies ?? []).map((m) => m.thumbnail || ""),
  ].filter(Boolean);

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
    screenshots: Array.from(new Set(shots)),
    developers: d.developers ?? [],
    genres: (d.genres ?? []).map((g) => g.description),
    released,
    comingSoon: Boolean(d.release_date?.coming_soon),
  };
}

/** أرفف المتجر مصنّفة (عروض / الأكثر مبيعًا / وصل حديثًا) */
export type StoreShelves = {
  specials: SteamItem[];
  topSellers: SteamItem[];
  newReleases: SteamItem[];
  comingSoon: SteamItem[];
};

const mapBucket = (items: RawSpecial[] | undefined): SteamItem[] => {
  const seen = new Set<number>();
  return (items ?? [])
    .filter((it) => {
      if (!it?.id || seen.has(it.id)) return false;
      seen.add(it.id);
      return true;
    })
    .map((it) => ({
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
    }));
};

export async function fetchShelves(): Promise<StoreShelves> {
  const data = (await safeJson(
    `https://store.steampowered.com/api/featuredcategories?cc=${CC}&l=arabic`,
  )) as Record<string, { items?: RawSpecial[] }>;

  return {
    specials: mapBucket(data["specials"]?.items),
    topSellers: mapBucket(data["top_sellers"]?.items),
    newReleases: mapBucket(data["new_releases"]?.items),
    comingSoon: mapBucket(data["coming_soon"]?.items).map((x) => ({ ...x, comingSoon: true })),
  };
}

/** حزم وإصدارات خاصة: نبحث بمصطلحات الحزم ونُبقي المطابق فقط */
const BUNDLE_TERMS = [
  "bundle",
  "deluxe edition",
  "ultimate edition",
  "gold edition",
  "collection",
  "complete edition",
];

const BUNDLE_RE = /\b(bundle|pack|deluxe|ultimate|gold|complete|collection|definitive|anthology|edition)\b/i;

export async function fetchBundles(): Promise<SteamItem[]> {
  const lists = await Promise.all(
    BUNDLE_TERMS.map((t) =>
      safeJson(
        `https://store.steampowered.com/api/storesearch?term=${encodeURIComponent(t)}&cc=${CC}&l=arabic`,
      )
        .then((d) => (d as RawSearch).items ?? [])
        .catch(() => []),
    ),
  );

  const seen = new Set<number>();
  const out: SteamItem[] = [];
  for (const items of lists) {
    for (const it of items) {
      if (!it.id || seen.has(it.id) || !BUNDLE_RE.test(it.name)) continue;
      seen.add(it.id);
      const final = it.price?.final ?? 0;
      const initial = it.price?.initial ?? final;
      out.push({
        appId: it.id,
        name: it.name,
        image: storeImage(it),
        uahFinal: final,
        uahInitial: initial,
        discount: initial > final && initial > 0 ? Math.round((1 - final / initial) * 100) : 0,
        isFree: false,
      });
    }
  }
  return out
    .sort((a, b) => b.discount - a.discount || b.uahFinal - a.uahFinal)
    .slice(0, 24);
}

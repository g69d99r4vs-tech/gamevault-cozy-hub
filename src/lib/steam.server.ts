/**
 * Steam Store data layer — server only (يتفادى قيود CORS تمامًا).
 * البحث والتفاصيل والأسعار والصور تأتي مباشرة من متجر ستيم.
 */

export type GameDTO = {
  id: number;
  slug: string;
  name: string;
  released: string | null;
  tba?: boolean;
  background_image: string | null;
  background_image_additional?: string | null;
  rating: number;
  ratings_count?: number;
  added?: number;
  hypes?: number;
  metacritic: number | null;
  playtime?: number;
  website?: string;
  description_raw?: string;
  price?: string | null;
  discount?: number;
  free?: boolean;
  platforms?: { platform: { id: number; name: string; slug: string } }[];
  genres?: { id: number; name: string; slug: string }[];
  developers?: { id: number; name: string }[];
  publishers?: { id: number; name: string }[];
  short_screenshots?: { id: number; image: string }[];
};

const CC = "us";
const LANG = "english";

export const storeUrl = (id: number | string) => `https://store.steampowered.com/app/${id}`;
export const headerImage = (id: number | string) =>
  `https://cdn.cloudflare.steamstatic.com/steam/apps/${id}/header.jpg`;
export const capsuleImage = (id: number | string) =>
  `https://cdn.cloudflare.steamstatic.com/steam/apps/${id}/library_600x900.jpg`;

export const slugify = (name: string) =>
  name
    .toLocaleLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const formatPrice = (cents?: number | null, currency = "USD"): string | null => {
  if (cents === undefined || cents === null) return null;
  if (cents === 0) return "مجانية";
  const value = cents / 100;
  const symbol = currency === "USD" ? "$" : `${currency} `;
  return `${symbol}${value.toFixed(2)}`;
};

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: {
      Accept: "application/json",
      "Accept-Language": "en-US,en;q=0.9",
      "User-Agent": "Mozilla/5.0 (compatible; GameHub/1.0)",
    },
  });
  if (!res.ok) throw new Error(`Steam request failed [${res.status}] ${url}`);
  return (await res.json()) as T;
}

/* ---------------------------------- البحث --------------------------------- */

type StoreSearchItem = {
  id: number;
  type?: string;
  name: string;
  tiny_image?: string;
  metascore?: string;
  price?: { currency?: string; initial?: number; final?: number };
};

export async function searchSteam(term: string, limit = 20): Promise<GameDTO[]> {
  const q = term.trim();
  if (q.length < 2) return [];
  const data = await getJson<{ items?: StoreSearchItem[] }>(
    `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(q)}&l=${LANG}&cc=${CC}`,
  ).catch(() => ({ items: [] as StoreSearchItem[] }));

  const items = (data.items ?? []).filter((i) => !i.type || i.type === "app" || i.type === "game");

  return items.slice(0, limit).map((i) => {
    const currency = i.price?.currency ?? "USD";
    const initial = i.price?.initial;
    const final = i.price?.final;
    const discount =
      initial && final && initial > final ? Math.round(((initial - final) / initial) * 100) : 0;
    return {
      id: i.id,
      slug: slugify(i.name),
      name: i.name,
      released: null,
      background_image: headerImage(i.id),
      rating: 0,
      metacritic: i.metascore ? Number(i.metascore) || null : null,
      price: i.price ? formatPrice(final, currency) : null,
      discount,
      free: final === 0,
      website: storeUrl(i.id),
      genres: [],
      developers: [],
      short_screenshots: [],
    } satisfies GameDTO;
  });
}

/* -------------------------------- التفاصيل -------------------------------- */

type AppDetails = {
  name: string;
  steam_appid: number;
  is_free?: boolean;
  short_description?: string;
  detailed_description?: string;
  header_image?: string;
  background_raw?: string;
  website?: string;
  developers?: string[];
  publishers?: string[];
  metacritic?: { score?: number };
  genres?: { id: string; description: string }[];
  screenshots?: { id: number; path_full: string; path_thumbnail: string }[];
  platforms?: { windows?: boolean; mac?: boolean; linux?: boolean };
  release_date?: { coming_soon?: boolean; date?: string };
  price_overview?: {
    currency?: string;
    initial?: number;
    final?: number;
    discount_percent?: number;
    final_formatted?: string;
  };
};

const stripHtml = (html?: string) =>
  html
    ? html
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<[^>]+>/g, "")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&quot;/g, '"')
        .trim()
    : undefined;

const parseDate = (raw?: string): string | null => {
  if (!raw) return null;
  const t = Date.parse(raw);
  return Number.isNaN(t) ? null : new Date(t).toISOString().slice(0, 10);
};

function detailsToDTO(d: AppDetails): GameDTO {
  const price = d.is_free
    ? "مجانية"
    : (d.price_overview?.final_formatted ??
      formatPrice(d.price_overview?.final, d.price_overview?.currency));
  const shots = d.screenshots ?? [];
  const platforms: { platform: { id: number; name: string; slug: string } }[] = [];
  if (d.platforms?.windows) platforms.push({ platform: { id: 4, name: "PC", slug: "pc" } });
  if (d.platforms?.mac) platforms.push({ platform: { id: 5, name: "macOS", slug: "macos" } });
  if (d.platforms?.linux) platforms.push({ platform: { id: 6, name: "Linux", slug: "linux" } });

  return {
    id: d.steam_appid,
    slug: slugify(d.name),
    name: d.name,
    released: parseDate(d.release_date?.date),
    tba: !!d.release_date?.coming_soon,
    background_image: d.header_image ?? headerImage(d.steam_appid),
    background_image_additional: d.background_raw ?? shots[0]?.path_full ?? null,
    rating: 0,
    metacritic: d.metacritic?.score ?? null,
    price: price ?? null,
    discount: d.price_overview?.discount_percent ?? 0,
    free: !!d.is_free,
    website: storeUrl(d.steam_appid),
    ...(stripHtml(d.short_description ?? d.detailed_description)
      ? { description_raw: stripHtml(d.short_description ?? d.detailed_description)! }
      : {}),
    platforms,
    genres: (d.genres ?? []).map((g) => ({
      id: Number(g.id) || 0,
      name: g.description,
      slug: slugify(g.description),
    })),
    developers: (d.developers ?? []).map((name, i) => ({ id: i, name })),
    publishers: (d.publishers ?? []).map((name, i) => ({ id: i, name })),
    short_screenshots: shots.map((s) => ({ id: s.id, image: s.path_full })),
  };
}

export async function appDetails(id: number | string): Promise<GameDTO | null> {
  const appid = Number(id);
  if (!Number.isFinite(appid)) return null;
  const json = await getJson<Record<string, { success: boolean; data?: AppDetails }>>(
    `https://store.steampowered.com/api/appdetails?appids=${appid}&cc=${CC}&l=${LANG}`,
  ).catch(() => null);
  const entry = json?.[String(appid)];
  if (!entry?.success || !entry.data) return null;
  return detailsToDTO(entry.data);
}

/** بحث بالاسم/الslug عندما يكون المعرّف قديمًا وغير صالح في ستيم */
export async function resolveSteamGame(
  id: string | number,
  hint?: { slug?: string; name?: string },
): Promise<GameDTO | null> {
  const direct = await appDetails(id);
  if (direct) return direct;
  const term = hint?.name ?? hint?.slug?.replace(/-/g, " ");
  if (!term) return null;
  const [first] = await searchSteam(term, 1);
  if (!first) return null;
  return (await appDetails(first.id)) ?? first;
}

export async function gameBySlugSteam(slug: string): Promise<GameDTO | null> {
  const [first] = await searchSteam(slug.replace(/-/g, " "), 1);
  if (!first) return null;
  return (await appDetails(first.id)) ?? first;
}

/* ------------------------- القوائم (رائجة / قادمة) ------------------------- */

type FeaturedItem = {
  id: number;
  name: string;
  header_image?: string;
  large_capsule_image?: string;
  discounted?: boolean;
  discount_percent?: number;
  original_price?: number;
  final_price?: number;
  currency?: string;
};

const featuredToDTO = (i: FeaturedItem): GameDTO => ({
  id: i.id,
  slug: slugify(i.name),
  name: i.name,
  released: null,
  background_image: i.header_image ?? i.large_capsule_image ?? headerImage(i.id),
  rating: 0,
  metacritic: null,
  price: formatPrice(i.final_price, i.currency ?? "USD"),
  discount: i.discount_percent ?? 0,
  free: i.final_price === 0,
  website: storeUrl(i.id),
  genres: [],
  developers: [],
  short_screenshots: [],
});

async function featured(): Promise<{
  top_sellers?: { items?: FeaturedItem[] };
  coming_soon?: { items?: FeaturedItem[] };
  specials?: { items?: FeaturedItem[] };
  new_releases?: { items?: FeaturedItem[] };
}> {
  return getJson<{
    top_sellers?: { items?: FeaturedItem[] };
    coming_soon?: { items?: FeaturedItem[] };
    specials?: { items?: FeaturedItem[] };
    new_releases?: { items?: FeaturedItem[] };
  }>(`https://store.steampowered.com/api/featuredcategories?cc=${CC}&l=${LANG}`).catch(() => ({}));
}

export async function trendingSteam(): Promise<GameDTO[]> {
  const data = await featured();
  return (data.top_sellers?.items ?? []).slice(0, 15).map(featuredToDTO);
}

export async function upcomingSteam(): Promise<GameDTO[]> {
  const data = await featured();
  const list = data.coming_soon?.items ?? data.new_releases?.items ?? [];
  return list.slice(0, 15).map(featuredToDTO);
}

export async function recommendedSteam(
  excludedIds: number[] = [],
  excludedNames: string[] = [],
): Promise<GameDTO[]> {
  const data = await featured();
  const ids = new Set(excludedIds);
  const names = new Set(excludedNames.map((n) => n.trim().toLocaleLowerCase()));
  const pool = [
    ...(data.top_sellers?.items ?? []),
    ...(data.specials?.items ?? []),
    ...(data.new_releases?.items ?? []),
  ];
  const unique = new Map<number, GameDTO>();
  for (const item of pool) {
    if (ids.has(item.id) || names.has(item.name.trim().toLocaleLowerCase())) continue;
    if (!unique.has(item.id)) unique.set(item.id, featuredToDTO(item));
  }
  return [...unique.values()].slice(0, 18);
}

export async function screenshotsSteam(id: string | number) {
  const game = await appDetails(id);
  return game?.short_screenshots ?? [];
}

/** ألعاب مشابهة: نستخدم نفس ناشر/اسم السلسلة عبر بحث المتجر */
export async function similarSteam(id: string | number): Promise<GameDTO[]> {
  const game = await appDetails(id);
  if (!game) return [];
  const key = game.name.split(/[:\-–]/)[0]?.trim() || game.name;
  const list = await searchSteam(key, 10).catch(() => [] as GameDTO[]);
  return list.filter((g) => g.id !== game.id).slice(0, 8);
}

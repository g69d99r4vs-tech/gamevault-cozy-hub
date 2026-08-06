/**
 * طبقة الخادم لمتجر العروض — CheapShark (متجر Steam) + وصف Steam.
 * تُنفَّذ على الخادم فقط، لذا لا حاجة لأي بروكسي CORS.
 */

const BASE = "https://www.cheapshark.com/api/1.0";
const UA = "GameHub/1.0 (personal gaming dashboard)";

import type { StoreDeal, StoreDealDetails } from "./deals";

const num = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const str = (v: unknown) => (typeof v === "string" ? v : "");

async function api<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "User-Agent": UA, Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`CheapShark ${res.status}`);
  return (await res.json()) as T;
}

const capsuleFor = (appId: string | null, thumb: string) =>
  appId
    ? `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/header.jpg`
    : thumb;

const BANNED = /(soundtrack|ost|dlc|season pass|artbook|art book|upgrade|demo|expansion pack|bundle pack|wallpaper)/i;

function toDeal(raw: Record<string, unknown>): StoreDeal {
  const appId = str(raw["steamAppID"]) || null;
  const thumb = str(raw["thumb"]);
  return {
    dealID: str(raw["dealID"]),
    gameID: str(raw["gameID"]),
    title: str(raw["title"]),
    thumb,
    capsule: capsuleFor(appId, thumb),
    salePriceUsd: num(raw["salePrice"]),
    normalPriceUsd: num(raw["normalPrice"]),
    savings: num(raw["savings"]),
    metacriticScore: num(raw["metacriticScore"]) || null,
    steamRatingPercent: num(raw["steamRatingPercent"]) || null,
    releaseDate: num(raw["releaseDate"]) || null,
    steamAppID: appId,
  };
}

const usable = (d: StoreDeal) =>
  !!d.dealID && !!d.title && !!d.thumb && d.salePriceUsd > 0 && !BANNED.test(d.title);

function dedupe(list: StoreDeal[]) {
  const seen = new Set<string>();
  return list.filter((d) => {
    const key = d.title.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** مجموعة العروض الأساسية — تُصفّى وتُرتَّب لاحقًا في الواجهة */
export async function fetchDealPool(): Promise<StoreDeal[]> {
  const queries = [
    "/deals?storeID=1&sortBy=Reviews&pageSize=60&onSale=1",
    "/deals?storeID=1&sortBy=Savings&pageSize=60&onSale=1&upperPrice=50",
    "/deals?storeID=1&sortBy=Metacritic&pageSize=60&onSale=1",
    "/deals?storeID=1&sortBy=Recent&pageSize=60&onSale=1",
  ];
  const results = await Promise.allSettled(
    queries.map((q) => api<Record<string, unknown>[]>(q)),
  );
  const all = results.flatMap((r) =>
    r.status === "fulfilled" ? r.value.map(toDeal) : [],
  );
  return dedupe(all.filter(usable));
}

/** بحث حي بالعنوان */
export async function searchDeals(q: string): Promise<StoreDeal[]> {
  const list = await api<Record<string, unknown>[]>(
    `/deals?storeID=1&pageSize=40&sortBy=Reviews&title=${encodeURIComponent(q)}`,
  );
  return dedupe(list.map(toDeal).filter(usable));
}

type SteamApp = {
  short_description?: string;
  about_the_game?: string;
  header_image?: string;
  developers?: string[];
  publishers?: string[];
  genres?: { description: string }[];
  screenshots?: { path_full: string }[];
};

async function fetchSteam(appId: string): Promise<SteamApp | null> {
  try {
    const res = await fetch(
      `https://store.steampowered.com/api/appdetails?appids=${appId}&l=english&cc=ua`,
      { headers: { "User-Agent": UA, Accept: "application/json" } },
    );
    if (!res.ok) return null;
    const json = (await res.json()) as Record<
      string,
      { success?: boolean; data?: SteamApp }
    >;
    const entry = json[appId];
    return entry?.success ? (entry.data ?? null) : null;
  } catch {
    return null;
  }
}

const strip = (html: string) =>
  html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

export async function fetchDealDetails(dealID: string): Promise<StoreDealDetails> {
  const raw = await api<Record<string, unknown>>(
    `/deals?id=${encodeURIComponent(dealID)}`,
  );
  const info = (raw["gameInfo"] ?? {}) as Record<string, unknown>;
  const cheapest = (raw["cheapestPrice"] ?? {}) as Record<string, unknown>;
  const appId = str(info["steamAppID"]) || null;
  const thumb = str(info["thumb"]);
  const steam = appId ? await fetchSteam(appId) : null;

  return {
    dealID,
    title: str(info["name"]) || "لعبة",
    thumb,
    hero: steam?.header_image ?? capsuleFor(appId, thumb),
    salePriceUsd: num(info["salePrice"]),
    retailPriceUsd: num(info["retailPrice"]),
    cheapestEverUsd: num(cheapest["price"]) || null,
    metacriticScore: num(info["metacriticScore"]) || null,
    steamRatingPercent: num(info["steamRatingPercent"]) || null,
    steamRatingText: str(info["steamRatingText"]) || null,
    publisher:
      steam?.publishers?.[0] ??
      (str(info["publisher"]) && str(info["publisher"]) !== "N/A"
        ? str(info["publisher"])
        : null),
    developer: steam?.developers?.[0] ?? null,
    releaseDate: num(info["releaseDate"]) || null,
    genres: steam?.genres?.map((g) => g.description) ?? [],
    description: strip(
      steam?.short_description || steam?.about_the_game || "",
    ),
    screenshots: (steam?.screenshots ?? []).slice(0, 6).map((s) => s.path_full),
    steamAppID: appId,
  };
}

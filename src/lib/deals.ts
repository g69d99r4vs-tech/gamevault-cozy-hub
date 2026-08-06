/**
 * متجر العروض — CheapShark عبر بروكسي CORS + تحويل العملة إلى الريال السعودي.
 * أسعار CheapShark بالدولار، نحوّلها لسعر المنطقة الأوكرانية (UAH) ثم إلى SAR.
 */

export type Deal = {
  dealID: string;
  gameID: string;
  title: string;
  thumb: string;
  salePrice: number;
  normalPrice: number;
  savings: number;
  metacriticScore: number | null;
  steamRatingPercent: number | null;
  steamRatingText: string | null;
  releaseDate: number | null;
  dealRating: number | null;
};

const PROXIES = [
  (u: string) => `https://corsproxy.io/?${encodeURIComponent(u)}`,
  (u: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
];

async function fetchJson<T>(url: string): Promise<T> {
  const attempts = [url, ...PROXIES.map((p) => p(url))];
  let lastErr: unknown;
  for (const target of attempts) {
    try {
      const res = await fetch(target);
      if (!res.ok) throw new Error(String(res.status));
      return (await res.json()) as T;
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr ?? new Error("تعذر جلب البيانات");
}

const num = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const toDeal = (d: Record<string, unknown>): Deal => ({
  dealID: String(d["dealID"] ?? ""),
  gameID: String(d["gameID"] ?? ""),
  title: String(d["title"] ?? ""),
  thumb: String(d["thumb"] ?? ""),
  salePrice: num(d["salePrice"]),
  normalPrice: num(d["normalPrice"]),
  savings: num(d["savings"]),
  metacriticScore: num(d["metacriticScore"]) || null,
  steamRatingPercent: num(d["steamRatingPercent"]) || null,
  steamRatingText: (d["steamRatingText"] as string) || null,
  releaseDate: num(d["releaseDate"]) || null,
  dealRating: num(d["dealRating"]) || null,
});

const BASE = "https://www.cheapshark.com/api/1.0";

/** الأكثر رواجًا في المتجر (حسب تقييم الصفقة والشعبية) */
export const getTopDeals = async (): Promise<Deal[]> => {
  const list = await fetchJson<Record<string, unknown>[]>(
    `${BASE}/deals?storeID=1&sortBy=Reviews&pageSize=24&AAA=1`,
  );
  return list.map(toDeal).filter((d) => d.thumb);
};

/** أقوى التخفيضات */
export const getSaleDeals = async (): Promise<Deal[]> => {
  const list = await fetchJson<Record<string, unknown>[]>(
    `${BASE}/deals?storeID=1&sortBy=Savings&pageSize=36&upperPrice=60`,
  );
  return list
    .map(toDeal)
    .filter((d) => d.thumb && d.savings > 20 && d.salePrice > 0);
};

export type DealDetails = {
  title: string;
  thumb: string;
  salePrice: number;
  retailPrice: number;
  steamAppID: string | null;
  releaseDate: number | null;
  metacriticScore: number | null;
  publisher: string | null;
  description: string;
};

export const getDealDetails = async (dealID: string): Promise<DealDetails> => {
  const raw = await fetchJson<Record<string, unknown>>(
    `${BASE}/deals?id=${encodeURIComponent(dealID)}`,
  );
  const info = (raw["gameInfo"] ?? {}) as Record<string, unknown>;
  return {
    title: String(info["name"] ?? "لعبة"),
    thumb: String(info["thumb"] ?? ""),
    salePrice: num(info["salePrice"]),
    retailPrice: num(info["retailPrice"]),
    steamAppID: (info["steamAppID"] as string) || null,
    releaseDate: num(info["releaseDate"]) || null,
    metacriticScore: num(info["metacriticScore"]) || null,
    publisher: (info["publisher"] as string) || null,
    description:
      "عرض حالي على متجر Steam. السعر معروض بالريال السعودي بعد تحويله من سعر المنطقة الأوكرانية (UAH)، ويُحدَّث تلقائيًا حسب أسعار الصرف.",
  };
};

/* ------------------------- تحويل العملة ------------------------- */

/** أسعار احتياطية ثابتة عند فشل واجهة الصرف */
const FALLBACK_USD_UAH = 41.5;
const FALLBACK_UAH_SAR = 0.0904;

export type Rates = { usdToUah: number; uahToSar: number };

export const FALLBACK_RATES: Rates = {
  usdToUah: FALLBACK_USD_UAH,
  uahToSar: FALLBACK_UAH_SAR,
};

/** يجلب سعر الصرف الحيّ مع سقوط آمن لقيم ثابتة */
export const getRates = async (): Promise<Rates> => {
  try {
    const data = await fetchJson<{ rates?: Record<string, number> }>(
      "https://open.er-api.com/v6/latest/USD",
    );
    const uah = data.rates?.["UAH"];
    const sar = data.rates?.["SAR"];
    if (!uah || !sar) return FALLBACK_RATES;
    return { usdToUah: uah, uahToSar: sar / uah };
  } catch {
    return FALLBACK_RATES;
  }
};

/** دولار → سعر المنطقة الأوكرانية (UAH) */
export const usdToUah = (usd: number, rates: Rates = FALLBACK_RATES) =>
  usd * rates.usdToUah;

/** هريفنيا أوكرانية → ريال سعودي */
export const uahToSar = (uah: number, rates: Rates = FALLBACK_RATES) =>
  uah * rates.uahToSar;

/** السعر النهائي المعروض للمستخدم بالريال فقط */
export const toSar = (usd: number, rates: Rates = FALLBACK_RATES) =>
  uahToSar(usdToUah(usd, rates), rates);

export const formatSar = (usd: number, rates: Rates = FALLBACK_RATES) =>
  `${Math.round(toSar(usd, rates))} ر.س`;

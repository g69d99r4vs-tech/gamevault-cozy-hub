/**
 * متجر العروض — الأنواع + تحويل العملة (دولار → هريفنيا أوكرانية → ريال سعودي).
 * ملف آمن للعميل: لا يحتوي أي نداء شبكة.
 */

export type StoreDeal = {
  dealID: string;
  gameID: string;
  title: string;
  thumb: string;
  capsule: string;
  salePriceUsd: number;
  normalPriceUsd: number;
  savings: number;
  metacriticScore: number | null;
  steamRatingPercent: number | null;
  releaseDate: number | null;
  steamAppID: string | null;
};

export type StoreDealDetails = {
  dealID: string;
  title: string;
  thumb: string;
  hero: string;
  salePriceUsd: number;
  retailPriceUsd: number;
  cheapestEverUsd: number | null;
  metacriticScore: number | null;
  steamRatingPercent: number | null;
  steamRatingText: string | null;
  publisher: string | null;
  developer: string | null;
  releaseDate: number | null;
  genres: string[];
  description: string;
  screenshots: string[];
  steamAppID: string | null;
};

/* ------------------------- تحويل العملة ------------------------- */

export type Rates = {
  /** دولار أمريكي → هريفنيا أوكرانية */
  usdToUah: number;
  /** هريفنيا أوكرانية → ريال سعودي */
  uahToSar: number;
};

export const FALLBACK_RATES: Rates = { usdToUah: 41.5, uahToSar: 0.091 };

export const usdToUah = (usd: number, r: Rates = FALLBACK_RATES) => usd * r.usdToUah;
export const uahToSar = (uah: number, r: Rates = FALLBACK_RATES) => uah * r.uahToSar;
export const toSar = (usd: number, r: Rates = FALLBACK_RATES) =>
  uahToSar(usdToUah(usd, r), r);

/** السعر النهائي بالريال السعودي */
export const formatSar = (usd: number, r: Rates = FALLBACK_RATES) => {
  const v = toSar(usd, r);
  if (v <= 0) return "مجانًا";
  return `${v < 10 ? v.toFixed(1) : Math.round(v)} ر.س`;
};

export const formatUah = (usd: number, r: Rates = FALLBACK_RATES) =>
  `${Math.round(usdToUah(usd, r))} ₴`;

/* ------------------------- التصنيفات ------------------------- */

export type CategoryId =
  | "all"
  | "hot"
  | "aaa"
  | "under50"
  | "topRated"
  | "new";

export const CATEGORIES: { id: CategoryId; label: string }[] = [
  { id: "all", label: "الكل" },
  { id: "hot", label: "أقوى الخصومات" },
  { id: "aaa", label: "ألعاب كبرى" },
  { id: "under50", label: "أقل من 50 ر.س" },
  { id: "topRated", label: "الأعلى تقييمًا" },
  { id: "new", label: "إصدارات حديثة" },
];

const YEAR = 60 * 60 * 24 * 365;

export function filterByCategory(list: StoreDeal[], cat: CategoryId): StoreDeal[] {
  const now = Date.now() / 1000;
  switch (cat) {
    case "hot":
      return [...list].filter((d) => d.savings >= 50).sort((a, b) => b.savings - a.savings);
    case "aaa":
      return list.filter((d) => d.normalPriceUsd >= 39.99);
    case "under50":
      return [...list]
        .filter((d) => toSar(d.salePriceUsd) <= 50)
        .sort((a, b) => a.salePriceUsd - b.salePriceUsd);
    case "topRated":
      return [...list]
        .filter((d) => (d.metacriticScore ?? 0) >= 80 || (d.steamRatingPercent ?? 0) >= 90)
        .sort(
          (a, b) =>
            (b.metacriticScore ?? b.steamRatingPercent ?? 0) -
            (a.metacriticScore ?? a.steamRatingPercent ?? 0),
        );
    case "new":
      return [...list]
        .filter((d) => d.releaseDate && now - d.releaseDate < YEAR * 2)
        .sort((a, b) => (b.releaseDate ?? 0) - (a.releaseDate ?? 0));
    default:
      return list;
  }
}

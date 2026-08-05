/**
 * واجهة بيانات الألعاب — مدعومة بمتجر Steam عبر دوال الخادم (بلا مشاكل CORS).
 * الاسم محفوظ للتوافق مع بقية التطبيق.
 */
import {
  getGameBySlugFn,
  getGameFn,
  getRecommendedFn,
  getScreenshotsFn,
  getSimilarFn,
  getTrendingFn,
  getUpcomingFn,
  searchGamesFn,
} from "./steam.functions";
import type { GameDTO } from "./steam.server";

export type RawgGame = GameDTO;

export {
  isBaseGame,
  isCoreGame,
  cleanList,
  isUnreleased,
  MASTER_FRANCHISES,
  prestige,
  byPrestige,
} from "./game-match";

export const steamStoreUrl = (id: number | string) => `https://store.steampowered.com/app/${id}`;

export const searchGames = (q: string, limit = 20): Promise<RawgGame[]> =>
  q.trim().length < 2
    ? Promise.resolve([])
    : searchGamesFn({ data: { q: q.trim(), limit } }).catch(() => [] as RawgGame[]);

export const getGame = async (
  id: string | number,
  hint?: { slug?: string; name?: string },
): Promise<RawgGame> => {
  const game = await getGameFn({
    data: {
      id: String(id),
      ...(hint?.slug ? { slug: hint.slug } : {}),
      ...(hint?.name ? { name: hint.name } : {}),
    },
  });
  if (!game) throw new Error("تعذر العثور على اللعبة");
  return game;
};

export const getGameBySlug = async (slug: string): Promise<RawgGame> => {
  const game = await getGameBySlugFn({ data: { slug } });
  if (!game) throw new Error("تعذر العثور على اللعبة");
  return game;
};

export const getScreenshots = (id: string | number) =>
  getScreenshotsFn({ data: { id: String(id) } }).catch(() => [] as { id: number; image: string }[]);

export const getSimilar = (id: string | number) =>
  getSimilarFn({ data: { id: String(id) } }).catch(() => [] as RawgGame[]);

export const getTrending = () => getTrendingFn().catch(() => [] as RawgGame[]);

export const getUpcoming = () => getUpcomingFn().catch(() => [] as RawgGame[]);

export type RecommendationExclusions = {
  ids?: Iterable<number>;
  names?: Iterable<string>;
};

export const getRecommended = (
  genreSlugs: string[] = [],
  exclusions: RecommendationExclusions = {},
): Promise<RawgGame[]> =>
  getRecommendedFn({
    data: {
      genres: genreSlugs,
      ids: [...(exclusions.ids ?? [])],
      names: [...(exclusions.names ?? [])],
    },
  }).catch(() => [] as RawgGame[]);

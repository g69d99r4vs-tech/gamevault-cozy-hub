import {
  BASE_WHERE,
  escapeSearch,
  queryGames,
  queryOneGame,
  similarIds,
  type GameDTO,
} from "./igdb.server";
import {
  byPrestige,
  cleanList,
  expandQuery,
  franchiseMatches,
  hasSubstance,
  isBaseGame,
  isUnreleased,
  MASTER_FRANCHISES,
  matchScore,
  norm,
  prestige,
} from "./game-match";

const now = () => Math.floor(Date.now() / 1000);

/** بحث ذكي بأسلوب ستيم: تطابق حرفي أولًا ثم السلاسل الكبرى ثم الشعبية */
export async function searchIgdb(q: string, limit = 12): Promise<GameDTO[]> {
  const raw = q.trim();
  if (raw.length < 2) return [];
  const queries = [...new Set([...expandQuery(raw), ...franchiseMatches(raw)])].slice(0, 4);

  const run = (query: string, where: string, size = 40) =>
    queryGames(`search "${escapeSearch(query)}"; where ${where}; limit ${size};`).catch(
      () => [] as GameDTO[],
    );

  const batches = await Promise.all([
    ...queries.map((query) => run(query, BASE_WHERE)),
    // إعلانات مبكرة بلا منصات محددة
    run(raw, `game_type = (0,8,9,10) & version_parent = null & first_release_date = null`, 15),
  ]);

  const unique = new Map<number, GameDTO>();
  for (const g of batches.flat()) if (!unique.has(g.id)) unique.set(g.id, g);

  const all = [...unique.values()].filter((g) => isBaseGame(g.name) && !!g.background_image);
  // نستبعد ألعاب المعجبين والحشو المغمور: يجب وجود جمهور أو تقييم نقدي
  const pool = all.filter(
    (g) => hasSubstance(g) || (isUnreleased(g) && ((g.added ?? 0) >= 10 || (g.hypes ?? 0) >= 5)),
  );

  const franchiseHint = franchiseMatches(raw);
  const nq = norm(raw);

  return pool
    .map((g) => {
      const n = norm(g.name);
      const base = matchScore(g.name, queries);
      const exact = n === nq ? 100000 : n.startsWith(nq) ? 40000 : 0;
      const wordPrefix = !exact && n.split(" ").some((w) => w.startsWith(nq)) ? 8000 : 0;
      const bonus =
        exact +
        wordPrefix +
        (MASTER_FRANCHISES.test(g.name) ? 400 : 0) +
        (franchiseHint.some((f) => n.startsWith(norm(f))) ? 500 : 0);
      return { g, s: base + bonus, base };
    })
    .filter((x) => x.base > 0)
    .sort((a, b) => b.s + prestige(b.g) / 20 - (a.s + prestige(a.g) / 20))
    .slice(0, limit)
    .map((x) => x.g);
}

export const gameById = (id: string | number) => queryOneGame(`id = ${Number(id)}`);

export async function gameBySlug(slug: string): Promise<GameDTO | null> {
  const direct = await queryOneGame(`slug = "${escapeSearch(slug)}"`);
  if (direct) return direct;
  const [first] = await searchIgdb(slug.replace(/-/g, " "), 1);
  return first ?? null;
}

export async function screenshotsFor(id: string | number) {
  const game = await gameById(id);
  return game?.short_screenshots ?? [];
}

export async function similarFor(id: string | number) {
  const ids = await similarIds(Number(id));
  if (!ids.length) return [];
  const games = await queryGames(
    `where id = (${ids.join(",")}) & ${BASE_WHERE}; limit 12;`,
  ).catch(() => [] as GameDTO[]);
  return cleanList(games).sort(byPrestige).slice(0, 8);
}

export async function trendingGames() {
  const from = now() - 60 * 60 * 24 * 365 * 2;
  const games = await queryGames(
    `where ${BASE_WHERE} & first_release_date > ${from} & first_release_date < ${now()} & total_rating_count > 20; sort total_rating_count desc; limit 40;`,
  ).catch(() => [] as GameDTO[]);
  return cleanList(games).filter(hasSubstance).sort(byPrestige).slice(0, 12);
}

export async function upcomingGames() {
  const games = await queryGames(
    `where ${BASE_WHERE} & first_release_date > ${now()}; sort hypes desc; limit 40;`,
  ).catch(() => [] as GameDTO[]);
  return cleanList(games)
    .filter((g) => !!g.background_image)
    .slice(0, 15);
}

const PREMIUM_GENRE_SLUGS = ["shooter", "role-playing-rpg", "adventure", "hack-and-slash-beat-em-up"];

const genreFilter = (slugs: string[]) => {
  const list = slugs.length ? slugs : PREMIUM_GENRE_SLUGS;
  return `genres.slug = (${list
    .slice(0, 5)
    .map((s) => `"${escapeSearch(s)}"`)
    .join(",")})`;
};

export async function recommendedGames(
  genreSlugs: string[] = [],
  excludedIds: number[] = [],
  excludedNames: string[] = [],
): Promise<GameDTO[]> {
  const ids = new Set(excludedIds);
  const names = new Set(excludedNames.map((n) => n.trim().toLocaleLowerCase()));
  const from = now() - 60 * 60 * 24 * 365 * 14;

  const [personal, blockbusters] = await Promise.all([
    queryGames(
      `where ${BASE_WHERE} & ${genreFilter(genreSlugs)} & aggregated_rating >= 82 & aggregated_rating_count >= 5 & first_release_date > ${from} & first_release_date < ${now()}; sort aggregated_rating desc; limit 40;`,
    ).catch(() => [] as GameDTO[]),
    queryGames(
      `where ${BASE_WHERE} & aggregated_rating >= 85 & total_rating_count >= 200 & first_release_date < ${now()}; sort total_rating_count desc; limit 40;`,
    ).catch(() => [] as GameDTO[]),
  ]);

  const unique = new Map<number, GameDTO>();
  for (const g of [...personal, ...blockbusters]) {
    if (ids.has(g.id) || names.has(g.name.trim().toLocaleLowerCase())) continue;
    if (!isBaseGame(g.name) || !g.background_image) continue;
    if (!unique.has(g.id)) unique.set(g.id, g);
  }
  return [...unique.values()].sort(byPrestige).slice(0, 18);
}

/** بحث سريع عن غلاف لعبة بالاسم — يُستخدم كبديل ذكي عند غياب صورة المتجر */
export async function artForName(name: string): Promise<string | null> {
  const clean = name.replace(/[™®©]/g, "").trim();
  if (clean.length < 2) return null;
  const list = await searchIgdb(clean, 3).catch(() => []);
  const hit = list[0];
  if (!hit) return null;
  return hit.background_image ?? null;
}

/** لقطات لعبة بالاسم — بديل ذكي عندما لا يوفّر المصدر الأساسي صورًا */
export async function shotsForName(name: string) {
  const clean = name.replace(/[™®©]/g, "").trim();
  if (clean.length < 2) return [] as { id: number; image: string }[];
  const list = await searchIgdb(clean, 3).catch(() => []);
  for (const g of list) {
    const shots = g.short_screenshots ?? [];
    if (shots.length) return shots;
  }
  return [] as { id: number; image: string }[];
}

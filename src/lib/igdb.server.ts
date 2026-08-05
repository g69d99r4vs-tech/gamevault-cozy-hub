/**
 * IGDB (Twitch) data layer — server only.
 * قاعدة بيانات احترافية: ألعاب كاملة فقط (بلا DLC/ديمو/ساوندتراك)،
 * منصات PC والكونسولات الكبرى، مع أغلفة وتواريخ وساعات إنهاء عالمية.
 */

const IGDB = "https://api.igdb.com/v4";

/** PC · PS4 · PS5 · Xbox One · Series X|S · Switch · Switch 2 */
const PLATFORM_IDS = [6, 48, 167, 49, 169, 130, 508];

/** main_game · remake · remaster · expanded_game · port */
const GAME_CATEGORIES = [0, 8, 9, 10, 11];

const MOBILE_PLATFORM_IDS = new Set([34, 39, 82]);

const FIELDS = [
  "id",
  "slug",
  "name",
  "first_release_date",
  "game_type",
  "summary",
  "storyline",
  "url",
  "rating",
  "rating_count",
  "aggregated_rating",
  "total_rating",
  "total_rating_count",
  "hypes",
  "follows",
  "cover.image_id",
  "screenshots.image_id",
  "artworks.image_id",
  "genres.id",
  "genres.name",
  "genres.slug",
  "platforms.id",
  "platforms.name",
  "platforms.slug",
  "involved_companies.developer",
  "involved_companies.publisher",
  "involved_companies.company.name",
  "websites.url",
].join(",");

export type IgdbRaw = {
  id: number;
  slug: string;
  name: string;
  first_release_date?: number;
  game_type?: number;
  summary?: string;
  url?: string;
  rating?: number;
  rating_count?: number;
  aggregated_rating?: number;
  total_rating?: number;
  total_rating_count?: number;
  hypes?: number;
  follows?: number;
  cover?: { image_id: string };
  screenshots?: { image_id: string }[];
  artworks?: { image_id: string }[];
  genres?: { id: number; name: string; slug: string }[];
  platforms?: { id: number; name: string; slug: string }[];
  involved_companies?: { developer?: boolean; publisher?: boolean; company?: { name: string } }[];
  websites?: { url: string }[];
  similar_games?: number[];
};

/** الشكل الموحّد الذي تستهلكه الواجهة (متوافق مع البنية القديمة) */
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
  platforms?: { platform: { id: number; name: string; slug: string } }[];
  genres?: { id: number; name: string; slug: string }[];
  developers?: { id: number; name: string }[];
  publishers?: { id: number; name: string }[];
  short_screenshots?: { id: number; image: string }[];
};

let token: { value: string; expires: number } | null = null;

async function accessToken(): Promise<string> {
  const id = process.env["TWITCH_CLIENT_ID"];
  const secret = process.env["TWITCH_CLIENT_SECRET"];
  if (!id || !secret) throw new Error("IGDB credentials missing");
  if (token && token.expires > Date.now() + 60_000) return token.value;

  const res = await fetch(
    `https://id.twitch.tv/oauth2/token?client_id=${encodeURIComponent(id)}&client_secret=${encodeURIComponent(
      secret,
    )}&grant_type=client_credentials`,
    { method: "POST" },
  );
  if (!res.ok) throw new Error(`IGDB auth failed [${res.status}]: ${await res.text()}`);
  const json = (await res.json()) as { access_token: string; expires_in: number };
  token = { value: json.access_token, expires: Date.now() + json.expires_in * 1000 };
  return token.value;
}

export async function igdb<T>(endpoint: string, body: string): Promise<T> {
  const id = process.env["TWITCH_CLIENT_ID"]!;
  const res = await fetch(`${IGDB}/${endpoint}`, {
    method: "POST",
    headers: {
      "Client-ID": id,
      Authorization: `Bearer ${await accessToken()}`,
      "Content-Type": "text/plain",
      Accept: "application/json",
    },
    body,
  });
  if (!res.ok) throw new Error(`IGDB request failed [${res.status}]: ${await res.text()}`);
  return (await res.json()) as T;
}

const img = (id: string | undefined, size: string) =>
  id ? `https://images.igdb.com/igdb/image/upload/t_${size}/${id}.jpg` : null;

export const escapeSearch = (q: string) => q.replace(/["\\]/g, " ").trim();

/** فلتر ثابت: ألعاب كاملة على منصات PC/كونسول فقط، بلا نسخ فرعية */
export const BASE_WHERE = `game_type = (${GAME_CATEGORIES.join(",")}) & version_parent = null & platforms = (${PLATFORM_IDS.join(",")})`;

export function toDTO(g: IgdbRaw, hours?: number): GameDTO {
  const platforms = (g.platforms ?? []).filter((p) => !MOBILE_PLATFORM_IDS.has(p.id));
  const shots = g.screenshots ?? [];
  const art = g.artworks ?? [];
  const backdrop =
    img(art[0]?.image_id, "1080p") ?? img(shots[0]?.image_id, "1080p") ?? img(g.cover?.image_id, "cover_big");
  const companies = g.involved_companies ?? [];
  const critic = g.aggregated_rating ?? null;

  return {
    id: g.id,
    slug: g.slug,
    name: g.name,
    released: g.first_release_date
      ? new Date(g.first_release_date * 1000).toISOString().slice(0, 10)
      : null,
    tba: !g.first_release_date,
    background_image: backdrop,
    background_image_additional: img(shots[1]?.image_id, "1080p"),
    rating: g.total_rating ? Number((g.total_rating / 20).toFixed(2)) : 0,
    ratings_count: g.total_rating_count ?? g.rating_count ?? 0,
    added: g.follows ?? g.total_rating_count ?? 0,
    hypes: g.hypes ?? 0,
    metacritic: critic ? Math.round(critic) : null,
    ...(hours ? { playtime: hours } : {}),
    ...(g.websites?.[0]?.url || g.url ? { website: g.websites?.[0]?.url ?? g.url! } : {}),
    ...(g.summary ? { description_raw: g.summary } : {}),
    platforms: platforms.map((platform) => ({ platform })),
    genres: g.genres ?? [],
    developers: companies
      .filter((c) => c.developer && c.company)
      .map((c, i) => ({ id: i, name: c.company!.name })),
    publishers: companies
      .filter((c) => c.publisher && c.company)
      .map((c, i) => ({ id: i, name: c.company!.name })),
    short_screenshots: shots.map((s, i) => ({ id: i, image: img(s.image_id, "screenshot_huge")! })),
  };
}

/** ساعات الإنهاء العالمية (متوسط) لمجموعة ألعاب */
export async function timeToBeat(ids: number[]): Promise<Map<number, number>> {
  const map = new Map<number, number>();
  if (!ids.length) return map;
  try {
    const rows = await igdb<{ game_id: number; normally?: number; completely?: number }[]>(
      "game_time_to_beats",
      `fields game_id,normally,completely; where game_id = (${ids.join(",")}); limit ${ids.length};`,
    );
    for (const r of rows) {
      const seconds = r.normally ?? r.completely;
      if (seconds) map.set(r.game_id, Math.round(seconds / 3600));
    }
  } catch {
    /* ساعات الإنهاء اختيارية */
  }
  return map;
}

export async function queryGames(body: string): Promise<GameDTO[]> {
  const rows = await igdb<IgdbRaw[]>("games", `fields ${FIELDS}; ${body}`);
  const hours = await timeToBeat(rows.map((r) => r.id));
  return rows.map((r) => toDTO(r, hours.get(r.id)));
}

export async function queryOneGame(where: string): Promise<GameDTO | null> {
  const rows = await igdb<IgdbRaw[]>(
    "games",
    `fields ${FIELDS},similar_games; where ${where}; limit 1;`,
  );
  const row = rows[0];
  if (!row) return null;
  const hours = await timeToBeat([row.id]);
  return toDTO(row, hours.get(row.id));
}

export async function similarIds(id: number): Promise<number[]> {
  const rows = await igdb<{ similar_games?: number[] }[]>(
    "games",
    `fields similar_games; where id = ${id}; limit 1;`,
  );
  return rows[0]?.similar_games ?? [];
}

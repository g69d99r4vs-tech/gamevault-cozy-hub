/** أدوات مطابقة وتنقية أسماء الألعاب — آمنة للعميل والخادم */

export type RawgGame = import("./steam.server").GameDTO;

/** إصدارات غير أساسية — نعرض النسخة الأساسية فقط (الريميك/الريماستر مسموح) */
const EDITION_NOISE =
  /\b(edition|goty|game of the year|deluxe|ultimate|bundle|director'?s cut|premium)\b/i;

/** إضافات ومحتوى إضافي (DLC) */
const DLC_NOISE =
  /\b(dlc|add-?on|expansion|expansion pass|season pass|story pack|character pack|content pack|mission pack|map pack|skin pack|weapon pack|booster|pack|episode pack|costume|cosmetic|currency|coins?|credits pack)\b/i;

/** نسخ تجريبية ومحتوى غير لعبة كاملة */
const DEMO_NOISE =
  /\b(demo|demos|trial|free trial|playable teaser|teaser|beta|open beta|closed beta|alpha|playtest|test server|preview build|early access|prologue|sampler|soundtrack|ost|original soundtrack|art ?book|digital artbook|companion app|server test|network test|benchmark|multiplayer test)\b/i;

export const isBaseGame = (name: string) =>
  !EDITION_NOISE.test(name) && !DLC_NOISE.test(name) && !DEMO_NOISE.test(name);

const BANNED_PLATFORM_SLUGS = /android|ios|iphone|ipad|mobile|browser|web/i;

/** منصات مسموحة فقط: PC والكونسولات الكبرى */
export const isCoreGame = (g: RawgGame) => {
  const platforms = g.platforms ?? [];
  if (!platforms.length) return false;
  return platforms.some(
    ({ platform }) => !BANNED_PLATFORM_SLUGS.test(`${platform.slug} ${platform.name}`),
  );
};

export const cleanList = (list: RawgGame[]) =>
  list.filter((g) => isBaseGame(g.name) && isCoreGame(g));

/** لعبة لم تصدر بعد */
export const isUnreleased = (g: RawgGame) =>
  !!g.tba || !g.released || new Date(g.released).getTime() > Date.now();

export const MASTER_FRANCHISES =
  /\b(resident evil|metal gear|batman: ?arkham|arkham|god of war|the last of us|uncharted|horizon|spider-?man|ghost of tsushima|elden ring|dark souls|bloodborne|sekiro|final fantasy|silent hill|red dead|grand theft auto|gta|assassin'?s creed|far cry|cyberpunk|the witcher|mass effect|dragon age|halo|gears of war|doom|call of duty|battlefield|death stranding|hitman|tomb raider|dishonored|fallout|the elder scrolls|skyrim|hogwarts|baldur'?s gate|starfield|forza|it takes two|a plague tale|alan wake|control|returnal|ratchet|gran turismo|nier|persona|monster hunter|devil may cry|street fighter|tekken|mortal kombat|pragmata|silksong|days gone|infamous|bioshock|borderlands|diablo|stalker|kingdom come|expedition 33)\b/i;

export const prestige = (g: RawgGame) =>
  (MASTER_FRANCHISES.test(g.name) ? 100000 : 0) +
  (g.metacritic ?? 0) * 200 +
  Math.min(60000, g.added ?? 0);

export const byPrestige = (a: RawgGame, b: RawgGame) => prestige(b) - prestige(a);

export const hasSubstance = (g: RawgGame) =>
  !!g.background_image &&
  ((g.added ?? 0) >= 40 || (g.metacritic ?? 0) >= 70 || (g.ratings_count ?? 0) >= 25);

const ALIASES: [RegExp, string][] = [
  [/\bre\s*(\d+)\b/i, "resident evil $1"],
  [/\bre\b/i, "resident evil"],
  [/\bgta\b/i, "grand theft auto"],
  [/\bac\b/i, "assassin's creed"],
  [/\bcod\b/i, "call of duty"],
  [/\bmgs\s*(\d+|v)?\b/i, "metal gear solid $1"],
  [/\bgow\b/i, "god of war"],
  [/\btlou\b/i, "the last of us"],
  [/\bdmc\b/i, "devil may cry"],
  [/\brdr\s*(\d+)?\b/i, "red dead redemption $1"],
  [/\bff\s*(\d+|[ivx]+)\b/i, "final fantasy $1"],
  [/\bbg\s*3\b/i, "baldur's gate 3"],
  [/\bmk\b/i, "mortal kombat"],
  [/\bnfs\b/i, "need for speed"],
  [/\bsh\s*(\d+)\b/i, "silent hill $1"],
  [/\bgt\s*(\d+)\b/i, "gran turismo $1"],
  [/\bhzd\b/i, "horizon zero dawn"],
  [/\bsm\s*(\d+)?\b/i, "spider-man $1"],
  [/\bpubg\b/i, "playerunknown battlegrounds"],
  [/\bds\s*(\d+)?\b/i, "dark souls $1"],
  [/\bwd\s*(\d+)?\b/i, "watch dogs $1"],
  [/\bcp\s*2077\b/i, "cyberpunk 2077"],
];

export const expandQuery = (q: string) => {
  const raw = q.trim();
  const variants = new Set<string>([raw]);
  for (const [re, rep] of ALIASES) {
    if (re.test(raw)) variants.add(raw.replace(re, rep).replace(/\s+/g, " ").trim());
  }
  return [...variants].slice(0, 3);
};

export const norm = (s: string) =>
  s.toLowerCase().replace(/['’:\-–—.,!?]/g, "").replace(/\s+/g, " ").trim();

const subsequence = (needle: string, hay: string) => {
  let i = 0;
  for (const ch of hay) if (ch === needle[i]) i++;
  return i === needle.length;
};

/** درجة تطابق ضبابية: تطابق حرفي > بادئة > كلمة > احتواء > تسلسل حروف */
export const matchScore = (name: string, queries: string[]) => {
  const n = norm(name);
  const words = n.split(" ");
  let best = 0;
  for (const q of queries) {
    const nq = norm(q);
    if (!nq) continue;
    if (n === nq) best = Math.max(best, 1000);
    else if (n.startsWith(nq)) best = Math.max(best, 850);
    else if (words.some((w) => w === nq)) best = Math.max(best, 720);
    else if (n.includes(nq)) best = Math.max(best, 640);
    const tokens = nq.split(" ").filter(Boolean);
    if (tokens.length) {
      const hits = tokens.filter((t) => words.some((w) => w.startsWith(t))).length;
      const loose = tokens.filter((t) => words.some((w) => w.includes(t))).length;
      best = Math.max(best, Math.round((hits / tokens.length) * 560));
      best = Math.max(best, Math.round((loose / tokens.length) * 380));
    }
    if (best === 0 && nq.length >= 4 && subsequence(nq.replace(/ /g, ""), n.replace(/ /g, "")))
      best = Math.max(best, 200);
  }
  return best;
};

export const FRANCHISE_TERMS = [
  "resident evil",
  "batman arkham",
  "assassin's creed",
  "grand theft auto",
  "god of war",
  "the last of us",
  "ghost of tsushima",
  "metal gear solid",
  "final fantasy",
  "silent hill",
  "red dead redemption",
  "call of duty",
  "elden ring",
  "dark souls",
  "spider-man",
  "horizon",
  "uncharted",
  "the witcher",
  "cyberpunk 2077",
  "death stranding",
  "devil may cry",
  "monster hunter",
  "mortal kombat",
  "tomb raider",
  "far cry",
  "battlefield",
  "hogwarts legacy",
  "baldur's gate",
  "starfield",
  "sekiro",
  "bloodborne",
  "days gone",
  "alan wake",
  "returnal",
  "pragmata",
  "mass effect",
  "fallout",
  "the elder scrolls",
  "doom",
  "halo",
  "gears of war",
  "persona",
  "nier",
  "hitman",
  "dishonored",
  "control",
  "bioshock",
  "borderlands",
  "diablo",
  "forza",
  "gran turismo",
  "street fighter",
  "tekken",
  "silksong",
  "kingdom come deliverance",
  "dragon age",
  "dragon's dogma",
  "like a dragon",
  "star wars jedi",
  "a plague tale",
  "it takes two",
  "black myth wukong",
  "clair obscur expedition 33",
  "stellar blade",
  "lies of p",
  "armored core",
];

export const franchiseMatches = (q: string) => {
  const n = norm(q);
  if (n.length < 2) return [];
  return FRANCHISE_TERMS.filter(
    (f) => f.startsWith(n) || f.split(" ").some((w) => w.startsWith(n) && n.length >= 3),
  ).slice(0, 3);
};

import { DIFFICULTIES, type GameEntry, type Activity, type Difficulty } from "./store";

/** الألعاب المختومة قديمًا تُستثنى من كل المعدلات والخرائط الزمنية */
export const activeEntries = (entries: GameEntry[]) => entries.filter((e) => !e.legacy);

const DIFF_RANK: Record<Difficulty, number> = { easy: 1, normal: 2, hard: 3, extreme: 4 };
export const difficultyMult = (d: Difficulty | undefined) =>
  DIFFICULTIES.find((x) => x.v === (d ?? "normal"))?.mult ?? 1;

export const byStatus = (entries: GameEntry[], status: GameEntry["status"]) =>
  entries.filter((e) => e.status === status);

const topOf = (values: (string | null | undefined)[]) => {
  const map = new Map<string, number>();
  values.filter(Boolean).forEach((v) => map.set(v as string, (map.get(v as string) ?? 0) + 1));
  return [...map.entries()].sort((a, b) => b[1] - a[1]);
};

export function computeStats(entries: GameEntry[]) {
  const completed = byStatus(entries, "completed");
  const current = byStatus(entries, "current");
  const backlog = byStatus(entries, "backlog");
  const hype = byStatus(entries, "hype");
  const hours = entries.reduce((s, e) => s + (e.hours || 0), 0);
  const rated = entries.filter((e) => e.personalRating > 0);
  const genres = topOf(entries.flatMap((e) => e.genres));
  const sortedHours = [...completed].sort((a, b) => b.hours - a.hours);

  // الرسوم الزمنية تُقرأ من تاريخ الختم الفعلي
  const monthly = new Map<string, { games: number; hours: number }>();
  const liveCompleted = completed.filter((e) => !e.legacy);
  const liveHours = entries.filter((e) => !e.legacy).reduce((s, e) => s + (e.hours || 0), 0);
  const hardest =
    [...completed].sort(
      (a, b) =>
        DIFF_RANK[b.difficulty ?? "normal"] - DIFF_RANK[a.difficulty ?? "normal"] ||
        b.hours - a.hours,
    )[0] ?? null;
  liveCompleted.forEach((e) => {
    if (!e.completedAt) return;
    const k = e.completedAt.slice(0, 7);
    const prev = monthly.get(k) ?? { games: 0, hours: 0 };
    monthly.set(k, { games: prev.games + 1, hours: prev.hours + e.hours });
  });

  const firstAt = [...entries.filter((e) => !e.legacy)].sort((a, b) => a.addedAt.localeCompare(b.addedAt))[0]?.addedAt;
  const days = firstAt
    ? Math.max(1, Math.ceil((Date.now() - new Date(firstAt).getTime()) / 86400000))
    : 1;
  const months = Math.max(1, Math.ceil(days / 30.4));

  return {
    total: entries.length,
    completed: completed.length,
    current: current.length,
    backlog: backlog.length,
    hype: hype.length,
    favorites: entries.filter((e) => e.favorite).length,
    coop: entries.filter((e) => e.coop).length,
    hours,
    avgRating: rated.length ? rated.reduce((s, e) => s + e.personalRating, 0) / rated.length : 0,
    completionRate: entries.length ? (completed.length / entries.length) * 100 : 0,
    topGenre: genres[0]?.[0] ?? "—",
    longest: sortedHours[0] ?? null,
    genres,
    monthly: [...monthly.entries()].sort().map(([month, v]) => ({ month, ...v })),
    backlogHours: backlog.reduce((s, e) => s + (e.playtimeEstimate || 10), 0),
    mostActiveMonth: [...monthly.entries()].sort((a, b) => b[1].games - a[1].games)[0]?.[0] ?? "—",
    liveHours,
    liveCompleted: liveCompleted.length,
    hardest,
    avgDailyHours: liveHours / days,
    avgMonthlyCompleted: liveCompleted.length / months,
  };
}



export type Achievement = {
  id: string;
  title: string;
  desc: string;
  icon: string;
  unlocked: boolean;
  progress: number;
};

export function computeAchievements(entries: GameEntry[]): Achievement[] {
  const completed = byStatus(entries, "completed");
  const hours = entries.reduce((s, e) => s + e.hours, 0);
  const horror = completed.filter((e) => e.genres.some((g) => /horror/i.test(g)));
  const franchise = (re: RegExp) => completed.filter((e) => re.test(e.name)).length;

  const make = (
    id: string,
    title: string,
    desc: string,
    icon: string,
    value: number,
    target: number,
  ): Achievement => ({
    id,
    title,
    desc,
    icon,
    unlocked: value >= target,
    progress: Math.min(100, (value / target) * 100),
  });

  return [
    make("first", "اللعبة الأولى", "أنهِ أول لعبة", "🎯", completed.length, 1),
    make("horror", "أول لعبة رعب", "أنهِ أول لعبة رعب", "👻", horror.length, 1),
    make("platinum", "أول بلاتينيوم", "أكمل لعبة بنسبة 100%", "🏆", completed.filter((e) => e.fullCompletion).length, 1),
    make("coop", "لعبناها سوا", "أنهِ لعبة تعاونية مع أخوك", "🎮🎮", completed.filter((e) => e.coop).length, 1),
    make("h100", "100 ساعة", "العب 100 ساعة", "⏱️", hours, 100),
    make("h500", "500 ساعة", "العب 500 ساعة", "🔥", hours, 500),
    make("h1000", "1000 ساعة", "العب 1000 ساعة", "💎", hours, 1000),
    make("g10", "10 ألعاب", "أنهِ 10 ألعاب", "🎮", completed.length, 10),
    make("g25", "25 لعبة", "أنهِ 25 لعبة", "🕹️", completed.length, 25),
    make("g50", "50 لعبة", "أنهِ 50 لعبة", "🚀", completed.length, 50),
    make("g100", "100 لعبة", "أنهِ 100 لعبة", "👑", completed.length, 100),
    make("re", "سيد Resident Evil", "أنهِ 5 من سلسلة Resident Evil", "🧟", franchise(/resident evil/i), 5),
    make("sh", "سيد Silent Hill", "أنهِ 3 من سلسلة Silent Hill", "🌫️", franchise(/silent hill/i), 3),
    make("collector", "جامع الألعاب", "اجمع 50 لعبة في المكتبة", "📚", entries.length, 50),
    make("completionist", "المكمّل", "أكمل 10 ألعاب بنسبة 100%", "✨", completed.filter((e) => e.fullCompletion).length, 10),
  ];
}

/** Ordered franchise entries used for smart "what to play next" suggestions. */
export const FRANCHISE_SERIES: { name: string; match: RegExp; order: string[] }[] = [
  {
    name: "Batman: Arkham",
    match: /batman|arkham/i,
    order: [
      "Batman: Arkham Asylum",
      "Batman: Arkham City",
      "Batman: Arkham Origins",
      "Batman: Arkham Knight",
    ],
  },
  {
    name: "Resident Evil",
    match: /resident evil/i,
    order: [
      "Resident Evil",
      "Resident Evil 2",
      "Resident Evil 3",
      "Resident Evil 4",
      "Resident Evil 5",
      "Resident Evil 6",
      "Resident Evil 7: Biohazard",
      "Resident Evil Village",
    ],
  },
  {
    name: "God of War",
    match: /god of war/i,
    order: ["God of War", "God of War II", "God of War III", "God of War (2018)", "God of War Ragnarök"],
  },
  {
    name: "Uncharted",
    match: /uncharted/i,
    order: [
      "Uncharted: Drake's Fortune",
      "Uncharted 2: Among Thieves",
      "Uncharted 3: Drake's Deception",
      "Uncharted 4: A Thief's End",
      "Uncharted: The Lost Legacy",
    ],
  },
  {
    name: "Marvel's Spider-Man",
    match: /spider-?man/i,
    order: ["Marvel's Spider-Man", "Marvel's Spider-Man: Miles Morales", "Marvel's Spider-Man 2"],
  },
  {
    name: "The Last of Us",
    match: /last of us/i,
    order: ["The Last of Us", "The Last of Us Part II"],
  },
  {
    name: "Silent Hill",
    match: /silent hill/i,
    order: ["Silent Hill 2", "Silent Hill 3", "Silent Hill 4: The Room", "Silent Hill: Downpour"],
  },
  {
    name: "Dead Space",
    match: /dead space/i,
    order: ["Dead Space", "Dead Space 2", "Dead Space 3"],
  },
  {
    name: "Grand Theft Auto",
    match: /grand theft auto|gta/i,
    order: ["Grand Theft Auto: San Andreas", "Grand Theft Auto IV", "Grand Theft Auto V"],
  },
  {
    name: "Assassin's Creed",
    match: /assassin'?s creed/i,
    order: [
      "Assassin's Creed II",
      "Assassin's Creed: Brotherhood",
      "Assassin's Creed IV: Black Flag",
      "Assassin's Creed Origins",
      "Assassin's Creed Odyssey",
      "Assassin's Creed Valhalla",
      "Assassin's Creed Mirage",
    ],
  },
];

export type FranchiseProgress = {
  name: string;
  total: number;
  done: number;
  hours: number;
  pct: number;
  suggestion: string | null;
};

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

export function computeFranchises(entries: GameEntry[]): FranchiseProgress[] {
  return FRANCHISE_SERIES.map((f) => {
    const items = entries.filter((e) => f.match.test(e.name));
    const done = items.filter((e) => e.status === "completed");
    const owned = new Set(items.map((e) => norm(e.name)));
    const completedSet = new Set(done.map((e) => norm(e.name)));
    // suggest the next title in canonical order that isn't finished yet
    const suggestion =
      done.length > 0
        ? (f.order.find((t) => !completedSet.has(norm(t)) && !owned.has(norm(t))) ??
          f.order.find((t) => !completedSet.has(norm(t))) ??
          null)
        : null;
    return {
      name: f.name,
      total: items.length,
      done: done.length,
      hours: items.reduce((s, e) => s + e.hours, 0),
      pct: items.length ? (done.length / items.length) * 100 : 0,
      suggestion,
    };
  }).filter((f) => f.total > 0);
}

export const COLLECTIONS: { name: string; match: (e: GameEntry) => boolean }[] = [
  { name: "الرعب", match: (e) => e.genres.some((g) => /horror/i.test(g)) },
  { name: "قصة غنية", match: (e) => e.genres.some((g) => /adventure|rpg/i.test(g)) },
  { name: "عالم مفتوح", match: (e) => e.genres.some((g) => /action|adventure/i.test(g)) },
  { name: "RPG", match: (e) => e.genres.some((g) => /rpg/i.test(g)) },
  { name: "تصويب", match: (e) => e.genres.some((g) => /shooter/i.test(g)) },
  { name: "لعبناها سوا", match: (e) => e.coop },
  { name: "المفضلة", match: (e) => e.favorite },
];

export const activityIcon = (t: Activity["type"]) =>
  ({
    start: "▶️",
    finish: "🏁",
    add: "➕",
    favorite: "⭐",
    achievement: "🏅",
    goal: "🎯",
    rate: "⭐️",
    platinum: "🏆",
    session: "⏱️",
  })[t] ?? "•";

/* ============================ نظام المستويات ============================ */

/** XP: ساعة = 10 نقاط، لعبة مكتملة = 150 × معامل الصعوبة (+ طولها)، بلاتينيوم = 250 */
export function computeLevel(entries: GameEntry[]) {
  return computeProgress(entries);
}

/* ============================ ودجات اللوحة ============================ */

/** لعبة الشهر: الأكثر لعبًا خلال الشهر الحالي (جلسات، وإلا آخر ما بدأ/ختم) */
export function gameOfMonth(entries: GameEntry[]): { game: GameEntry; hours: number } | null {
  const key = new Date().toISOString().slice(0, 7);
  const scored = entries
    .map((e) => {
      const sessionHours =
        e.sessions
          ?.filter((s) => s.date?.startsWith(key))
          .reduce((s, x) => s + x.minutes / 60, 0) ?? 0;
      const touched =
        e.completedAt?.startsWith(key) || e.startedAt?.startsWith(key) ? e.hours : 0;
      return { game: e, hours: sessionHours || touched };
    })
    .filter((x) => x.hours > 0)
    .sort((a, b) => b.hours - a.hours);
  return scored[0] ?? null;
}

export type Memory = { text: string; game: GameEntry };

/** صندوق الذكريات: أحداث في مثل هذا اليوم من سنوات سابقة */
export function memoryBox(entries: GameEntry[]): Memory[] {
  const now = new Date();
  const md = (d: string) => d.slice(5, 10);
  const today = `${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const out: Memory[] = [];
  entries.forEach((e) => {
    const check = (date: string | null, verb: string) => {
      if (!date) return;
      const d = new Date(date);
      const years = now.getFullYear() - d.getFullYear();
      if (years >= 1 && md(date) === today)
        out.push({
          text: `في مثل هذا اليوم قبل ${years === 1 ? "سنة" : `${years} سنوات`} ${verb} «${e.name}»`,
          game: e,
        });
    };
    check(e.startedAt, "بدأت");
    check(e.completedAt, "ختمت");
  });
  return out.slice(0, 3);
}

/** توصية ذكية من قائمة الانتظار بناءً على آخر لعبة مكتملة */
export function recommendation(entries: GameEntry[]): { game: GameEntry; reason: string } | null {
  const pool = entries.filter((e) => e.status === "backlog");
  if (!pool.length) return null;
  const lastCompleted = entries
    .filter((e) => e.status === "completed" && e.completedAt)
    .sort((a, b) => (b.completedAt ?? "").localeCompare(a.completedAt ?? ""))[0];

  if (lastCompleted) {
    const sameFranchise = FRANCHISE_SERIES.find((f) => f.match.test(lastCompleted.name));
    if (sameFranchise) {
      const nextInSeries = pool.find((e) => sameFranchise.match.test(e.name));
      if (nextInSeries)
        return {
          game: nextInSeries,
          reason: `لأنك أنهيت «${lastCompleted.name}» من نفس السلسلة`,
        };
    }
    const sharedGenre = pool.find((e) => e.genres.some((g) => lastCompleted.genres.includes(g)));
    if (sharedGenre) {
      const days = Math.round(
        (Date.now() - new Date(lastCompleted.completedAt as string).getTime()) / 86400000,
      );
      return {
        game: sharedGenre,
        reason: `أنهيت «${lastCompleted.name}» قبل ${days} يوم، وهي من نفس النوع`,
      };
    }
  }
  const shortest = [...pool].sort(
    (a, b) => (a.playtimeEstimate || 99) - (b.playtimeEstimate || 99),
  )[0];
  return shortest ? { game: shortest, reason: "أقصر لعبة في قائمتك — بداية سهلة" } : null;
}

/* ============================ الملخص السنوي ============================ */

export function computeWrap(entries: GameEntry[], year: number) {
  const inYear = entries.filter((e) => !e.legacy && e.completedAt?.startsWith(String(year)));
  const hoursOfYear = inYear.reduce((s, e) => s + e.hours, 0);
  const rated = inYear.filter((e) => e.personalRating > 0).sort((a, b) => b.personalRating - a.personalRating);
  const months = new Map<string, number>();
  inYear.forEach((e) => {
    const k = e.completedAt!.slice(0, 7);
    months.set(k, (months.get(k) ?? 0) + e.hours);
  });
  const franchises = computeFranchises(inYear).sort((a, b) => b.hours - a.hours);

  // خريطة الحرارة: ساعات لكل يوم من أيام السنة
  const heat = new Map<string, number>();
  entries.filter((e) => !e.legacy).forEach((e) => {
    (e.sessions ?? []).forEach((s) => {
      if (s.date?.startsWith(String(year))) heat.set(s.date, (heat.get(s.date) ?? 0) + s.minutes / 60);
    });
    if (e.completedAt?.startsWith(String(year))) {
      const d = e.completedAt.slice(0, 10);
      if (!(e.sessions ?? []).length) heat.set(d, (heat.get(d) ?? 0) + Math.min(e.hours, 8));
    }
  });

  return {
    year,
    games: inYear.length,
    hours: hoursOfYear,
    best: rated[0] ?? null,
    worst: rated.length > 1 ? rated[rated.length - 1] : null,
    topMonth: [...months.entries()].sort((a, b) => b[1] - a[1])[0] ?? null,
    topFranchise: franchises[0] ?? null,
    platinum: inYear.filter((e) => e.fullCompletion).length,
    heat,
  };
}

/** أيام السنة كشبكة أسابيع (لخريطة الحرارة) */
export function yearGrid(year: number) {
  const days: { date: string; dow: number }[] = [];
  const d = new Date(Date.UTC(year, 0, 1));
  while (d.getUTCFullYear() === year) {
    days.push({ date: d.toISOString().slice(0, 10), dow: d.getUTCDay() });
    d.setUTCDate(d.getUTCDate() + 1);
  }
  const weeks: ({ date: string; dow: number } | null)[][] = [];
  let week: ({ date: string; dow: number } | null)[] = Array(days[0]!.dow).fill(null);
  days.forEach((day) => {
    week.push(day);
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  });
  if (week.length) weeks.push([...week, ...Array(7 - week.length).fill(null)]);
  return weeks;
}

/* ============================ السلاسل ============================ */

export function findFranchise(gameName: string) {
  return FRANCHISE_SERIES.find((f) => f.match.test(gameName)) ?? null;
}

export type FranchiseTimelineItem = {
  title: string;
  entry: GameEntry | null;
  state: "done" | "playing" | "none";
};

export function franchiseTimeline(
  franchiseName: string,
  entries: GameEntry[],
): { name: string; items: FranchiseTimelineItem[]; pct: number } | null {
  const f = FRANCHISE_SERIES.find((x) => x.name === franchiseName);
  if (!f) return null;
  const owned = entries.filter((e) => f.match.test(e.name));
  const titles = [...f.order];
  owned.forEach((e) => {
    if (!titles.some((t) => norm(t) === norm(e.name))) titles.push(e.name);
  });
  const items: FranchiseTimelineItem[] = titles.map((title) => {
    const entry = owned.find((e) => norm(e.name) === norm(title)) ?? null;
    return {
      title,
      entry,
      state:
        entry?.status === "completed" ? "done" : entry?.status === "current" ? "playing" : "none",
    };
  });
  const done = items.filter((i) => i.state === "done").length;
  return { name: f.name, items, pct: items.length ? (done / items.length) * 100 : 0 };
}

/** ألعاب قاعة المشاهير: 9.5+ أو مُعلّمة يدويًا */
export const hallOfFameGames = (entries: GameEntry[]) =>
  entries
    .filter((e) => e.hallOfFame || e.personalRating >= 9.5)
    .sort((a, b) => b.personalRating - a.personalRating);

export const hallBadge = (e: GameEntry) => {
  if (e.genres.some((g) => /horror/i.test(g))) return "أفضل لعبة رعب";
  if (e.genres.some((g) => /rpg/i.test(g))) return "أفضل RPG";
  if (e.genres.some((g) => /shooter/i.test(g))) return "أفضل تصويب";
  if (e.genres.some((g) => /adventure/i.test(g))) return "أفضل مغامرة";
  if (e.coop) return "أفضل لعبة سوا";
  return "أسطورة شخصية";
};


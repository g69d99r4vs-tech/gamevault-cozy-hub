import type { GameEntry } from "./store";
import { difficultyMult } from "./stats";

/* ============================ منحنى المستويات ============================ */

/** نقاط مرجعية للمنحنى — عدّلها من هنا فقط */
const ANCHORS: [level: number, xp: number][] = [
  [1, 0],
  [2, 500],
  [3, 1100],
  [5, 2500],
  [10, 7500],
  [20, 20000],
  [30, 40000],
  [40, 70000],
  [50, 110000],
  [75, 235000],
  [100, 397500],
];

export const MAX_LEVEL = 100;

/** جدول العتبات لكل مستوى من 1 إلى 100 (تفريد خطّي بين النقاط المرجعية) */
export const XP_TABLE: number[] = (() => {
  const table: number[] = [0];
  for (let lvl = 1; lvl <= MAX_LEVEL; lvl++) {
    let i = 0;
    while (i < ANCHORS.length - 1 && ANCHORS[i + 1]![0] < lvl) i++;
    const [l0, x0] = ANCHORS[i]!;
    const [l1, x1] = ANCHORS[Math.min(i + 1, ANCHORS.length - 1)]!;
    const value = l1 === l0 ? x1 : x0 + ((x1 - x0) * (lvl - l0)) / (l1 - l0);
    table[lvl] = Math.round(value / 50) * 50;
  }
  return table;
})();

export const xpForLevel = (level: number) =>
  XP_TABLE[Math.min(MAX_LEVEL, Math.max(1, Math.round(level)))] ?? 0;

/* ============================ الرتب ============================ */

export type Rank = { min: number; ar: string; en: string };

export const RANKS: Rank[] = [
  { min: 1, ar: "لاعب جديد", en: "New Player" },
  { min: 5, ar: "لاعب", en: "Gamer" },
  { min: 10, ar: "لاعب محترف", en: "Skilled Gamer" },
  { min: 20, ar: "مخضرم", en: "Veteran" },
  { min: 30, ar: "خبير ألعاب", en: "Gaming Expert" },
  { min: 40, ar: "أسطورة صاعدة", en: "Gaming Master" },
  { min: 50, ar: "النخبة", en: "Gaming Elite" },
  { min: 75, ar: "أسطورة الألعاب", en: "Gaming Legend" },
  { min: 100, ar: "أسطورة GameHub", en: "GameHub Legend" },
];

export const rankFor = (level: number): Rank =>
  [...RANKS].reverse().find((r) => level >= r.min) ?? RANKS[0]!;

/* ============================ المكافآت ============================ */

export type Reward = { level: number; icon: string; label: string };

export const REWARDS: Reward[] = [
  { level: 5, icon: "🎖️", label: "لقب «لاعب»" },
  { level: 10, icon: "🏷️", label: "ألقاب مخصّصة" },
  { level: 15, icon: "🖼️", label: "إطار للصورة الشخصية" },
  { level: 20, icon: "👑", label: "شارة المخضرم" },
  { level: 30, icon: "🌟", label: "توهّج ذهبي للملف" },
  { level: 40, icon: "💠", label: "شارة الأسطورة الصاعدة" },
  { level: 50, icon: "🔥", label: "إطار النخبة" },
  { level: 75, icon: "🏛️", label: "قاعة الأساطير" },
  { level: 100, icon: "🏆", label: "لقب أسطورة GameHub" },
];

export const nextReward = (level: number) => REWARDS.find((r) => r.level > level) ?? null;
export const unlockedRewards = (level: number) => REWARDS.filter((r) => r.level <= level);

/* ============================ حساب الخبرة ============================ */

/**
 * الخبرة مشتقّة بالكامل من حالة المكتبة الحالية، فلا يمكن تكرارها:
 * حذف لعبة ثم إعادتها يعيد نفس الرقم ولا يراكمه.
 */
export function computeXp(entries: GameEntry[]) {
  const hours = entries.reduce((s, e) => s + (e.hours || 0), 0);
  const completed = entries.filter((e) => e.status === "completed");
  const platinum = entries.filter((e) => e.fullCompletion && e.status === "completed").length;
  const completionXp = completed.reduce((sum, e) => {
    const length = Math.min(120, e.hours || e.playtimeEstimate || 0);
    return sum + (150 + length * 4) * difficultyMult(e.difficulty);
  }, 0);
  const sessionXp = entries.reduce((s, e) => s + Math.min(50, (e.sessions ?? []).length) * 15, 0);
  return Math.round(hours * 10 + completionXp + platinum * 250 + sessionXp);
}

export type Progress = {
  xp: number;
  level: number;
  pct: number;
  toNext: number;
  currentLevelXp: number;
  nextLevelXp: number;
  rank: Rank;
  next: Reward | null;
  max: boolean;
};

export function computeProgress(entries: GameEntry[]): Progress {
  const xp = computeXp(entries);
  let level = 1;
  while (level < MAX_LEVEL && xp >= xpForLevel(level + 1)) level += 1;
  const currentLevelXp = xpForLevel(level);
  const nextLevelXp = level >= MAX_LEVEL ? currentLevelXp : xpForLevel(level + 1);
  const span = Math.max(1, nextLevelXp - currentLevelXp);
  const pct = level >= MAX_LEVEL ? 100 : Math.min(100, ((xp - currentLevelXp) / span) * 100);
  return {
    xp,
    level,
    pct,
    toNext: level >= MAX_LEVEL ? 0 : Math.max(0, nextLevelXp - xp),
    currentLevelXp,
    nextLevelXp,
    rank: rankFor(level),
    next: nextReward(level),
    max: level >= MAX_LEVEL,
  };
}

/* ============================ سلسلة الأيام ============================ */

const dayKey = (d: Date) => d.toISOString().slice(0, 10);

/** سلسلة الأيام المتتالية اعتمادًا على الجلسات وتواريخ الختم الحقيقية */
export function computeStreak(entries: GameEntry[]) {
  const days = new Set<string>();
  for (const e of entries) {
    (e.sessions ?? []).forEach((s) => s.date && days.add(s.date.slice(0, 10)));
    if (!e.legacy && e.completedAt) {
      const d = new Date(e.completedAt);
      if (!Number.isNaN(d.getTime())) days.add(dayKey(d));
    }
  }
  if (!days.size) return 0;
  const today = new Date();
  const cursor = new Date(today);
  if (!days.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (days.has(dayKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

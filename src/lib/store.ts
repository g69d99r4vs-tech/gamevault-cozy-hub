import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { RawgGame } from "./rawg";
import {
  deleteEntry as cloudDelete,
  pullAll,
  pushActivity,
  pushEntries,
  pushEntry,
  pushProfile,
  subscribeToCloud,
  wipeUser,
} from "./sync";

export type UserId = "faisal" | "mishal";
/** الحالات: مكتملة، قيد اللعب، الانتظار (ناوي أختمها)، المرتقبة (ألعاب لم تصدر) */
export type Status = "current" | "completed" | "backlog" | "hype";
export type Priority = "high" | "medium" | "low";
/** مستوى صعوبة اللعبة المكتملة (يؤثر على نقاط الخبرة) */
export type Difficulty = "easy" | "normal" | "hard" | "extreme";

export const DIFFICULTIES: { v: Difficulty; l: string; mult: number }[] = [
  { v: "easy", l: "سهلة", mult: 0.75 },
  { v: "normal", l: "عادية", mult: 1 },
  { v: "hard", l: "صعبة", mult: 1.5 },
  { v: "extreme", l: "Souls-like", mult: 2.25 },
];

export const difficultyLabel = (d: Difficulty) =>
  DIFFICULTIES.find((x) => x.v === d)?.l ?? "عادية";

export type PlaySession = {
  id: string;
  date: string; // YYYY-MM-DD
  start: string; // HH:MM
  end: string; // HH:MM
  minutes: number;
};

export type GameEntry = {
  id: number;
  slug: string;
  name: string;
  image: string | null;
  released: string | null;
  rating: number;
  metacritic: number | null;
  genres: string[];
  developer: string | null;
  publisher: string | null;
  playtimeEstimate: number;
  status: Status;
  favorite: boolean;
  favoriteOrder: number;
  /** ترتيب الطابور في «ناوي أختمها» */
  queuePosition: number;
  progress: number;
  hours: number;
  personalRating: number;
  recommend: boolean;
  replay: boolean;
  hallOfFame: boolean;
  sessions: PlaySession[];
  review: string;
  notes: string;
  bestMoment: string;
  worstMoment: string;
  priority: Priority;
  coop: boolean;
  fullCompletion: boolean;
  /** ختمها قديمًا — تُحتسب في العدد فقط ولا تدخل المعدلات والخرائط */
  legacy: boolean;
  difficulty: Difficulty;
  startedAt: string | null;
  completedAt: string | null;
  addedAt: string;
};

export type ActivityType =
  | "start"
  | "finish"
  | "add"
  | "favorite"
  | "achievement"
  | "goal"
  | "rate"
  | "platinum"
  | "session";

export type Activity = {
  id: string;
  type: ActivityType;
  text: string;
  at: string;
};

export type Goal = { id: string; title: string; target: number; current: number; unit: string };

export type Profile = {
  name: string;
  avatar: string;
  bio: string;
  favoriteGame: string;
  favoriteGenre: string;
};

type UserData = { profile: Profile; entries: GameEntry[]; activities: Activity[]; goals: Goal[] };

type State = {
  currentUser: UserId;
  /** هل اختار المستخدم ملفه من شاشة البداية في هذه الجلسة */
  profileChosen: boolean;
  hydrated: boolean;
  users: Record<UserId, UserData>;
  setUser: (u: UserId) => void;
  chooseProfile: (u: UserId) => void;
  addGame: (game: RawgGame, status: Status) => void;
  /** استيراد جماعي: ألعاب مختومة قديمًا بساعاتها العالمية أو إصدارات مرتقبة */
  bulkAdd: (items: { game: RawgGame; status: Status; hours?: number; legacy?: boolean }[]) => void;

  updateGame: (id: number, patch: Partial<GameEntry>) => void;
  removeGame: (id: number) => void;
  toggleFavorite: (id: number) => void;
  completeGame: (id: number, data: Partial<GameEntry>) => void;
  reorderQueue: (ids: number[]) => void;
  addSession: (id: number, session: Omit<PlaySession, "id">) => void;
  updateProfile: (patch: Partial<Profile>) => void;
  addGoal: (g: Omit<Goal, "id">) => void;
  removeGoal: (id: string) => void;
  importData: (raw: string) => boolean;
  /** تصفير شامل: يمسح ألعاب ونشاطات المستخدم الحالي من الجهاز والسحابة */
  resetAll: () => Promise<void>;
  /** تصفير التقدّم فقط: المستوى، الخبرة، الساعات والختمات — مع إبقاء المكتبة والخطة والملف */
  resetProgress: () => void;
  hydrateFromCloud: () => Promise<void>;
};

const emptyUser = (name: string, avatar: string, bio: string): UserData => ({
  profile: { name, avatar, bio, favoriteGame: "—", favoriteGenre: "—" },
  entries: [],
  activities: [],
  goals: [
    { id: "g1", title: "إنهاء 30 لعبة هذا العام", target: 30, current: 0, unit: "لعبة" },
    { id: "g2", title: "لعب 600 ساعة", target: 600, current: 0, unit: "ساعة" },
  ],
});

/** لعبة لم تصدر بعد (تاريخ مستقبلي أو بلا تاريخ معلن) ⇒ تُضاف دائمًا إلى «المرتقبة» */
export const isFutureRelease = (released: string | null | undefined) =>
  !released || new Date(released).getTime() > Date.now();


export const resolveStatus = (released: string | null | undefined, wanted: Status): Status =>
  isFutureRelease(released) ? "hype" : wanted;

export const entryFromRawg = (g: RawgGame, status: Status): GameEntry => ({
  id: g.id,
  slug: g.slug,
  name: g.name,
  image: g.background_image,
  released: g.released,
  rating: g.rating ?? 0,
  metacritic: g.metacritic ?? null,
  genres: (g.genres ?? []).map((x) => x.name),
  developer: g.developers?.[0]?.name ?? null,
  publisher: g.publishers?.[0]?.name ?? null,
  playtimeEstimate: g.playtime ?? 0,
  status,
  favorite: false,
  favoriteOrder: 0,
  queuePosition: 0,
  progress: status === "completed" ? 100 : 0,
  hours: 0,
  personalRating: 0,
  recommend: false,
  replay: false,
  hallOfFame: false,
  sessions: [],
  review: "",
  notes: "",
  bestMoment: "",
  worstMoment: "",
  priority: "medium",
  coop: false,
  fullCompletion: false,
  legacy: false,
  difficulty: "normal",
  startedAt: status === "current" ? new Date().toISOString() : null,
  completedAt: status === "completed" ? new Date().toISOString() : null,
  addedAt: new Date().toISOString(),
});

export const statusLabel: Record<Status, string> = {
  current: "قيد اللعب",
  completed: "المكتملة",
  backlog: "الانتظار",
  hype: "المرتقبة",
};

/** توافق مع البيانات القديمة: حالة «التالي» أصبحت «الانتظار» */
export const normalizeStatus = (s: string): Status =>
  s === "next" ? "backlog" : (s as Status);

const normalizeEntries = (entries: GameEntry[]): GameEntry[] =>
  entries.map((e) => (e.status === ("next" as unknown as Status) ? { ...e, status: "backlog" as Status } : e));

export const otherUser = (u: UserId): UserId => (u === "faisal" ? "mishal" : "faisal");

/** يضبط تواريخ البدء/الختم تلقائيًا حسب تغيّر الحالة */
export function applyStatusDates(before: GameEntry, after: GameEntry): GameEntry {
  const now = new Date().toISOString();
  let { startedAt, completedAt } = after;
  if (after.status === "current" && before.status !== "current" && !startedAt) startedAt = now;
  if (after.status === "completed") {
    if (!completedAt) completedAt = now;
    if (!startedAt) startedAt = before.startedAt ?? now;
  }
  if (after.status !== "completed") completedAt = null;
  return { ...after, startedAt, completedAt, progress: after.status === "completed" ? 100 : after.progress };
}

export const useStore = create<State>()(
  persist(
    (set, get) => {
      const log = (u: UserData, uid: UserId, type: ActivityType, text: string): UserData => {
        const activity: Activity = { id: crypto.randomUUID(), type, text, at: new Date().toISOString() };
        pushActivity(uid, activity);
        return { ...u, activities: [activity, ...u.activities].slice(0, 300) };
      };

      const mutate = (fn: (u: UserData, uid: UserId) => UserData) =>
        set((s) => ({ users: { ...s.users, [s.currentUser]: fn(s.users[s.currentUser], s.currentUser) } }));

      // mirrors a co-op entry (hours + completion) into the other brother's library
      const syncCoop = (s: State, entry: GameEntry): State["users"] => {
        const other = otherUser(s.currentUser);
        const data = s.users[other];
        const existing = data.entries.find((e) => e.id === entry.id);
        const mirrored: GameEntry = { ...entry, favorite: existing?.favorite ?? false };
        const entries = existing
          ? data.entries.map((e) =>
              e.id === entry.id
                ? {
                    ...e,
                    hours: entry.hours,
                    coop: true,
                    status: entry.status,
                    progress: entry.progress,
                    fullCompletion: entry.fullCompletion,
                    startedAt: entry.startedAt,
                    completedAt: entry.completedAt,
                  }
                : e,
            )
          : [mirrored, ...data.entries];
        pushEntries(other, entries.filter((e) => e.id === entry.id));
        return { ...s.users, [other]: { ...data, entries } };
      };

      const applyEntry = (
        id: number,
        patch: Partial<GameEntry>,
        activity?: (e: GameEntry) => [ActivityType, string][],
      ) =>
        set((s) => {
          const uid = s.currentUser;
          const data = s.users[uid];
          const before = data.entries.find((e) => e.id === id);
          if (!before) return s;
          const after = applyStatusDates(before, { ...before, ...patch });
          let next: UserData = { ...data, entries: data.entries.map((e) => (e.id === id ? after : e)) };

          // أحداث الخط الزمني التلقائية
          const events: [ActivityType, string][] = activity ? activity(after) : [];
          if (before.status !== "current" && after.status === "current")
            events.push(["start", `بدأ لعب «${after.name}»`]);
          if (before.personalRating !== after.personalRating && after.personalRating > 0)
            events.push(["rate", `قيّم «${after.name}» بـ ${after.personalRating}/10`]);
          if (!before.fullCompletion && after.fullCompletion)
            events.push(["platinum", `حصل على البلاتينيوم في «${after.name}» 🏆`]);
          events.forEach(([t, text]) => {
            next = log(next, uid, t, text);
          });

          pushEntry(uid, after);
          const users = { ...s.users, [uid]: next };
          return after.coop ? { users: syncCoop({ ...s, users }, after) } : { users };
        });

      return {
        currentUser: "faisal",
        profileChosen: false,
        hydrated: false,
        users: {
          faisal: emptyUser("فيصل", "outlaw", "لاعب رعب ومحب لسلسلة Resident Evil."),
          mishal: emptyUser("مشعل", "ninja", "عاشق ألعاب القصة والعوالم المفتوحة."),
        },
        setUser: (u) => set({ currentUser: u }),
        chooseProfile: (u) => set({ currentUser: u, profileChosen: true }),
        addGame: (g, wanted) =>
          mutate((u, uid) => {
            const status = resolveStatus(g.released, wanted);
            const existing = u.entries.find((e) => e.id === g.id);
            if (existing) {
              const after = applyStatusDates(existing, { ...existing, status });
              pushEntry(uid, after);
              return { ...u, entries: u.entries.map((e) => (e.id === g.id ? after : e)) };
            }
            const entry = entryFromRawg(g, status);
            if (status === "backlog")
              entry.queuePosition =
                Math.max(0, ...u.entries.filter((e) => e.status === "backlog").map((e) => e.queuePosition)) + 1;
            pushEntry(uid, entry);
            return log(
              { ...u, entries: [entry, ...u.entries] },
              uid,
              status === "current" ? "start" : status === "completed" ? "finish" : "add",
              `أُضيفت «${g.name}» إلى ${statusLabel[status]}`,
            );
          }),
        bulkAdd: (items) =>
          mutate((u, uid) => {
            const map = new Map(u.entries.map((e) => [e.id, e]));
            const now = new Date().toISOString();
            for (const it of items) {
              const base = map.get(it.game.id) ?? entryFromRawg(it.game, it.status);
              const status = resolveStatus(it.game.released, it.status);
              map.set(it.game.id, {
                ...base,
                status,
                hours: it.hours ?? base.hours,
                legacy: it.legacy ?? base.legacy,
                progress: status === "completed" ? 100 : base.progress,
                startedAt: status === "completed" && it.legacy ? null : base.startedAt,
                completedAt: status === "completed" ? (base.completedAt ?? now) : null,
              });
            }
            const entries = [...map.values()];
            pushEntries(uid, entries);
            return { ...u, entries };
          }),
        updateGame: (id, patch) => applyEntry(id, patch),

        removeGame: (id) =>
          mutate((u, uid) => {
            cloudDelete(uid, id);
            return { ...u, entries: u.entries.filter((e) => e.id !== id) };
          }),
        toggleFavorite: (id) =>
          mutate((u, uid) => {
            const entry = u.entries.find((e) => e.id === id);
            if (!entry) return u;
            const after = { ...entry, favorite: !entry.favorite };
            pushEntry(uid, after);
            const next = { ...u, entries: u.entries.map((e) => (e.id === id ? after : e)) };
            return after.favorite ? log(next, uid, "favorite", `أضاف «${entry.name}» إلى المفضلة`) : next;
          }),
        completeGame: (id, data) =>
          applyEntry(
            id,
            {
              ...data,
              status: "completed",
              progress: 100,
              completedAt: data.completedAt ?? new Date().toISOString(),
            },
            (e) => {
              const days =
                e.startedAt && e.completedAt
                  ? Math.max(
                      0,
                      Math.round(
                        (new Date(e.completedAt).getTime() - new Date(e.startedAt).getTime()) / 86400000,
                      ),
                    )
                  : null;
              return [
                [
                  "finish",
                  `ختم «${e.name}» 🎉${days !== null ? ` خلال ${days} يوم` : ""}${
                    e.personalRating ? ` وأعطاها ${e.personalRating}/10` : ""
                  }`,
                ],
              ];
            },
          ),
        reorderQueue: (ids) =>
          mutate((u, uid) => {
            const entries = u.entries.map((e) => {
              const i = ids.indexOf(e.id);
              return i === -1 ? e : { ...e, queuePosition: i + 1 };
            });
            pushEntries(uid, entries.filter((e) => ids.includes(e.id)));
            return { ...u, entries };
          }),
        addSession: (id, session) =>
          set((s) => {
            const uid = s.currentUser;
            const data = s.users[uid];
            const entry = data.entries.find((e) => e.id === id);
            if (!entry) return s;
            const full: PlaySession = { ...session, id: crypto.randomUUID() };
            const after: GameEntry = {
              ...entry,
              sessions: [full, ...entry.sessions].slice(0, 200),
              hours: Math.round((entry.hours + full.minutes / 60) * 10) / 10,
            };
            let next: UserData = {
              ...data,
              entries: data.entries.map((e) => (e.id === id ? after : e)),
            };
            next = log(
              next,
              uid,
              "session",
              `لعب ${Math.round((full.minutes / 60) * 10) / 10} ساعة في «${after.name}»`,
            );
            pushEntry(uid, after);
            const users = { ...s.users, [uid]: next };
            return after.coop ? { users: syncCoop({ ...s, users }, after) } : { users };
          }),
        updateProfile: (patch) =>
          mutate((u, uid) => {
            const profile = { ...u.profile, ...patch };
            pushProfile(uid, profile);
            return { ...u, profile };
          }),
        addGoal: (g) => mutate((u) => ({ ...u, goals: [...u.goals, { ...g, id: crypto.randomUUID() }] })),
        removeGoal: (id) => mutate((u) => ({ ...u, goals: u.goals.filter((g) => g.id !== id) })),
        resetAll: async () => {
          const uid = get().currentUser;
          await wipeUser(uid);
          set((s) => ({
            users: {
              ...s.users,
              [uid]: {
                ...s.users[uid],
                entries: [],
                activities: [],
                goals: s.users[uid].goals.map((g) => ({ ...g, current: 0 })),
              },
            },
          }));
        },
        resetProgress: () =>
          set((s) => {
            const uid = s.currentUser;
            const data = s.users[uid];
            const entries = data.entries.map((e) =>
              e.status === "completed" || e.hours > 0 || (e.sessions?.length ?? 0) > 0
                ? {
                    ...e,
                    status: e.status === "completed" ? ("backlog" as Status) : e.status,
                    hours: 0,
                    sessions: [],
                    progress: 0,
                    fullCompletion: false,
                    personalRating: 0,
                    hallOfFame: false,
                    legacy: false,
                    startedAt: null,
                    completedAt: null,
                  }
                : e,
            );
            pushEntries(uid, entries);
            return {
              users: {
                ...s.users,
                [uid]: {
                  ...data,
                  entries,
                  activities: [],
                  goals: data.goals.map((g) => ({ ...g, current: 0 })),
                },
              },
            };
          }),
        importData: (raw) => {
          try {
            const parsed = JSON.parse(raw) as { users: State["users"] };
            if (!parsed.users?.faisal || !parsed.users?.mishal) return false;
            set({ users: parsed.users });
            (["faisal", "mishal"] as UserId[]).forEach((u) => {
              pushEntries(u, parsed.users[u].entries);
              pushProfile(u, parsed.users[u].profile);
            });
            return true;
          } catch {
            return false;
          }
        },
        hydrateFromCloud: async () => {
          const snap = await pullAll();
          if (!snap) {
            set({ hydrated: true });
            return;
          }
          set((s) => ({
            hydrated: true,
            users: {
              faisal: {
                ...s.users.faisal,
                profile: { ...s.users.faisal.profile, ...snap.profiles.faisal },
                entries: normalizeEntries(snap.entries.faisal),
                activities: snap.activities.faisal,
              },
              mishal: {
                ...s.users.mishal,
                profile: { ...s.users.mishal.profile, ...snap.profiles.mishal },
                entries: normalizeEntries(snap.entries.mishal),
                activities: snap.activities.mishal,
              },
            },
          }));
        },
      };
    },
    {
      name: "gamehub-store-v3",
      version: 2,
      migrate: (state) => {
        const s = state as State | undefined;
        if (s?.users) {
          (["faisal", "mishal"] as UserId[]).forEach((u) => {
            s.users[u] = { ...s.users[u], entries: normalizeEntries(s.users[u].entries ?? []) };
          });
        }
        return s as State;
      },
      partialize: (s) => ({ currentUser: s.currentUser, users: s.users }) as unknown as State,
    },
  ),
);

/** يشغّل السحب الأولي والاشتراك اللحظي (يُستدعى مرة واحدة من الجذر) */
export function startCloudSync() {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const refresh = () => {
    clearTimeout(timer);
    timer = setTimeout(() => void useStore.getState().hydrateFromCloud(), 300);
  };
  void useStore.getState().hydrateFromCloud();
  const unsubscribe = subscribeToCloud(refresh);
  return () => {
    clearTimeout(timer);
    unsubscribe();
  };
}

export const useCurrentData = () => useStore((s) => s.users[s.currentUser]);
export const useOtherData = () => useStore((s) => s.users[otherUser(s.currentUser)]);

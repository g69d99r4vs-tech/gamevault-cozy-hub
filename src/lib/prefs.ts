import { create } from "zustand";
import { persist } from "zustand/middleware";

/** لون التمييز (Accent) المتاح في الإعدادات */
export type AccentId = "gold" | "blue" | "crimson" | "purple" | "emerald";

export type Accent = {
  id: AccentId;
  label: string;
  /** لون معاينة للدائرة في الإعدادات */
  swatch: string;
  primary: string;
  primary2: string;
  foreground: string;
};

export const ACCENTS: Accent[] = [
  {
    id: "gold",
    label: "ذهبي",
    swatch: "oklch(0.82 0.15 86)",
    primary: "oklch(0.82 0.15 86)",
    primary2: "oklch(0.7 0.16 62)",
    foreground: "oklch(0.16 0.02 80)",
  },
  {
    id: "blue",
    label: "أزرق نيون",
    swatch: "oklch(0.72 0.17 250)",
    primary: "oklch(0.72 0.17 250)",
    primary2: "oklch(0.62 0.19 268)",
    foreground: "oklch(0.14 0.02 250)",
  },
  {
    id: "crimson",
    label: "أحمر قرمزي",
    swatch: "oklch(0.63 0.22 22)",
    primary: "oklch(0.65 0.21 22)",
    primary2: "oklch(0.55 0.2 10)",
    foreground: "oklch(0.98 0.01 20)",
  },
  {
    id: "purple",
    label: "بنفسجي سايبربنك",
    swatch: "oklch(0.66 0.22 305)",
    primary: "oklch(0.68 0.21 305)",
    primary2: "oklch(0.58 0.22 290)",
    foreground: "oklch(0.98 0.01 300)",
  },
  {
    id: "emerald",
    label: "أخضر زمردي",
    swatch: "oklch(0.72 0.16 160)",
    primary: "oklch(0.74 0.15 160)",
    primary2: "oklch(0.62 0.15 172)",
    foreground: "oklch(0.13 0.02 160)",
  },
];

export type ReleaseLead = 1 | 3 | 7;

type PrefsState = {
  accent: AccentId;
  notifyDeals: boolean;
  notifyReleases: boolean;
  releaseLead: ReleaseLead;
  notifyMemories: boolean;
  animations: boolean;
  haptics: boolean;
  setAccent: (a: AccentId) => void;
  set: (patch: Partial<Omit<PrefsState, "set" | "setAccent">>) => void;
};

export const usePrefs = create<PrefsState>()(
  persist(
    (set) => ({
      accent: "gold",
      notifyDeals: true,
      notifyReleases: true,
      releaseLead: 3,
      notifyMemories: true,
      animations: true,
      haptics: true,
      setAccent: (accent) => {
        set({ accent });
        applyAccent(accent);
      },
      set: (patch) => set(patch),
    }),
    {
      name: "gamehub:prefs",
      onRehydrateStorage: () => (state) => {
        if (state) applyAccent(state.accent);
      },
    },
  ),
);

/** هل الاهتزاز مفعّل — تُقرأ خارج React أيضًا */
export const hapticsEnabled = () => usePrefs.getState().haptics;

/** يطبّق لون التمييز على متغيّرات CSS الجذرية عبر وسم style مخصّص (يتجنّب تعارض الترطيب) */
export function applyAccent(id: AccentId) {
  if (typeof document === "undefined") return;
  const a = ACCENTS.find((x) => x.id === id) ?? ACCENTS[0]!;
  const vars = [
    ["--primary", a.primary],
    ["--primary-foreground", a.foreground],
    ["--ring", a.primary],
    ["--sidebar-primary", a.primary],
    ["--sidebar-primary-foreground", a.foreground],
    ["--sidebar-ring", a.primary],
    ["--accent", a.primary2],
    ["--accent-foreground", a.foreground],
    ["--chart-1", a.primary],
    ["--chart-2", a.primary2],
    ["--gradient-primary", `linear-gradient(120deg, ${a.primary}, ${a.primary2})`],
    ["--gradient-accent", `linear-gradient(120deg, ${a.primary}, ${a.primary2})`],
    [
      "--gradient-hero",
      `linear-gradient(135deg, color-mix(in oklab, ${a.primary} 22%, transparent), color-mix(in oklab, ${a.primary2} 14%, transparent) 45%, oklch(0.13 0.006 70 / 0.9))`,
    ],
    ["--shadow-glow", `0 0 45px -12px color-mix(in oklab, ${a.primary} 50%, transparent)`],
  ];

  let tag = document.getElementById("gh-accent") as HTMLStyleElement | null;
  if (!tag) {
    tag = document.createElement("style");
    tag.id = "gh-accent";
    document.head.appendChild(tag);
  }
  tag.textContent = `:root{${vars.map(([k, v]) => `${k}:${v};`).join("")}}`;
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { ArrowRight, Flame, Trophy, Timer, Zap, Star, Lock } from "lucide-react";
import { useCurrentData } from "@/lib/store";
import { computeStats, computeAchievements } from "@/lib/stats";
import { computeProgress, computeStreak, REWARDS, RANKS } from "@/lib/progress";
import { SectionTitle } from "@/components/ui-bits";
import { UserAvatar } from "@/components/UserAvatar";
import { num } from "@/lib/dates";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/progress")({
  head: () => ({
    meta: [
      { title: "التقدّم والمستوى — GameHub" },
      { name: "description", content: "مستواك، رتبتك، نقاط الخبرة، سلسلة أيامك ومكافآتك القادمة." },
      { property: "og:title", content: "التقدّم والمستوى — GameHub" },
      { property: "og:description", content: "نظام المستويات والرتب والمكافآت في GameHub." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProgressPage,
});

function ProgressPage() {
  const data = useCurrentData();
  const p = computeProgress(data.entries);
  const streak = computeStreak(data.entries);
  const s = computeStats(data.entries);
  const achievements = computeAchievements(data.entries);
  const unlocked = achievements.filter((a) => a.unlocked);

  const grid = [
    { icon: Trophy, label: "ألعاب مختومة", value: num(s.completed) },
    { icon: Timer, label: "ساعات اللعب", value: num(s.hours, 1) },
    { icon: Zap, label: "نقاط الخبرة", value: num(p.xp) },
    { icon: Flame, label: "سلسلة الأيام", value: `${num(streak)} يوم` },
    {
      icon: Star,
      label: "إنجازات مفتوحة",
      value: `${num(unlocked.length)}/${num(achievements.length)}`,
    },
    {
      icon: Trophy,
      label: "بلاتينيوم",
      value: num(data.entries.filter((e) => e.fullCompletion).length),
    },
  ];

  return (
    <div className="space-y-8">
      <Link
        to="/profile"
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowRight className="size-4" />
        رجوع للملف الشخصي
      </Link>

      {/* بطاقة المستوى */}
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[2rem] border border-primary/30 bg-card p-6"
      >
        <div
          className="absolute inset-0 opacity-60"
          style={{ background: "var(--gradient-hero)" }}
        />
        <div className="relative flex flex-wrap items-center gap-5">
          <div className="relative">
            <UserAvatar value={data.profile.avatar} size={92} />
            <span className="absolute -bottom-1 -left-1 grid size-9 place-items-center rounded-full bg-[var(--gradient-primary)] font-display text-sm font-black text-primary-foreground ring-4 ring-card">
              {num(p.level)}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-display text-3xl font-black gold-glow">{p.rank.ar}</p>
            <p className="text-xs text-muted-foreground">
              {p.rank.en} · المستوى {num(p.level)} من {num(100)}
            </p>
            <div className="mt-4">
              <div className="mb-1 flex justify-between text-[11px] text-muted-foreground">
                <span>{num(p.xp)} XP</span>
                <span>
                  {p.max ? "أقصى مستوى" : `باقي ${num(p.toNext)} XP للمستوى ${num(p.level + 1)}`}
                </span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-secondary">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${p.pct}%` }}
                  transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                  className="h-full rounded-full bg-[var(--gradient-primary)]"
                />
              </div>
            </div>
          </div>
          {p.next && (
            <div className="rounded-2xl border border-border bg-secondary/40 p-4 text-center">
              <p className="text-[11px] text-muted-foreground">المكافأة القادمة</p>
              <p className="mt-1 text-2xl">{p.next.icon}</p>
              <p className="font-display text-sm font-bold">{p.next.label}</p>
              <p className="text-[11px] text-primary">عند المستوى {num(p.next.level)}</p>
            </div>
          )}
        </div>
      </motion.section>

      {/* الإحصائيات */}
      <section>
        <SectionTitle title="نظرة عامة" subtitle="مصادر نقاط الخبرة" />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {grid.map((g) => (
            <div key={g.label} className="rounded-2xl border border-border bg-card p-4 text-center">
              <g.icon className="mx-auto size-4 text-primary" />
              <p className="mt-1 font-display text-xl font-black gradient-text">{g.value}</p>
              <p className="text-[11px] text-muted-foreground">{g.label}</p>
            </div>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">
          الخبرة: ساعة لعب = 10 · جلسة = 15 · ختمة = 150+ حسب الصعوبة والطول · بلاتينيوم = 250
        </p>
      </section>

      {/* الرتب */}
      <section>
        <SectionTitle title="الرتب" subtitle="من لاعب جديد إلى أسطورة GameHub" />
        <div className="flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none]">
          {RANKS.map((r) => {
            const active = p.rank.min === r.min;
            const reached = p.level >= r.min;
            return (
              <div
                key={r.min}
                className={cn(
                  "min-w-[140px] shrink-0 rounded-2xl border p-3 text-center",
                  active
                    ? "border-primary/60 bg-primary/10"
                    : reached
                      ? "border-border bg-card"
                      : "border-border bg-card opacity-45",
                )}
              >
                <p className="font-display text-sm font-extrabold">{r.ar}</p>
                <p className="text-[11px] text-muted-foreground">المستوى {num(r.min)}+</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* المكافآت */}
      <section>
        <SectionTitle title="المكافآت" subtitle="تُفتح تلقائيًا مع كل مستوى" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {REWARDS.map((r) => {
            const open = p.level >= r.level;
            return (
              <div
                key={r.level}
                className={cn(
                  "flex items-center gap-3 rounded-2xl border p-4",
                  open ? "border-primary/40 bg-primary/5" : "border-border bg-card opacity-60",
                )}
              >
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-secondary/60 text-xl">
                  {open ? r.icon : <Lock className="size-4 text-muted-foreground" />}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-display text-sm font-bold">{r.label}</p>
                  <p className="text-[11px] text-muted-foreground">المستوى {num(r.level)}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* الإنجازات */}
      <section>
        <SectionTitle
          title="الإنجازات"
          subtitle={`${num(unlocked.length)} من ${num(achievements.length)} مفتوحة`}
        />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {achievements.map((a) => (
            <div
              key={a.id}
              className={cn(
                "rounded-2xl border p-4",
                a.unlocked ? "border-primary/40 bg-primary/5" : "border-border bg-card",
              )}
            >
              <div className="flex items-center gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-secondary/60 text-lg">
                  {a.icon}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-display text-sm font-bold">{a.title}</p>
                  <p className="truncate text-[11px] text-muted-foreground">{a.desc}</p>
                </div>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${a.progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

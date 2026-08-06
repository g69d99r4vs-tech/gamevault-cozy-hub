import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "motion/react";
import { useCurrentData, useStore } from "@/lib/store";
import { computeStats, computeWrap, yearGrid, computeLevel } from "@/lib/stats";
import { SectionTitle, StatCard, EmptyState } from "@/components/ui-bits";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { gdate, num } from "@/lib/dates";
import { UserSwitcher } from "@/components/UserSwitcher";
import { AvatarPicker } from "@/components/AvatarPicker";
import { UserAvatar } from "@/components/UserAvatar";
import { CheckCircle2, Timer, Sun, CalendarDays } from "lucide-react";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "أنا — GameHub" },
      { name: "description", content: "شخصيتك، إحصائياتك، خريطة نشاطك ومقارنتك مع أخوك." },
      { property: "og:title", content: "أنا — GameHub" },
      { property: "og:description", content: "كل ما يخصك في مكان واحد." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MePage,
});

const heatColor = (h: number) => {
  if (!h) return "bg-secondary/60";
  if (h < 2) return "bg-primary/30";
  if (h < 4) return "bg-primary/55";
  if (h < 7) return "bg-primary/80";
  return "bg-primary";
};

function MePage() {
  const data = useCurrentData();
  const users = useStore((s) => s.users);
  const updateProfile = useStore((s) => s.updateProfile);
  const s = computeStats(data.entries);
  const { level, pct } = computeLevel(data.entries);

  const thisYear = new Date().getFullYear();
  const [year] = useState(thisYear);
  const w = computeWrap(data.entries, year);
  const weeks = yearGrid(year);

  const a = computeStats(users.faisal.entries);
  const b = computeStats(users.mishal.entries);

  const hallOfFame = [...data.entries]
    .filter((e) => e.personalRating > 0)
    .sort((x, y) => y.personalRating - x.personalRating)
    .slice(0, 10);

  return (
    <div className="space-y-8">
      <div className="lg:hidden">
        <UserSwitcher />
      </div>

      {/* البطاقة الشخصية */}
      <section className="relative overflow-hidden rounded-[2rem] border border-border bg-card p-6">
        <div className="absolute inset-0 opacity-50" style={{ background: "var(--gradient-hero)" }} />
        <div className="relative flex flex-wrap items-center gap-5">
          <AvatarPicker size={88} />
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-3xl font-black">{data.profile.name}</h1>
            <p className="text-sm text-muted-foreground">{data.profile.bio}</p>
            <div className="mt-3 max-w-xs">
              <div className="mb-1 flex justify-between text-[11px] text-muted-foreground">
                <span>المستوى {level}</span>
                <span>{num(pct)}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-secondary">
                <div className="h-full rounded-full bg-[var(--gradient-primary)]" style={{ width: `${pct}%` }} />
              </div>
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">اضغط على صورتك لاختيار شخصيتك</p>
          </div>
        </div>

        <div className="relative mt-6 grid gap-3 md:grid-cols-2">
          <div>
            <Label className="mb-1 block text-xs">النبذة</Label>
            <Textarea value={data.profile.bio} onChange={(e) => updateProfile({ bio: e.target.value })} />
          </div>
          <div className="grid gap-3">
            <div>
              <Label className="mb-1 block text-xs">اللعبة المفضلة</Label>
              <Input
                value={data.profile.favoriteGame}
                onChange={(e) => updateProfile({ favoriteGame: e.target.value })}
              />
            </div>
            <div>
              <Label className="mb-1 block text-xs">التصنيف المفضل</Label>
              <Input
                value={data.profile.favoriteGenre}
                onChange={(e) => updateProfile({ favoriteGenre: e.target.value })}
              />
            </div>
          </div>
        </div>
      </section>

      {/* الإحصائيات */}
      <section>
        <SectionTitle title="إحصائياتي" />
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <StatCard label="مكتملة" value={s.completed} icon={CheckCircle2} />
          <StatCard label="ساعات اللعب" value={s.hours} icon={Timer} index={1} />
          <StatCard label="متوسط اللعب اليومي" value={`${num(s.avgDailyHours, 1)} ساعة`} icon={Sun} index={2} />
          <StatCard
            label="متوسط التختيم شهريًا"
            value={`${num(s.avgMonthlyCompleted, 1)} لعبة`}
            icon={CalendarDays}
            index={3}
          />
        </div>
      </section>

      {/* خريطة النشاط */}
      <section>
        <SectionTitle title="خريطة النشاط" subtitle={`أيام لعبك خلال ${year}`} />
        <div className="overflow-x-auto rounded-3xl border border-border bg-card p-4">
          <div className="flex gap-[3px]" dir="ltr">
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-[3px]">
                {week.map((day, di) => (
                  <span
                    key={di}
                    title={day ? `${gdate(day.date)} · ${num(w.heat.get(day.date) ?? 0, 1)} ساعة` : ""}
                    className={`size-[11px] rounded-[3px] ${
                      day ? heatColor(w.heat.get(day.date) ?? 0) : "bg-transparent"
                    }`}
                  />
                ))}
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground" dir="ltr">
            <span>أقل</span>
            {["bg-secondary/60", "bg-primary/30", "bg-primary/55", "bg-primary/80", "bg-primary"].map((c) => (
              <span key={c} className={`size-[11px] rounded-[3px] ${c}`} />
            ))}
            <span>أكثر</span>
          </div>
        </div>
      </section>

      {/* المقارنة */}
      <section>
        <SectionTitle title="المقارنة" subtitle="فيصل ضد مشعل" />
        <div className="grid gap-3 md:grid-cols-2">
          {[
            { p: users.faisal.profile, st: a },
            { p: users.mishal.profile, st: b },
          ].map((u) => (
            <div key={u.p.name} className="rounded-3xl border border-border bg-card p-5">
              <div className="mb-4 flex items-center gap-3">
                <UserAvatar value={u.p.avatar} size={44} />
                <p className="font-display text-lg font-extrabold">{u.p.name}</p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  { l: "مكتملة", v: num(u.st.completed) },
                  { l: "ساعات", v: num(u.st.hours, 1) },
                  { l: "المكتبة", v: num(u.st.total) },
                  { l: "نسبة الإكمال", v: `${num(u.st.completionRate)}%` },
                ].map((x) => (
                  <div key={x.l} className="rounded-2xl bg-secondary/50 p-3 text-center">
                    <p className="font-display text-xl font-black gradient-text">{x.v}</p>
                    <p className="text-[11px] text-muted-foreground">{x.l}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* أفضل ألعابي */}
      <section>
        <SectionTitle title="أفضل 10 ألعاب" subtitle="مرتّبة حسب تقييمك الشخصي" />
        {hallOfFame.length ? (
          <div className="space-y-2">
            {hallOfFame.map((g, i) => (
              <motion.div
                key={g.id}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-center gap-4 rounded-2xl border border-border bg-card p-3"
              >
                <span className="font-display text-xl font-black text-primary">#{i + 1}</span>
                {g.image && (
                  <img src={g.image} alt={g.name} loading="lazy" className="size-14 rounded-xl object-cover" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold">{g.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {g.review || "بدون مراجعة"} · {num(g.hours)} ساعة
                  </p>
                </div>
                <span className="font-display font-bold text-primary">{g.personalRating}/10</span>
              </motion.div>
            ))}
          </div>
        ) : (
          <EmptyState text="قيّم ألعابك لتظهر هنا." />
        )}
      </section>
    </div>
  );
}

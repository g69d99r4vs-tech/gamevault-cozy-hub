import { UserAvatar } from "@/components/UserAvatar";
import { createFileRoute } from "@tanstack/react-router";
import { useStore, useCurrentData } from "@/lib/store";
import { computeStats } from "@/lib/stats";
import { SectionTitle, StatCard } from "@/components/ui-bits";
import { num } from "@/lib/dates";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CheckCircle2, Timer, CalendarDays, Sun, Percent, Flame, Crown } from "lucide-react";
import { difficultyLabel } from "@/lib/store";
import { TugOfWar } from "@/components/TugOfWar";

export const Route = createFileRoute("/stats")({
  head: () => ({
    meta: [
      { title: "الإحصائيات — GameHub" },
      {
        name: "description",
        content: "أرقام نظيفة: متوسط اللعب اليومي، معدل التختيم الشهري، ومقارنة بين فيصل ومشعل.",
      },
      { property: "og:title", content: "الإحصائيات — GameHub" },
      { property: "og:description", content: "تحليلات مبسّطة لحياتك في الألعاب مع مقارنة مباشرة." },
    ],
  }),
  component: StatsPage,
});

function StatsPage() {
  const data = useCurrentData();
  const users = useStore((s) => s.users);
  const s = computeStats(data.entries);

  const a = computeStats(users.faisal.entries);
  const b = computeStats(users.mishal.entries);

  const chart = [
    { name: "المكتملة", فيصل: a.completed, مشعل: b.completed },
    { name: "ساعات اللعب", فيصل: Number(a.hours.toFixed(1)), مشعل: Number(b.hours.toFixed(1)) },
    { name: "حجم المكتبة", فيصل: a.total, مشعل: b.total },
    {
      name: "نسبة الإكمال",
      فيصل: Number(a.completionRate.toFixed(1)),
      مشعل: Number(b.completionRate.toFixed(1)),
    },
  ];

  return (
    <div className="space-y-8">
      <SectionTitle title="الإحصائيات" subtitle="أهم الأرقام فقط" />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard label="مكتملة" value={s.completed} icon={CheckCircle2} />
        <StatCard label="ساعات اللعب" value={s.hours} icon={Timer} index={1} />
        <StatCard
          label="متوسط اللعب اليومي"
          value={`${num(s.avgDailyHours, 1)} ساعة`}
          icon={Sun}
          index={2}
        />
        <StatCard
          label="متوسط التختيم شهريًا"
          value={`${num(s.avgMonthlyCompleted, 1)} لعبة`}
          icon={CalendarDays}
          index={3}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <StatCard
          label="معدل الإنجاز"
          value={`${num(s.completionRate, 1)}%`}
          icon={Percent}
          hint="نسبة الألعاب المختومة من مكتبتك"
        />
        <StatCard
          label="أصعب لعبة ختمتها"
          value={
            s.hardest
              ? `${s.hardest.name} · ${difficultyLabel(s.hardest.difficulty ?? "normal")}`
              : "—"
          }
          icon={Flame}
          index={1}
          hint="حسب مستوى الصعوبة الذي سجّلته"
        />
      </div>

      <div className="rounded-3xl border border-border bg-card p-4">
        <h3 className="mb-3 font-display text-sm font-bold">الألعاب المكتملة شهريًا</h3>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={s.monthly}>
            <defs>
              <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.7} />
                <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="month" stroke="var(--color-muted-foreground)" fontSize={11} />
            <YAxis stroke="var(--color-muted-foreground)" fontSize={11} allowDecimals={false} />
            <Tooltip
              contentStyle={{
                background: "var(--color-popover)",
                border: "1px solid var(--color-border)",
                borderRadius: 12,
              }}
            />
            <Area
              type="monotone"
              dataKey="games"
              stroke="var(--color-chart-1)"
              fill="url(#g1)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <InfoTile
          label="أطول لعبة"
          value={s.longest ? `${s.longest.name} · ${num(s.longest.hours)} ساعة` : "—"}
        />
        <InfoTile label="أنشط شهر" value={s.mostActiveMonth} />
      </div>

      <section className="space-y-4 border-t border-border pt-8">
        <SectionTitle title="المقارنة" subtitle="فيصل ضد مشعل — مباشرة من السحابة" />

        <div className="grid gap-3 md:grid-cols-2">
          {[
            { p: users.faisal.profile, st: a, wins: a.hours > b.hours },
            { p: users.mishal.profile, st: b, wins: b.hours > a.hours },
          ].map((u) => (
            <div key={u.p.name} className="rounded-3xl border border-border bg-card p-5">
              <div className="flex items-center gap-3">
                <UserAvatar value={u.p.avatar} size={48} />
                <div className="min-w-0">
                  <h3 className="flex items-center gap-1 font-display text-lg font-extrabold">
                    <bdi>{u.p.name}</bdi>
                    {u.wins && <Crown className="size-4 text-primary" />}
                  </h3>
                  <p className="truncate text-xs text-muted-foreground">{u.p.bio}</p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                <Cell label="مكتملة" value={num(u.st.completed)} />
                <Cell label="ساعات" value={num(u.st.hours, 1)} />
                <Cell label="لعبناها سوا" value={num(u.st.coop)} />
                <Cell label="نسبة الإكمال" value={`${num(u.st.completionRate)}%`} />
              </div>
            </div>
          ))}
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <TugOfWar
            label="ساعات اللعب"
            leftName={users.faisal.profile.name}
            rightName={users.mishal.profile.name}
            left={Number(a.hours.toFixed(1))}
            right={Number(b.hours.toFixed(1))}
            format={(v) => `${num(v, 1)} ساعة`}
          />
          <TugOfWar
            label="الألعاب المكتملة"
            leftName={users.faisal.profile.name}
            rightName={users.mishal.profile.name}
            left={a.completed}
            right={b.completed}
            format={(v) => num(v)}
          />
          <TugOfWar
            label="نسبة الإكمال"
            leftName={users.faisal.profile.name}
            rightName={users.mishal.profile.name}
            left={Number(a.completionRate.toFixed(1))}
            right={Number(b.completionRate.toFixed(1))}
            format={(v) => `${num(v, 1)}%`}
          />
          <TugOfWar
            label="حجم المكتبة"
            leftName={users.faisal.profile.name}
            rightName={users.mishal.profile.name}
            left={a.total}
            right={b.total}
            format={(v) => num(v)}
          />
        </div>

        <div className="rounded-3xl border border-border bg-card p-4">
          <h3 className="mb-3 font-display text-sm font-bold">مقارنة الأرقام</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chart}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="name" stroke="var(--color-muted-foreground)" fontSize={10} />
              <YAxis stroke="var(--color-muted-foreground)" fontSize={11} />
              <Tooltip
                contentStyle={{
                  background: "var(--color-popover)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 12,
                }}
              />
              <Legend />
              <Bar dataKey="فيصل" fill="var(--color-chart-1)" radius={[8, 8, 0, 0]} />
              <Bar dataKey="مشعل" fill="var(--color-chart-2)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="mt-1 truncate font-display font-bold">{value}</p>
    </div>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-secondary/50 p-3">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="truncate font-bold">{value}</p>
    </div>
  );
}

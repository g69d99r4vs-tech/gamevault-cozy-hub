import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  Crown,
  Sparkles,
  Timer,
  PlayCircle,
  Activity as ActivityIcon,
  Trophy,
  Zap,
  Clock,
  Plus,
  Swords,
} from "lucide-react";
import { useCurrentData, useOtherData, useStore, type GameEntry } from "@/lib/store";
import { activityIcon, gameOfMonth, memoryBox, computeStats, computeLevel } from "@/lib/stats";
import { gdate, num } from "@/lib/dates";
import { SectionTitle } from "@/components/ui-bits";
import { LogSessionSheet } from "@/components/GameEditDialog";
import { CelebrationModal } from "@/components/CelebrationModal";
import { UserAvatar } from "@/components/UserAvatar";
import { Button } from "@/components/ui/button";
import { useEffect, useMemo, useState } from "react";
import heroFallback from "@/assets/hero-fallback.jpg";


export const Route = createFileRoute("/home")({
  head: () => ({
    meta: [
      { title: "الرئيسية — GameHub" },
      {
        name: "description",
        content: "مواصلة اللعب، تحدي الأسبوع، نبض الألعاب، لعبة الشهر وصندوق الذكريات.",
      },
      { property: "og:title", content: "الرئيسية — GameHub" },
      { property: "og:description", content: "قلب GameHub الاجتماعي والتفاعلي." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

const QUOTES = [
  "«اللي ما يبدأ اليوم، يبدأ بكرة… وبكرة تصير سنة!»",
  "«كل لعبة مختومة قصة تنضاف لسجلك 🎮»",
  "«الختم مو سباق… بس حلو تسبق أخوك 😏»",
  "«جلسة وحدة اليوم أفضل من خطة كاملة بكرة»",
];

/** دقائق اللعب خلال آخر 7 أيام */
const weekMinutes = (entries: { legacy?: boolean; sessions: { date: string; minutes: number }[] }[]) => {
  const from = new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10);
  return entries
    .filter((e) => !e.legacy)
    .flatMap((e) => e.sessions)
    .filter((s) => (s.date ?? "") >= from)
    .reduce((sum, s) => sum + s.minutes, 0);
};

function Dashboard() {
  const data = useCurrentData();
  const other = useOtherData();
  const users = useStore((s) => s.users);
  const currentUser = useStore((s) => s.currentUser);
  const updateGame = useStore((s) => s.updateGame);


  const hero = data.entries.find((e) => e.status === "current") ?? null;
  const [reviewed, setReviewed] = useState<GameEntry | null>(null);

  const gotm = gameOfMonth(data.entries);
  const memories = memoryBox(data.entries);
  const stats = computeStats(data.entries);
  const { level } = computeLevel(data.entries);

  const monthHours = useMemo(() => {
    const key = new Date().toISOString().slice(0, 7);
    const mins = data.entries
      .filter((e) => !e.legacy)
      .flatMap((e) => e.sessions)
      .filter((s) => s.date?.startsWith(key))
      .reduce((sum, s) => sum + s.minutes, 0);
    return Math.round((mins / 60) * 10) / 10;
  }, [data.entries]);

  /** تحدي الأسبوع بين الأخوين */
  const showdown = useMemo(() => {
    const mine = weekMinutes(data.entries) / 60;
    const theirs = weekMinutes(other.entries) / 60;
    const total = mine + theirs;
    return {
      mine: Math.round(mine * 10) / 10,
      theirs: Math.round(theirs * 10) / 10,
      pct: total > 0 ? Math.round((mine / total) * 100) : 50,
      total,
    };
  }, [data.entries, other.entries]);

  const pulse = useMemo(() => {
    const tag = (uid: "faisal" | "mishal") =>
      users[uid].activities.map((a) => ({
        ...a,
        who: users[uid].profile.name,
        avatar: users[uid].profile.avatar,
      }));
    return [...tag("faisal"), ...tag("mishal")].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 12);
  }, [users]);

  const suggestion = useMemo(() => {
    const pool = data.entries.filter((e) => e.status === "backlog");
    if (!pool.length) return null;
    const seed = new Date().getDate() + currentUser.length;
    return pool[seed % pool.length]!;
  }, [data.entries, currentUser]);


  const [quoteIdx, setQuoteIdx] = useState(0);
  useEffect(() => setQuoteIdx(new Date().getDate() % QUOTES.length), []);
  const quote = QUOTES[quoteIdx]!;
  /** بانر سينمائي: صورة اللعبة الحالية، وإلا كولاج من المقترحات، وإلا صورة احتياطية */
  const bannerImages = useMemo(() => {
    if (hero?.image) return [hero.image];
    const pool = data.entries.map((e) => e.image).filter((x): x is string => !!x);
    return pool.slice(0, 3).length === 3 ? pool.slice(0, 3) : pool.slice(0, 1);
  }, [hero, data.entries]);
  const quick = [
    { icon: Trophy, label: "مكتملة", value: num(stats.completed) },
    { icon: Zap, label: "المستوى", value: num(level) },
    { icon: Clock, label: "ساعات الشهر", value: num(monthHours, 1) },
  ];

  return (
    <div className="space-y-5">
      {/* الترحيب + شريط الإحصائيات */}
      <section className="space-y-3">
        <div className="flex items-center gap-3">
          <Link to="/profile">
            <UserAvatar value={data.profile.avatar} size={48} />
          </Link>
          <div className="min-w-0">
            <h1 className="truncate font-display text-2xl font-black">مرحباً {data.profile.name}</h1>
            <p className="text-[11px] text-muted-foreground">
              المستوى {num(level)} · {num(stats.hours, 1)} ساعة إجمالاً
            </p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 rounded-3xl border border-border bg-card p-2">
          {quick.map((q) => (
            <div key={q.label} className="rounded-2xl bg-secondary/40 px-2 py-3 text-center">
              <q.icon className="mx-auto size-4 text-primary" />
              <p className="mt-1 font-display text-lg font-black gradient-text">{q.value}</p>
              <p className="text-[10px] text-muted-foreground">{q.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* A — مواصلة اللعب */}
      <motion.section
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-[2rem] border-2 border-primary/30 shadow-[0_0_35px_-18px_color-mix(in_oklab,var(--primary)_70%,transparent)]"
      >
        {bannerImages.length > 1 ? (
          <div className="absolute inset-0 grid grid-cols-3">
            {bannerImages.map((src, i) => (
              <img
                key={`${src}-${i}`}
                src={src}
                alt=""
                aria-hidden
                className="size-full object-cover opacity-60"
              />
            ))}
          </div>
        ) : (
          <img
            src={bannerImages[0] ?? heroFallback}
            alt={hero?.name ?? "خلفية ألعاب"}
            className="absolute inset-0 size-full scale-105 object-cover opacity-60"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/85 to-background/40" />
        <div className="relative flex min-h-44 flex-col justify-end gap-3 p-5">
          {hero ? (
            <>
              <p className="text-xs text-muted-foreground">مواصلة اللعب</p>
              <Link to="/game/$id" params={{ id: String(hero.id) }}>
                <h2 className="font-display text-2xl font-black md:text-4xl">{hero.name}</h2>
              </Link>
              <p className="text-xs text-primary">{num(hero.hours, 1)} ساعة حتى الآن</p>
              <LogSessionSheet
                entry={hero}
                trigger={
                  <Button className="h-12 w-fit rounded-2xl border-2 border-primary/70 bg-primary px-6 font-display text-base font-black text-primary-foreground shadow-[0_0_35px_-4px_color-mix(in_oklab,var(--primary)_70%,transparent)] hover:bg-primary/90">

                    <PlayCircle className="size-4" /> تسجيل جلسة
                  </Button>
                }
              />
            </>
          ) : (
            <>
              <p className="text-xs text-muted-foreground">ما فيه لعبة قيد اللعب</p>
              <h2 className="font-display text-2xl font-black md:text-3xl">ابدأ رحلتك الجديدة اليوم</h2>
              <p className="text-xs text-muted-foreground">{quote}</p>
              <Link to="/upcoming" search={{ tab: "toBeat" as const }}>
                <Button className="h-12 w-fit rounded-2xl border border-primary/70 bg-primary px-6 font-display text-base font-black text-primary-foreground shadow-[0_0_30px_-6px_color-mix(in_oklab,var(--primary)_70%,transparent)] transition-transform hover:scale-[1.03] hover:bg-primary/90 active:scale-[0.97]">
                  <Plus className="size-4" /> اختر لعبة من الخطة
                </Button>
              </Link>

            </>
          )}
        </div>
      </motion.section>

      {/* صفوف سينمائية أفقية */}
      <CelebrationModal game={reviewed} review onClose={() => setReviewed(null)} />


      {/* B — تحدي الأسبوع */}
      <section>
        <SectionTitle title="تحدي الأسبوع" subtitle="ساعات اللعب خلال آخر ٧ أيام" />
        <div className="rounded-[2rem] border-2 border-primary/40 bg-card p-5 shadow-[0_0_30px_-16px_color-mix(in_oklab,var(--primary)_70%,transparent)]">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <UserAvatar value={data.profile.avatar} size={38} />
              <div>
                <p className="text-xs font-bold">{data.profile.name}</p>
                <p className="font-display text-lg font-black gradient-text">
                  {num(showdown.mine, 1)} س
                </p>
              </div>
            </div>
            <Swords className="size-6 gold-glow" />
            <div className="flex items-center gap-2">
              <div className="text-left">
                <p className="text-xs font-bold">{other.profile.name}</p>
                <p className="font-display text-lg font-black gradient-text">
                  {num(showdown.theirs, 1)} س
                </p>
              </div>
              <UserAvatar value={other.profile.avatar} size={38} />
            </div>
          </div>
          <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-secondary" dir="ltr">
            <div
              className="h-full rounded-full bg-[var(--gradient-primary)] transition-all"
              style={{ width: `${showdown.pct}%` }}
            />
          </div>
          <p className="mt-2 text-center text-[11px] text-muted-foreground">
            {showdown.total === 0
              ? "ما سجّل أحد جلسة هالأسبوع… كن أنت البادئ!"
              : showdown.mine > showdown.theirs
                ? `أنت متقدم على ${other.profile.name} 🔥`
                : showdown.mine < showdown.theirs
                  ? `${other.profile.name} متقدم عليك… الحقه!`
                  : "تعادل! الجولة القادمة تحسم"}
          </p>
        </div>
      </section>

      {/* D — لعبة الشهر */}
      <section>
        <SectionTitle title="لعبة الشهر" />
        {gotm ? (
          <Link
            to="/game/$id"
            params={{ id: String(gotm.game.id) }}
            className="relative block overflow-hidden rounded-[2rem] border-2 border-primary/60 shadow-[0_0_25px_-8px_color-mix(in_oklab,var(--primary)_70%,transparent)]"
          >
            {gotm.game.image && (
              <img
                src={gotm.game.image}
                alt={gotm.game.name}
                loading="lazy"
                className="absolute inset-0 size-full object-cover opacity-55"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
            <div className="relative flex min-h-32 items-end gap-4 p-5">
              <Crown className="size-8 gold-glow" />
              <div className="min-w-0">
                <h3 className="truncate font-display text-xl font-extrabold">{gotm.game.name}</h3>
                <p className="text-xs text-primary">{num(gotm.hours, 1)} ساعة هذا الشهر</p>
              </div>
            </div>
          </Link>
        ) : (
          <div className="rounded-[2rem] border border-dashed border-border p-5 text-center text-xs text-muted-foreground">
            سجّل جلسات هذا الشهر لتظهر لعبة الشهر.
          </div>
        )}
      </section>

      {/* E — صندوق الذكريات */}
      <section>
        <SectionTitle title="صندوق الذكريات" />
        <div className="space-y-2 rounded-[2rem] border border-border bg-card p-3">
          {memories.length ? (
            memories.map((m) => (
              <Link
                key={m.text}
                to="/game/$id"
                params={{ id: String(m.game.id) }}
                className="block rounded-2xl bg-secondary/50 px-4 py-3 text-sm surface-hover"
              >
                {m.text}
              </Link>
            ))
          ) : (
            <p className="p-3 text-center text-xs text-muted-foreground">
              ذكرياتك تُبنى الآن… {quote}
            </p>
          )}
        </div>
      </section>

      {/* F — اقتراح اليوم */}
      <section>
        <SectionTitle title="اقتراح اليوم" />
        {suggestion ? (
          <Link
            to="/game/$id"
            params={{ id: String(suggestion.id) }}
            className="relative block overflow-hidden rounded-[2rem] border border-border"
          >
            {suggestion.image && (
              <img
                src={suggestion.image}
                alt={suggestion.name}
                loading="lazy"
                className="absolute inset-0 size-full object-cover opacity-50"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/85 to-background/40" />
            <div className="relative flex min-h-28 flex-col justify-end p-5">
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                <Sparkles className="size-3.5 gold-glow" /> ليش ما تلعب هذي اليوم؟
              </p>
              <p className="font-display text-xl font-extrabold">{suggestion.name}</p>
              <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                <Timer className="size-3.5" /> من قائمة «ناوي أختمها»
              </p>
            </div>
          </Link>
        ) : (
          <div className="rounded-[2rem] border border-dashed border-border p-5 text-center text-xs text-muted-foreground">
            أضف ألعابًا إلى «ناوي أختمها» ليقترح عليك.
          </div>
        )}
      </section>

      {/* C — نبض الألعاب */}
      <section>
        <SectionTitle
          title="نبض الألعاب"
          subtitle="آخر نشاطاتكم"
          action={
            <Link to="/timeline" className="text-xs text-primary">
              الكل
            </Link>
          }
        />
        <div className="max-h-72 space-y-2 overflow-y-auto rounded-3xl border border-border bg-card p-3">
          {pulse.length ? (
            pulse.map((a) => (
              <div key={a.id} className="flex items-start gap-3 rounded-2xl bg-secondary/30 p-3 text-sm">
                <UserAvatar value={a.avatar} size={34} framed={false} />
                <div className="min-w-0 flex-1">
                  <p className="truncate">
                    {activityIcon(a.type)} <span className="font-bold">{a.who}</span> {a.text}
                  </p>
                  <p className="text-[11px] text-muted-foreground">{gdate(a.at)}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl bg-secondary/40 p-5 text-center">
              <ActivityIcon className="mx-auto size-5 text-primary" />
              <p className="mt-2 text-sm font-bold">التحدي يبدأ هنا..</p>
              <p className="mt-1 text-xs text-muted-foreground">{quote}</p>
              <Link to="/library">
                <Button size="sm" variant="secondary" className="mt-3 rounded-xl">
                  <Plus className="size-3.5" /> أضف لعبة
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      <Link
        to="/profile"
        className="flex items-center gap-3 rounded-3xl border border-border bg-card px-5 py-4 surface-hover"
      >
        <UserAvatar value={other.profile.avatar} size={40} framed={false} />
        <p className="flex-1 text-sm text-muted-foreground">
          شاهد إحصائياتك وقارن نفسك مع {other.profile.name}
        </p>
      </Link>

    </div>
  );
}

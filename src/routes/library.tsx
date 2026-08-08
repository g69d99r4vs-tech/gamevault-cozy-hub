import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useCurrentData, type GameEntry, type Status } from "@/lib/store";

import { GameEditDialog } from "@/components/GameEditDialog";
import { CelebrationModal } from "@/components/CelebrationModal";
import { EmptyState, SectionTitle } from "@/components/ui-bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Star } from "lucide-react";
import { num } from "@/lib/dates";
import { completionSummary } from "@/lib/completion";
import { GameCard } from "@/components/GameCard";

/** بطاقة سينمائية عريضة بعرض الشاشة للعبة مختومة — خزانة الجوائز */
function CompletedCard({ entry, onOpen }: { entry: GameEntry; onOpen: () => void }) {
  const s = completionSummary(entry);
  return (
    <button
      onClick={onOpen}
      className="group relative block w-full overflow-hidden rounded-3xl border border-primary/25 bg-card text-right shadow-[0_0_40px_-24px_color-mix(in_oklab,var(--primary)_70%,transparent)] surface-hover"
    >
      <div className="relative aspect-[16/7] w-full overflow-hidden sm:aspect-[21/7]">
        {entry.image ? (
          <img
            src={entry.image}
            alt={entry.name}
            loading="lazy"
            className="size-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="size-full bg-secondary" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-l from-background/70 via-transparent to-transparent" />

        <span className="absolute right-4 top-4 rounded-full border border-primary/40 bg-background/70 px-3 py-1 text-[11px] font-bold backdrop-blur">
          {s.badge.emoji} {s.badge.label}
        </span>

        <div className="absolute inset-x-4 bottom-4 space-y-2">
          <h3 className="font-display text-base font-black leading-tight sm:text-xl">
            <bdi>{entry.name}</bdi>
          </h3>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1 text-accent">
              <Star className="size-3.5 fill-current" />
              {entry.personalRating ? `${num(entry.personalRating, 1)}/10` : "قيد التقييم"}
            </span>
            <span>{num(s.hours, 1)} ساعة</span>
            <span>خلال {num(s.days ?? 1)} يوم</span>
            {entry.fullCompletion && <span>🏆 100%</span>}
          </div>
        </div>
      </div>
    </button>
  );
}




export const Route = createFileRoute("/library")({
  head: () => ({
    meta: [
      { title: "المكتبة — GameHub" },
      {
        name: "description",
        content: "كل ألعابك: قيد اللعب، المكتملة، الانتظار والسلاسل.",
      },
      { property: "og:title", content: "المكتبة — GameHub" },
      { property: "og:description", content: "إدارة كاملة لمكتبة ألعابك مع «ناوي أختمها» والسلاسل." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LibraryPage,
});

const tabs: { v: Status | "all"; l: string }[] = [
  { v: "all", l: "الكل" },
  { v: "current", l: "قيد اللعب" },
  { v: "completed", l: "المكتملة" },
];


const sorts = [
  { v: "added", l: "الأحدث" },
  { v: "name", l: "الاسم" },
  { v: "rating", l: "التقييم" },
  { v: "hours", l: "الساعات" },
] as const;

function LibraryPage() {
  const data = useCurrentData();
  const [tab, setTab] = useState<(typeof tabs)[number]["v"]>("all");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<(typeof sorts)[number]["v"]>("added");
  const [celebrated, setCelebrated] = useState<GameEntry | null>(null);
  const [reviewed, setReviewed] = useState<GameEntry | null>(null);

  const list = useMemo(() => {
    let out = data.entries.filter((e) =>
      tab === "all" ? e.status !== "completed" : e.status === tab,
    );

    if (q.trim()) out = out.filter((e) => e.name.toLowerCase().includes(q.toLowerCase()));
    return [...out].sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "rating") return b.personalRating - a.personalRating;
      if (sort === "hours") return b.hours - a.hours;
      return b.addedAt.localeCompare(a.addedAt);
    });
  }, [data.entries, tab, q, sort]);

  return (
    <div className="space-y-6">
      <CelebrationModal game={celebrated} onClose={() => setCelebrated(null)} />
      <CelebrationModal game={reviewed} review onClose={() => setReviewed(null)} />
      <div className="space-y-6">
        <SectionTitle title="المكتبة" subtitle={`${num(list.length)} لعبة`} />

        <div className="flex flex-wrap items-center gap-2">
          {tabs.map((t) => (
            <Button
              key={t.v}
              size="sm"
              variant={tab === t.v ? "default" : "secondary"}
              className="rounded-xl"
              onClick={() => setTab(t.v)}
            >
              {t.l}
            </Button>
          ))}
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="بحث داخل المكتبة"
            className="h-9 w-44 rounded-xl"
          />
          <div className="flex gap-1">
            {sorts.map((s) => (
              <Button
                key={s.v}
                size="sm"
                variant={sort === s.v ? "default" : "ghost"}
                className="rounded-xl text-xs"
                onClick={() => setSort(s.v)}
              >
                {s.l}
              </Button>
            ))}
          </div>
        </div>

        {!list.length ? (
          <EmptyState text="لا توجد ألعاب هنا بعد." />
        ) : tab === "completed" ? (
          <div className="flex w-full flex-col gap-4">
            {list.map((e) => (
              <div key={e.id} className="relative w-full">

                <CompletedCard entry={e} onOpen={() => setReviewed(e)} />
                <GameEditDialog
                  entry={e}
                  onCompleted={(done) => setCelebrated(done)}
                  trigger={
                    <Button
                      size="icon"
                      variant="secondary"
                      className="absolute left-3 top-3 size-9 rounded-full"
                    >
                      <Pencil className="size-4" />
                    </Button>
                  }
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
            {list.map((e, i) => (
              <GameCard key={e.id} entry={e} index={i} />
            ))}
          </div>
        )}

      </div>
    </div>
  );
}

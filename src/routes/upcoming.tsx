import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useCurrentData, useStore, type GameEntry } from "@/lib/store";
import { SectionTitle, EmptyState } from "@/components/ui-bits";
import { Countdown } from "@/components/Countdown";
import { gdate, num } from "@/lib/dates";
import { Button } from "@/components/ui/button";
import { buzz } from "@/lib/haptics";
import { SmartImage } from "@/components/SmartImage";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import { Trash2, ChevronDown, ChevronUp, GripVertical, Star, Dices, Pencil } from "lucide-react";
import { DateEditDialog } from "@/components/DateEditDialog";

export const Route = createFileRoute("/upcoming")({
  validateSearch: (search: Record<string, unknown>) => ({
    tab: search['tab'] === "toBeat" ? ("toBeat" as const) : ("releases" as const),
  }),
  head: () => ({
    meta: [
      { title: "الخطة — GameHub" },
      {
        name: "description",
        content: "إصدارات مرتقبة بعدّاد تنازلي حيّ، وقائمة «ناوي أختمها» بترتيبك الخاص.",
      },
      { property: "og:title", content: "الخطة — GameHub" },
      { property: "og:description", content: "خطتك القادمة: الإصدارات المرتقبة والألعاب التي تنوي ختمها." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PlanPage,
});

const topTabs = [
  { v: "releases", l: "إصدارات مرتقبة" },
  { v: "toBeat", l: "ناوي أختمها" },
] as const;

function PlanPage() {
  const { tab: initialTab } = Route.useSearch();
  const data = useCurrentData();
  const removeGame = useStore((s) => s.removeGame);
  const reorderQueue = useStore((s) => s.reorderQueue);
  const [tab, setTab] = useState<(typeof topTabs)[number]["v"]>(initialTab);
  const [dragId, setDragId] = useState<number | null>(null);
  const [picked, setPicked] = useState<GameEntry | null>(null);
  const [editing, setEditing] = useState<GameEntry | null>(null);


  const releases = [...data.entries]
    .filter((e) => e.status === "hype")
    .sort((a, b) => (a.released ?? "9999").localeCompare(b.released ?? "9999"));

  const toBeat = [...data.entries]
    .filter((e) => e.status === "backlog")
    .sort(
      (a, b) => (a.queuePosition || 999) - (b.queuePosition || 999) || a.name.localeCompare(b.name),
    );

  const pickRandom = () => {
    const pool = data.entries.filter((e) => e.status === "backlog");
    if (!pool.length) {
      toast("قائمة «ناوي أختمها» فاضية — أضف ألعاب أولاً");
      return;
    }
    buzz(40);
    setPicked(pool[Math.floor(Math.random() * pool.length)]!);
  };

  const move = (from: number, to: number) => {
    if (to < 0 || to >= toBeat.length || from === to || from < 0) return;
    const ids = toBeat.map((e) => e.id);
    const [moved] = ids.splice(from, 1);
    ids.splice(to, 0, moved!);
    buzz(20);
    reorderQueue(ids);
  };

  return (
    <div className="space-y-5">
      <SectionTitle title="الخطة" subtitle="ما ينتظرك قريبًا، وما نويت تختمه بعد لعبتك الحالية" />

      <button
        type="button"
        onClick={pickRandom}
        className="group flex w-full items-center gap-4 overflow-hidden rounded-[1.75rem] border-2 border-primary/35 bg-card px-5 py-4 text-right shadow-[0_0_35px_-18px_color-mix(in_oklab,var(--primary)_70%,transparent)] transition-transform hover:scale-[1.01] active:scale-[0.99]"
      >
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary/12">
          <Dices className="size-6 gold-glow transition-transform duration-500 group-hover:rotate-180" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-display text-xl font-black">وش نلعب اليوم؟</span>
          <span className="block text-[11px] text-muted-foreground">
            اختيار عشوائي من قائمة «ناوي أختمها»
          </span>
        </span>
      </button>

      <div className="flex gap-2 rounded-2xl bg-secondary/50 p-1">
        {topTabs.map((t) => (
          <Button
            key={t.v}
            size="sm"
            variant={tab === t.v ? "default" : "ghost"}
            className="flex-1 rounded-xl"
            onClick={() => setTab(t.v)}
          >
            {t.l}
          </Button>
        ))}
      </div>

      {tab === "releases" ? (
        releases.length ? (
          <div className="space-y-4">
            {releases.map((g, i) => (
              <motion.article
                key={g.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.06, 0.4) }}
                className="overflow-hidden rounded-[1.75rem] border border-border bg-card"
              >
                {/* الغلاف بنسبة عرضية ثابتة — بلا أي تراكب على النص */}
                <Link
                  to="/game/$id"
                  params={{ id: String(g.id) }}
                  className="block aspect-[16/9] w-full overflow-hidden bg-secondary"
                >
                  <SmartImage
                    src={g.image}
                    name={g.name}
                    alt={g.name}
                    className="size-full object-cover"
                  />
                </Link>

                <div className="flex flex-col gap-3 p-4">
                  <div className="min-w-0">
                    <Link to="/game/$id" params={{ id: String(g.id) }}>
                      <h3 className="break-words font-display text-xl font-black leading-tight md:text-2xl">
                        {g.name}
                      </h3>
                    </Link>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {gdate(g.released, "غير معلن")}
                    </p>
                  </div>

                  <Countdown target={g.released} />

                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="w-fit rounded-xl"
                      onClick={() => {
                        buzz(20);
                        setEditing(g);
                      }}
                    >
                      <Pencil className="size-3.5" /> تعديل التاريخ
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="w-fit rounded-xl"
                      onClick={() => {
                        buzz(30);
                        removeGame(g.id);
                        toast("أُزيلت من المرتقبة");
                      }}
                    >
                      <Trash2 className="size-3.5" /> إزالة
                    </Button>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        ) : (
          <EmptyState text="لا توجد إصدارات مرتقبة — ابحث عن لعبة وأضفها إلى «المرتقبة»." />
        )
      ) : toBeat.length ? (
        <div className="space-y-3">
          {toBeat.length > 1 && (
            <p className="rounded-2xl bg-secondary/50 px-4 py-3 text-xs text-muted-foreground">
              ⠿ اسحب البطاقات لترتيب أولوياتك — أو استخدم الأسهم على الجوال. الترتيب يُحفظ ويُزامن
              تلقائيًا.
            </p>
          )}

          {toBeat.map((e, i) => (
            <motion.div
              key={e.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.04, 0.35) }}
              draggable
              onDragStart={() => setDragId(e.id)}
              onDragOver={(ev) => ev.preventDefault()}
              onDrop={() => {
                if (dragId === null) return;
                move(
                  toBeat.findIndex((x) => x.id === dragId),
                  i,
                );
                setDragId(null);
              }}
              className="flex w-full items-start gap-3 rounded-3xl border border-border bg-card p-4 surface-hover"
            >
              <span className="mt-1 grid size-10 shrink-0 cursor-grab place-items-center rounded-xl bg-secondary text-sm font-black text-primary">
                {i + 1}
              </span>

              <Link
                to="/game/$id"
                params={{ id: String(e.id) }}
                className="flex min-w-0 flex-1 items-start gap-4"
              >
                <SmartImage
                  src={e.image}
                  name={e.name}
                  alt={e.name}
                  className="h-24 w-20 shrink-0 rounded-2xl object-cover"
                />
                <div className="min-w-0 flex-1 space-y-1.5 py-0.5">
                  <p className="line-clamp-2 whitespace-normal break-words font-display text-base font-black leading-snug">
                    <bdi>{e.name}</bdi>
                  </p>
                  <p className="whitespace-normal text-xs leading-relaxed text-muted-foreground">
                    {e.genres[0] ?? "لعبة"}
                    {e.playtimeEstimate ? ` · ~${num(e.playtimeEstimate)} ساعة` : ""}
                    {e.metacritic ? ` · ميتاكريتك ${e.metacritic}` : ""}
                  </p>
                  {e.rating > 0 && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Star className="size-3.5 text-primary" />
                      {num(e.rating, 1)}
                    </span>
                  )}
                </div>
              </Link>


              <div className="flex shrink-0 flex-col gap-1">
                <Button
                  size="icon"
                  variant="secondary"
                  className="size-7 rounded-full"
                  aria-label="أعلى"
                  onClick={() => move(i, i - 1)}
                >
                  <ChevronUp className="size-4" />
                </Button>
                <Button
                  size="icon"
                  variant="secondary"
                  className="size-7 rounded-full"
                  aria-label="أسفل"
                  onClick={() => move(i, i + 1)}
                >
                  <ChevronDown className="size-4" />
                </Button>
              </div>
              <GripVertical className="size-4 shrink-0 text-muted-foreground" />
            </motion.div>
          ))}
        </div>
      ) : (
        <EmptyState text="ما فيه ألعاب في «ناوي أختمها» — أضف لعبة واختر حالة «الانتظار»." />
      )}
    <AnimatePresence>
        {picked && (
          <motion.div
            dir="rtl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPicked(null)}
            className="fixed inset-0 z-[70] grid place-items-center bg-black/85 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94 }}
              transition={{ type: "spring", stiffness: 300, damping: 24 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm overflow-hidden rounded-3xl border border-primary/30 bg-card text-center shadow-2xl"
            >
              <p className="bg-primary/10 px-5 py-4 font-display text-xl font-black text-primary">
                وش نلعب اليوم؟
              </p>
              {picked.image && (
                <img src={picked.image} alt={picked.name} className="aspect-video w-full object-cover" />
              )}
              <div className="space-y-4 p-5">
                <h3 className="font-display text-2xl font-black">{picked.name}</h3>
                <Button
                  onClick={() => {
                    buzz(30);
                    setPicked(null);
                  }}
                  className="h-12 w-full rounded-2xl border border-primary/70 bg-primary font-display text-base font-black text-primary-foreground shadow-[0_0_30px_-6px_color-mix(in_oklab,var(--primary)_70%,transparent)] hover:bg-primary/90"
                >
                  يلا نلعب!
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <DateEditDialog game={editing} onClose={() => setEditing(null)} />
    </div>
  );
}

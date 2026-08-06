import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "motion/react";
import { useCurrentData } from "@/lib/store";
import { computeWrap, yearGrid } from "@/lib/stats";
import { gdate, num } from "@/lib/dates";
import { Button } from "@/components/ui/button";
import { SectionTitle } from "@/components/ui-bits";

export const Route = createFileRoute("/wrap")({
  head: () => ({
    meta: [
      { title: "ملخص السنة — GameHub" },
      {
        name: "description",
        content: "مراجعتك السنوية: أفضل لعبة، أكثر شهر لعبًا، خريطة نشاطك اليومية وإجمالي ساعاتك.",
      },
      { property: "og:title", content: "ملخص السنة — GameHub" },
      { property: "og:description", content: "سنتك في عالم الألعاب، بالأرقام." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: WrapPage,
});

const heatColor = (h: number) => {
  if (!h) return "bg-secondary/60";
  if (h < 2) return "bg-primary/30";
  if (h < 4) return "bg-primary/55";
  if (h < 7) return "bg-primary/80";
  return "bg-primary";
};

function WrapPage() {
  const data = useCurrentData();
  const thisYear = new Date().getFullYear();
  const [year, setYear] = useState(thisYear);
  const w = computeWrap(data.entries, year);
  const weeks = yearGrid(year);

  const cards = [
    { l: "ألعاب مكتملة", v: num(w.games) },
    { l: "ساعات اللعب", v: num(w.hours, 1) },
    { l: "بلاتينيوم", v: num(w.platinum) },
    { l: "أكثر شهر لعبًا", v: w.topMonth ? w.topMonth[0] : "—" },
    { l: "أفضل لعبة", v: w.best?.name ?? "—" },
    { l: "أقل لعبة تقييمًا", v: w.worst?.name ?? "—" },
    { l: "أكثر سلسلة", v: w.topFranchise?.name ?? "—" },
  ];

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-[2rem] border border-border p-8 text-center">
        <div className="absolute inset-0 opacity-70" style={{ background: "var(--gradient-hero)" }} />
        <div className="relative space-y-3">
          <h1 className="font-display text-4xl font-black md:text-6xl">
            مراجعة <span className="gradient-text">{year}</span>
          </h1>
          <p className="text-sm text-muted-foreground">سنتك في عالم الألعاب بالأرقام</p>
          <div className="flex justify-center gap-2 pt-2">
            {[thisYear - 2, thisYear - 1, thisYear].map((y) => (
              <Button
                key={y}
                size="sm"
                variant={y === year ? "default" : "secondary"}
                className="rounded-xl"
                onClick={() => setYear(y)}
              >
                {y}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {cards.map((c, i) => (
          <motion.div
            key={c.l}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-3xl border border-border bg-card p-4"
          >
            <p className="text-[11px] text-muted-foreground">{c.l}</p>
            <p className="mt-1 truncate font-display text-lg font-black">{c.v}</p>
          </motion.div>
        ))}
      </div>

      <div>
        <SectionTitle title="خريطة النشاط" subtitle="أكثر الأيام التي لعبت فيها خلال السنة" />
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
            {["bg-secondary/60", "bg-primary/30", "bg-primary/55", "bg-primary/80", "bg-primary"].map(
              (c) => (
                <span key={c} className={`size-[11px] rounded-[3px] ${c}`} />
              ),
            )}
            <span>أكثر</span>
          </div>
        </div>
      </div>

      {w.best && (
        <Link
          to="/game/$id"
          params={{ id: String(w.best.id) }}
          className="relative block overflow-hidden rounded-[2rem] border border-border p-6"
        >
          {w.best.image && (
            <img
              src={w.best.image}
              alt={w.best.name}
              loading="lazy"
              className="absolute inset-0 size-full object-cover opacity-30"
            />
          )}
          <div className="relative">
            <p className="text-xs text-muted-foreground">🏆 لعبة السنة عندك</p>
            <h3 className="font-display text-3xl font-black">{w.best.name}</h3>
            <p className="text-xs text-primary">
              {w.best.personalRating}/10 · {num(w.best.hours, 1)} ساعة
            </p>
          </div>
        </Link>
      )}
    </div>
  );
}

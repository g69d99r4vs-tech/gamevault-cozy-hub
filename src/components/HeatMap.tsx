import { useState } from "react";
import { gdate, num } from "@/lib/dates";

const heatColor = (h: number) => {
  if (!h) return "bg-secondary/60";
  if (h < 2) return "bg-primary/30";
  if (h < 4) return "bg-primary/55";
  if (h < 7) return "bg-primary/80";
  return "bg-primary";
};

export type HeatWeek = ({ date: string } | null)[];

/** خريطة نشاط تفاعلية — لمس أو تمرير يعرض تفاصيل اليوم */
export function HeatMap({ weeks, heat }: { weeks: HeatWeek[]; heat: Map<string, number> }) {
  const [active, setActive] = useState<{ date: string; hours: number } | null>(null);

  return (
    <div className="rounded-3xl border border-border bg-card p-4">
      <div className="mb-3 flex min-h-6 items-center">
        {active ? (
          <span className="rounded-full bg-primary/15 px-3 py-1 text-[11px] font-bold text-primary">
            لعبت {num(active.hours, 1)} ساعة · {gdate(active.date)}
          </span>
        ) : (
          <span className="text-[11px] text-muted-foreground">المس أي مربع لعرض تفاصيل اليوم</span>
        )}
      </div>
      <div className="overflow-x-auto">
        <div className="flex gap-[3px]" dir="ltr">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[3px]">
              {week.map((day, di) => {
                const hours = day ? (heat.get(day.date) ?? 0) : 0;
                const isActive = !!day && active?.date === day.date;
                return (
                  <button
                    key={di}
                    type="button"
                    disabled={!day}
                    onMouseEnter={() => day && setActive({ date: day.date, hours })}
                    onMouseLeave={() => setActive(null)}
                    onClick={() => day && setActive({ date: day.date, hours })}
                    aria-label={day ? `${day.date}` : "فارغ"}
                    className={`size-[11px] rounded-[3px] transition-transform ${
                      day ? heatColor(hours) : "bg-transparent"
                    } ${isActive ? "scale-150 ring-1 ring-primary" : ""}`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground" dir="ltr">
        <span>أقل</span>
        {["bg-secondary/60", "bg-primary/30", "bg-primary/55", "bg-primary/80", "bg-primary"].map((c) => (
          <span key={c} className={`size-[11px] rounded-[3px] ${c}`} />
        ))}
        <span>أكثر</span>
      </div>
    </div>
  );
}

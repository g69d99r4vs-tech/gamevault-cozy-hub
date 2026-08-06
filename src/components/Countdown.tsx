import { useEffect, useState } from "react";
import { countdown, num } from "@/lib/dates";
import { cn } from "@/lib/utils";

export function Countdown({
  target,
  compact,
  size = "md",
}: {
  target: string | null;
  compact?: boolean;
  size?: "md" | "lg";
}) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const c = countdown(target, now);
  if (!c)
    return (
      <span className="text-xs text-muted-foreground">
        {target ? "صدرت بالفعل" : "لم يُعلن الموعد بعد"}
      </span>
    );

  const parts = [
    { v: c.days, l: "يوم" },
    { v: c.hours, l: "ساعة" },
    { v: c.minutes, l: "دقيقة" },
    { v: c.seconds, l: "ثانية" },
  ];

  if (compact)
    return (
      <span className="font-display text-sm font-bold text-accent tabular-nums">
        {num(c.days)} يوم · {String(c.hours).padStart(2, "0")}:
        {String(c.minutes).padStart(2, "0")}:{String(c.seconds).padStart(2, "0")}
      </span>
    );

  const lg = size === "lg";

  return (
    <div className={cn("flex gap-2", lg && "gap-3")}>
      {parts.map((p) => (
        <div
          key={p.l}
          className={cn(
            "rounded-2xl bg-secondary/70 px-2 py-2 text-center ring-1 ring-border backdrop-blur",
            lg ? "min-w-[84px] py-3 md:min-w-[104px]" : "min-w-[62px]",
          )}
        >
          <p
            className={cn(
              "font-display font-extrabold tabular-nums text-accent",
              lg ? "text-3xl md:text-5xl" : "text-lg",
            )}
          >
            {String(p.v).padStart(2, "0")}
          </p>
          <p className={cn("text-muted-foreground", lg ? "text-xs" : "text-[10px]")}>{p.l}</p>
        </div>
      ))}
    </div>
  );
}

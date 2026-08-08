import { motion } from "motion/react";
import { Crown } from "lucide-react";
import { cn } from "@/lib/utils";

/** شريط شد الحبل بين رقمين مع تتويج الفائز */
export function TugOfWar({
  label,
  leftName,
  rightName,
  left,
  right,
  format = (v: number) => String(v),
}: {
  label: string;
  leftName: string;
  rightName: string;
  left: number;
  right: number;
  format?: (v: number) => string;
}) {
  const total = left + right;
  const leftPct = total > 0 ? (left / total) * 100 : 50;
  const leftWins = left > right;
  const rightWins = right > left;

  return (
    <div className="rounded-3xl border border-border bg-card p-4">
      <p className="mb-3 text-center text-[11px] text-muted-foreground">{label}</p>
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="flex min-w-0 items-center gap-1">
          {leftWins && <Crown className="size-4 shrink-0 text-primary" />}
          <span
            className={cn(
              "font-display text-xl font-black",
              leftWins ? "text-primary" : "text-muted-foreground/60",
            )}
          >
            {format(left)}
          </span>
        </span>
        <span className="flex min-w-0 items-center gap-1">
          <span
            className={cn(
              "font-display text-xl font-black",
              rightWins ? "text-primary" : "text-muted-foreground/60",
            )}
          >
            {format(right)}
          </span>
          {rightWins && <Crown className="size-4 shrink-0 text-primary" />}
        </span>
      </div>
      <div className="flex h-3 overflow-hidden rounded-full bg-secondary">
        <motion.div
          initial={{ width: "50%" }}
          animate={{ width: `${leftPct}%` }}
          transition={{ type: "spring", stiffness: 120, damping: 20 }}
          className="h-full bg-[var(--gradient-primary)]"
        />
        <div className="h-full flex-1 bg-muted-foreground/35" />
      </div>
      <div className="mt-2 flex justify-between text-[11px] text-muted-foreground">
        <bdi>{leftName}</bdi>
        <bdi>{rightName}</bdi>
      </div>
    </div>
  );
}

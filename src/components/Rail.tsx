import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Star, PlayCircle, Clock, Plus } from "lucide-react";
import type { GameEntry } from "@/lib/store";
import { num } from "@/lib/dates";
import { completionSummary } from "@/lib/completion";
import { cn } from "@/lib/utils";

/** صف أفقي بأسلوب نتفليكس — متوافق تمامًا مع الاتجاه من اليمين لليسار */
export function Rail({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-black">{title}</h2>
          {subtitle && <p className="text-[11px] text-muted-foreground">{subtitle}</p>}
        </div>
        {action}
      </div>
      <div
        dir="rtl"
        className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </div>
    </section>
  );
}

/** بطاقة أفقية عريضة بغلاف عالي الدقة وإطار ذهبي */
export function RailCard({
  entry,
  index = 0,
  vip = false,
  footer,
  action,
  wide = true,
}: {
  entry: GameEntry;
  index?: number;
  vip?: boolean;
  footer?: ReactNode;
  action?: ReactNode;
  wide?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.05, 0.4), duration: 0.35 }}
      className={cn(
        "group relative shrink-0 snap-start overflow-hidden rounded-3xl border bg-card transition-transform duration-300 hover:scale-[1.03] active:scale-[0.98]",
        wide ? "w-[19rem] max-w-[82vw]" : "w-52 max-w-[60vw]",
        vip
          ? "border-primary/45 shadow-[0_0_30px_-14px_color-mix(in_oklab,var(--primary)_70%,transparent)]"
          : "border-border",
      )}
    >
      <Link to="/game/$id" params={{ id: String(entry.id) }} className="block">
        <div className="relative aspect-[16/9] overflow-hidden">
          {entry.image ? (
            <img
              src={entry.image}
              alt={entry.name}
              loading="lazy"
              className="size-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
          ) : (
            <div className="size-full bg-secondary" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/45 to-transparent" />
          {footer && (
            <span className="absolute right-3 top-3 rounded-full border border-primary/40 bg-background/80 px-2.5 py-1 text-[11px] font-bold backdrop-blur">
              {footer}
            </span>
          )}
        </div>
        <div className="space-y-1.5 p-4 pb-3">
          <h3 className="truncate font-display text-sm font-bold">
            <bdi>{entry.name}</bdi>
          </h3>
          <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1 text-accent">
              <Star className="size-3 fill-current" />
              {entry.personalRating ? `${num(entry.personalRating, 1)}/10` : "قيد التقييم"}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="size-3" />
              {num(entry.hours, 1)} ساعة
            </span>
          </div>
        </div>
      </Link>
      {action && <div className="px-4 pb-4">{action}</div>}
    </motion.div>
  );
}

/** بطاقة لعبة مختومة داخل الصف — تعرض الشارة والأيام */
export function TrophyRailCard({
  entry,
  index = 0,
  onOpen,
}: {
  entry: GameEntry;
  index?: number;
  onOpen: () => void;
}) {
  const s = completionSummary(entry);
  return (
    <motion.button
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.05, 0.4), duration: 0.35 }}
      onClick={onOpen}
      className="group relative w-[19rem] max-w-[82vw] shrink-0 snap-start overflow-hidden rounded-3xl border border-primary/45 bg-card text-right shadow-[0_0_30px_-14px_color-mix(in_oklab,var(--primary)_70%,transparent)] transition-transform duration-300 hover:scale-[1.03] active:scale-[0.98]"
    >
      <div className="relative aspect-[16/9] overflow-hidden">
        {entry.image ? (
          <img
            src={entry.image}
            alt={entry.name}
            loading="lazy"
            className="size-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        ) : (
          <div className="size-full bg-secondary" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/45 to-transparent" />
        <span className="absolute right-3 top-3 rounded-full border border-primary/40 bg-background/80 px-2.5 py-1 text-[11px] font-bold backdrop-blur">
          {s.badge.emoji} {s.badge.label}
        </span>
      </div>
      <div className="space-y-1.5 p-4">
        <h3 className="truncate font-display text-sm font-bold">
          <bdi>{entry.name}</bdi>
        </h3>
        <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1 text-accent">
            <Star className="size-3 fill-current" />
            {entry.personalRating ? `${num(entry.personalRating, 1)}/10` : "قيد التقييم"}
          </span>
          <span>{num(s.hours, 1)} ساعة</span>
          <span>خلال {num(s.days ?? 1)} يوم</span>
          {entry.fullCompletion && <span>🏆 100%</span>}
        </div>
      </div>
    </motion.button>
  );
}

export { PlayCircle };

/** بطاقة بوستر عمودية للصفوف الأفقية مع زر إضافة سريع */
export function PosterCard({
  entry,
  index = 0,
  onQuick,
  quickLabel = "ابدأ اللعب",
}: {
  entry: GameEntry;
  index?: number;
  onQuick?: () => void;
  quickLabel?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.05, 0.4), duration: 0.35 }}
      className="group relative w-36 max-w-[42vw] shrink-0 snap-start overflow-hidden rounded-3xl border border-border bg-card transition-transform duration-300 hover:scale-[1.04] active:scale-[0.98]"
    >
      <Link to="/game/$id" params={{ id: String(entry.id) }} className="block">
        <div className="relative aspect-[3/4] overflow-hidden">
          {entry.image ? (
            <img
              src={entry.image}
              alt={entry.name}
              loading="lazy"
              className="size-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
          ) : (
            <div className="size-full bg-secondary" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
          <h3 className="absolute inset-x-2 bottom-2 truncate font-display text-xs font-bold">
            <bdi>{entry.name}</bdi>
          </h3>
        </div>
      </Link>
      {onQuick && (
        <button
          type="button"
          aria-label={quickLabel}
          title={quickLabel}
          onClick={onQuick}
          className="absolute left-2 top-2 grid size-8 place-items-center rounded-full border border-primary/60 bg-background/80 text-primary backdrop-blur transition-colors hover:bg-primary hover:text-primary-foreground"
        >
          <Plus className="size-4" />
        </button>
      )}
    </motion.div>
  );
}

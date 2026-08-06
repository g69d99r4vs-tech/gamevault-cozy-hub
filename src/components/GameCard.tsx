import { SmartImage } from "@/components/SmartImage";
import { Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { GripVertical, Heart, Star } from "lucide-react";
import type { GameEntry } from "@/lib/store";
import { useStore } from "@/lib/store";
import { buzz } from "@/lib/haptics";
import { daysBetween } from "@/lib/dates";
import { cn } from "@/lib/utils";

export function GameCard({
  entry,
  index = 0,
  draggable = false,
}: {
  entry: GameEntry;
  index?: number;
  draggable?: boolean;
}) {
  const toggleFavorite = useStore((s) => s.toggleFavorite);
  const days = entry.status === "completed" ? daysBetween(entry.startedAt, entry.completedAt) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.4), duration: 0.4 }}
      className="group relative overflow-hidden rounded-3xl border border-border bg-card surface-hover"
    >
      {draggable && (
        <span className="absolute right-3 top-3 z-10 grid size-8 cursor-grab place-items-center rounded-full bg-background/80 backdrop-blur">
          <GripVertical className="size-4 text-muted-foreground" />
        </span>
      )}
      <Link to="/game/$id" params={{ id: String(entry.id) }} className="block">

        <div className="relative aspect-[16/10] overflow-hidden">
          <SmartImage
            src={entry.image}
            name={entry.name}
            alt={entry.name}
            className="size-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/30 to-transparent" />
          {entry.coop && (
            <span className="absolute right-3 top-3 rounded-full bg-background/75 px-2 py-1 text-[11px] font-bold backdrop-blur">
              🎮🎮 سوا
            </span>
          )}
          {entry.progress > 0 && entry.progress < 100 && (
            <div className="absolute inset-x-3 bottom-3 h-1.5 overflow-hidden rounded-full bg-background/60">
              <div
                className="h-full rounded-full bg-[var(--gradient-primary)]"
                style={{ width: `${entry.progress}%` }}
              />
            </div>
          )}
        </div>
        <div className="space-y-1.5 p-4">
          <h3 className="truncate font-display text-sm font-bold">{entry.name}</h3>
          <p className="truncate text-xs text-muted-foreground">
            {entry.released?.slice(0, 4) ?? "—"} · {entry.genres.slice(0, 2).join("، ") || "—"}
          </p>
          <div className="flex items-center gap-3 pt-1 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1 text-accent">
              <Star className="size-3 fill-current" />
              {entry.personalRating || entry.rating || "—"}
            </span>
            {entry.hours > 0 && <span>{entry.hours} ساعة</span>}
            {days !== null && <span>استغرقت {days} يوم</span>}
            {entry.metacritic && <span>MC {entry.metacritic}</span>}

          </div>
        </div>
      </Link>
      <button
        onClick={() => {
          buzz(20);
          toggleFavorite(entry.id);
        }}
        aria-label="مفضلة"
        className="absolute left-3 top-3 grid size-9 place-items-center rounded-full bg-background/70 backdrop-blur transition-colors hover:bg-background"
      >
        <Heart
          className={cn(
            "size-4 transition-colors",
            entry.favorite ? "fill-destructive text-destructive" : "text-muted-foreground",
          )}
        />
      </button>
    </motion.div>
  );
}

export function GameCardSkeleton() {
  return <div className="h-64 animate-pulse rounded-3xl bg-card/70" />;
}

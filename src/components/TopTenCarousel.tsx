import { Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Star } from "lucide-react";
import type { GameEntry } from "@/lib/store";
import { SmartImage } from "@/components/SmartImage";
import { EmptyState } from "@/components/ui-bits";

/** كاروسيل أفقي لأفضل 10 ألعاب بأرقام عملاقة شفافة فوق الأغلفة */
export function TopTenCarousel({ games }: { games: GameEntry[] }) {
  if (!games.length) return <EmptyState text="قيّم ألعابك لتظهر هنا قائمة أفضل 10." />;

  return (
    <div className="no-scrollbar -mx-3 flex snap-x snap-mandatory gap-3 overflow-x-auto px-3 pb-2">
      {games.map((g, i) => (
        <motion.div
          key={g.id}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: Math.min(i * 0.05, 0.4) }}
          className="w-40 shrink-0 snap-start"
        >
          <Link to="/game/$id" params={{ id: String(g.id) }} className="block">
            <div className="relative aspect-[3/4] overflow-hidden rounded-3xl border border-border bg-secondary surface-hover">
              <SmartImage src={g.image} name={g.name} alt={g.name} className="size-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/10 to-transparent" />
              <span className="pointer-events-none absolute -bottom-6 right-1 font-display text-[7rem] font-black leading-none text-foreground/25 drop-shadow-lg">
                {i + 1}
              </span>
            </div>
            <p className="mt-2 line-clamp-2 text-xs font-bold leading-snug">
              <bdi>{g.name}</bdi>
            </p>
            <p className="flex items-center gap-1 text-[11px] text-primary">
              <Star className="size-3 fill-current" />
              {g.personalRating}/10
            </p>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}

import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { useQuery } from "@tanstack/react-query";
import { X, Flame } from "lucide-react";
import { steamSpecialsFn } from "@/lib/steam.functions";
import { useFavorites } from "@/lib/store-favorites";
import { usePrefs } from "@/lib/prefs";
import { useCurrentData } from "@/lib/store";
import { onceToday, showLocalNotification } from "@/lib/notify";
import { num } from "@/lib/dates";
import { Button } from "@/components/ui/button";

type Deal = { appId: number; name: string; discount: number; image: string };

/** يراقب خصومات المفضلة وإشعارات الذكريات والإصدارات */
export function DealAlerts() {
  const favorites = useFavorites((s) => s.favorites);
  const notifyDeals = usePrefs((s) => s.notifyDeals);
  const notifyMemories = usePrefs((s) => s.notifyMemories);
  const notifyReleases = usePrefs((s) => s.notifyReleases);
  const releaseLead = usePrefs((s) => s.releaseLead);
  const entries = useCurrentData().entries;
  const [deals, setDeals] = useState<Deal[]>([]);
  const deal = deals[0] ?? null;
  const extra = Math.max(0, deals.length - 1);

  const { data: specials } = useQuery({
    queryKey: ["steam", "specials", "alerts"],
    queryFn: () => steamSpecialsFn(),
    enabled: notifyDeals && favorites.length > 0,
    staleTime: 1000 * 60 * 30,
  });

  // خصومات المفضلة — تنبيه واحد مجمّع في اليوم
  useEffect(() => {
    if (!notifyDeals || !favorites.length) return;
    const live = new Map((specials ?? []).map((s) => [s.appId, s]));
    const hits = favorites
      .map((f) => {
        const l = live.get(f.appId);
        const discount = l?.discount ?? f.discount ?? 0;
        return { appId: f.appId, name: l?.name ?? f.name, discount, image: l?.image ?? f.image };
      })
      .filter((d) => d.discount > 0)
      .sort((a, b) => b.discount - a.discount);
    if (!hits.length) return;
    const signature = hits.map((d) => `${d.appId}:${d.discount}`).join(",");
    if (!onceToday(`deals:${signature}`)) return;
    setDeals(hits);
  }, [specials, favorites, notifyDeals]);

  // إخفاء تلقائي بعد 6 ثوانٍ
  useEffect(() => {
    if (!deal) return;
    const t = setTimeout(() => setDeals([]), 7000);
    return () => clearTimeout(t);
  }, [deal]);

  // إشعارات الذكريات — تستثني الختمات القديمة تمامًا
  useEffect(() => {
    if (!notifyMemories) return;
    const now = new Date();
    const md = `${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    for (const e of entries) {
      if (e.legacy || !e.completedAt) continue;
      const d = new Date(e.completedAt);
      if (Number.isNaN(d.getTime())) continue;
      const years = now.getFullYear() - d.getFullYear();
      if (years < 1) continue;
      const emd = `${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      if (emd !== md) continue;
      if (!onceToday(`memory:${e.id}`)) continue;
      void showLocalNotification(
        "ذكرى ختمة 🎮",
        `قبل ${num(years)} سنة ختمت ${e.name} — وقت الاحتفال!`,
        `/game/${e.id}`,
      );
    }
  }, [entries, notifyMemories]);

  // تذكير الإصدارات المرتقبة حسب المهلة المختارة
  useEffect(() => {
    if (!notifyReleases) return;
    const now = Date.now();
    for (const e of entries) {
      if (e.status !== "hype" || !e.released) continue;
      const t = new Date(e.released).getTime();
      if (Number.isNaN(t)) continue;
      const days = Math.ceil((t - now) / 86400000);
      if (days < 0 || days > releaseLead) continue;
      if (!onceToday(`release:${e.id}`)) continue;
      void showLocalNotification(
        "إصدار قريب 🚀",
        days <= 0 ? `${e.name} صدرت اليوم!` : `باقي ${num(days)} يوم على ${e.name}`,
        `/game/${e.id}`,
      );
    }
  }, [entries, notifyReleases, releaseLead]);

  return (
    <AnimatePresence>
      {deal && (
        <motion.div
          dir="rtl"
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 28 }}
          drag="y"
          dragConstraints={{ top: 0, bottom: 0 }}
          onDragEnd={(_, info) => {
            if (info.offset.y > 60) setDeals([]);
          }}
          className="fixed inset-x-3 bottom-24 z-[80] mx-auto max-w-md lg:bottom-6"
        >
          <div className="flex items-center gap-3 rounded-3xl border border-primary/40 bg-popover/95 p-3 shadow-[0_18px_45px_-18px_rgba(0,0,0,0.9)] backdrop-blur-xl">
            {deal.image ? (
              <img
                src={deal.image}
                alt={deal.name}
                className="h-14 w-24 shrink-0 rounded-xl object-cover"
              />
            ) : (
              <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary/15">
                <Flame className="size-5 text-primary" />
              </span>
            )}
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-xs leading-relaxed">
                🔥 خبر رهيب! لعبتك المفضلة <bdi className="font-bold">{deal.name}</bdi> عليها خصم{" "}
                <span className="font-black text-primary">{num(deal.discount)}%</span> الآن!
                {extra > 0 && (
                  <span className="text-muted-foreground">
                    {" "}
                    و{num(extra)} من مفضلاتك عليها عروض أيضًا.
                  </span>
                )}
              </p>
              <Button
                asChild
                size="sm"
                className="mt-2 h-8 rounded-xl px-3 text-[11px] font-bold"
                onClick={() => setDeals([])}
              >
                <Link to="/store/$appId" params={{ appId: String(deal.appId) }}>
                  شاهد العرض
                </Link>
              </Button>
            </div>
            <button
              type="button"
              aria-label="إغلاق"
              onClick={() => setDeals([])}
              className="grid size-8 shrink-0 place-items-center rounded-full bg-secondary/70 text-muted-foreground"
            >
              <X className="size-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

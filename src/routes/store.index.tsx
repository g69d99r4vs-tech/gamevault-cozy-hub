import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";
import { Search, ExternalLink, X, Loader2 } from "lucide-react";
import { steamSpecialsFn, steamSearchFn, steamDetailsFn } from "@/lib/steam.functions";
import { SectionTitle } from "@/components/ui-bits";
import { Button } from "@/components/ui/button";
import { buzz } from "@/lib/haptics";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/store")({
  head: () => ({
    meta: [
      { title: "المتجر — GameHub" },
      {
        name: "description",
        content: "تصفح عروض ستيم الحالية وابحث عن الألعاب بأسعار محوّلة إلى الريال السعودي.",
      },
      { property: "og:title", content: "المتجر — GameHub" },
      { property: "og:description", content: "عروض ستيم الحالية بأسعار بالريال السعودي." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: StorePage,
});

/** 1 هريفنيا أوكرانية = 0.091 ريال سعودي */
const UAH_TO_SAR = 0.091;
const toSar = (cents: number) => Math.round((cents / 100) * UAH_TO_SAR);
const sarLabel = (cents: number) => (cents > 0 ? `${toSar(cents)} ريال` : "مجانية");

type Item = {
  appId: number;
  name: string;
  image: string;
  uahFinal: number;
  uahInitial: number;
  discount: number;
};

function GameCardStore({ item, onOpen, index }: { item: Item; onOpen: () => void; index: number }) {
  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.3) }}
      onClick={() => {
        buzz(20);
        onOpen();
      }}
      className="group overflow-hidden rounded-3xl border border-border bg-card text-right surface-hover"
    >
      <div className="relative aspect-[460/215] overflow-hidden">
        <img
          src={item.image}
          alt={item.name}
          loading="lazy"
          className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {item.discount > 0 && (
          <span className="absolute right-2 top-2 rounded-xl bg-primary px-2 py-1 text-[11px] font-black text-primary-foreground">
            -{item.discount}%
          </span>
        )}
      </div>
      <div className="space-y-1 p-3">
        <h3 className="line-clamp-2 text-sm font-bold leading-snug">{item.name}</h3>
        <div className="flex items-center gap-2">
          {item.discount > 0 && item.uahInitial > item.uahFinal && (
            <span className="text-[11px] text-muted-foreground line-through">
              {toSar(item.uahInitial)} ريال
            </span>
          )}
          <span className="font-display text-base font-black text-primary">
            {sarLabel(item.uahFinal)}
          </span>
        </div>
      </div>
    </motion.button>
  );
}

function DetailsModal({ appId, onClose }: { appId: number; onClose: () => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ["steam-details", appId],
    queryFn: () => steamDetailsFn({ data: { appId } }),
  });

  return (
    <AnimatePresence>
      <motion.div
        dir="rtl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[70] grid place-items-center bg-black/80 p-4 backdrop-blur-sm"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ type: "spring", stiffness: 320, damping: 28 }}
          onClick={(e) => e.stopPropagation()}
          className="max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-primary/25 bg-card shadow-2xl"
        >
          <div className="relative">
            <img
              src={
                data?.image ??
                `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/header.jpg`
              }
              alt={data?.name ?? "غلاف اللعبة"}
              className="aspect-[460/215] w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-card via-card/30 to-transparent" />
            <button
              type="button"
              onClick={onClose}
              aria-label="إغلاق"
              className="absolute left-3 top-3 grid size-9 place-items-center rounded-full bg-background/80 text-foreground"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="space-y-4 p-5">
            {isLoading ? (
              <div className="flex items-center justify-center gap-2 py-6 text-muted-foreground">
                <Loader2 className="size-4 animate-spin" /> جاري التحميل…
              </div>
            ) : (
              <>
                <h2 className="font-display text-2xl font-black">{data?.name ?? "لعبة"}</h2>
                <div className="flex items-center gap-3">
                  <span className="rounded-2xl bg-primary/12 px-3 py-1.5 font-display text-lg font-black text-primary">
                    {sarLabel(data?.uahFinal ?? 0)}
                  </span>
                  {!!data?.discount && (
                    <span className="rounded-xl bg-primary px-2 py-1 text-[11px] font-black text-primary-foreground">
                      -{data.discount}%
                    </span>
                  )}
                </div>
                {!!data?.genres?.length && (
                  <div className="flex flex-wrap gap-2">
                    {data.genres.slice(0, 4).map((g) => (
                      <span
                        key={g}
                        className="rounded-full bg-secondary px-3 py-1 text-[11px] text-muted-foreground"
                      >
                        {g}
                      </span>
                    ))}
                  </div>
                )}
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {data?.description || "لا يوجد وصف متاح لهذه اللعبة."}
                </p>
              </>
            )}

            <Button
              onClick={() => {
                buzz(30);
                window.open(
                  `https://store.steampowered.com/app/${appId}`,
                  "_blank",
                  "noopener,noreferrer",
                );
              }}
              className="h-12 w-full rounded-2xl border border-yellow-300/70 bg-primary font-display text-base font-black text-primary-foreground shadow-[0_0_30px_-6px_rgba(234,179,8,0.85)] hover:bg-primary/90"
            >
              <ExternalLink className="size-4" /> انقلني للموقع
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function StorePage() {
  const [term, setTerm] = useState("");
  const [openId, setOpenId] = useState<number | null>(null);

  const specials = useQuery({
    queryKey: ["steam-specials"],
    queryFn: () => steamSpecialsFn(),
    staleTime: 1000 * 60 * 30,
  });

  const q = term.trim();
  const search = useQuery({
    queryKey: ["steam-search", q],
    queryFn: () => steamSearchFn({ data: { term: q } }),
    enabled: q.length >= 2,
  });

  const results = useMemo(() => (search.data ?? []) as Item[], [search.data]);
  const sales = useMemo(() => ((specials.data ?? []) as Item[]).slice(0, 30), [specials.data]);

  return (
    <div dir="rtl" className="space-y-6">
      <div className="relative">
        <Search className="absolute right-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="ابحث عن لعبة في ستيم…"
          className="h-12 w-full rounded-2xl border border-border bg-card pr-11 ps-4 text-sm outline-none ring-primary/40 transition focus:ring-2"
        />
      </div>

      {q.length >= 2 ? (
        <section className="space-y-3">
          <SectionTitle title="نتائج البحث" subtitle={`عن «${q}»`} />
          {search.isLoading ? (
            <p className="py-6 text-center text-sm text-muted-foreground">جاري البحث…</p>
          ) : results.length ? (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
              {results.map((item, i) => (
                <GameCardStore
                  key={item.appId}
                  item={item}
                  index={i}
                  onOpen={() => setOpenId(item.appId)}
                />
              ))}
            </div>
          ) : (
            <p className="rounded-3xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
              ما لقينا نتائج مطابقة.
            </p>
          )}
        </section>
      ) : null}

      <section className={cn("space-y-3", q.length >= 2 && "opacity-90")}>
        <SectionTitle title="العروض الحالية" subtitle="أسعار ستيم محوّلة للريال السعودي" />
        {specials.isLoading ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-48 animate-pulse rounded-3xl bg-secondary/60" />
            ))}
          </div>
        ) : sales.length ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
            {sales.map((item, i) => (
              <GameCardStore
                key={item.appId}
                item={item}
                index={i}
                onOpen={() => setOpenId(item.appId)}
              />
            ))}
          </div>
        ) : (
          <p className="rounded-3xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
            تعذّر جلب العروض حاليًا، جرّب لاحقًا.
          </p>
        )}
      </section>

      {openId !== null && <DetailsModal appId={openId} onClose={() => setOpenId(null)} />}
    </div>
  );
}

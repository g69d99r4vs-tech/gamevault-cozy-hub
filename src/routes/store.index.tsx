import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";
import { Search, Heart, Flame, ChevronLeft, ChevronRight } from "lucide-react";
import { steamSpecialsFn, steamSearchFn } from "@/lib/steam.functions";
import { SectionTitle } from "@/components/ui-bits";
import { useFavorites } from "@/lib/store-favorites";
import { buzz } from "@/lib/haptics";
import { cn } from "@/lib/utils";
import { SmartImage } from "@/components/SmartImage";

export const Route = createFileRoute("/store/")({
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
export const toSar = (cents: number) => Math.round((cents / 100) * UAH_TO_SAR);
export const sarLabel = (cents: number) => (cents > 0 ? `${toSar(cents)} ريال` : "مجانية");

type Item = {
  appId: number;
  name: string;
  image: string;
  uahFinal: number;
  uahInitial: number;
  discount: number;
};

function PriceTag({ item }: { item: Item }) {
  return (
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
  );
}

function GameCardStore({ item, index }: { item: Item; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.3) }}
    >
      <Link
        to="/store/$appId"
        params={{ appId: String(item.appId) }}
        onClick={() => buzz(20)}
        className="group block overflow-hidden rounded-3xl border border-border bg-card text-right surface-hover"
      >
        <div className="relative aspect-[460/215] overflow-hidden">
          <SmartImage
            src={item.image}
            name={item.name}
            alt={item.name}
            className="size-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          {item.discount > 0 && (
            <span className="absolute right-2 top-2 rounded-xl bg-primary px-2 py-1 text-[11px] font-black text-primary-foreground">
              -{item.discount}%
            </span>
          )}
        </div>
        <div className="space-y-1 p-3">
          <h3 className="line-clamp-2 text-sm font-bold leading-snug">{item.name}</h3>
          <PriceTag item={item} />
        </div>
      </Link>
    </motion.div>
  );
}

function HeroCarousel({ items }: { items: Item[] }) {
  const [i, setI] = useState(0);
  const navigate = useNavigate();
  const len = items.length;

  useEffect(() => {
    if (len < 2) return;
    const t = setInterval(() => setI((v) => (v + 1) % len), 5000);
    return () => clearInterval(t);
  }, [len]);

  if (!len) return null;
  const item = items[i % len]!;

  return (
    <section className="relative overflow-hidden rounded-[2rem] border-2 border-yellow-500/25 shadow-[0_0_40px_-20px_rgba(234,179,8,0.9)]">
      <AnimatePresence mode="wait">
        <motion.img
          key={item.appId}
          src={item.image}
          alt={item.name}
          initial={{ opacity: 0, scale: 1.08 }}
          animate={{ opacity: 0.65, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7 }}
          className="absolute inset-0 size-full object-cover"
        />
      </AnimatePresence>
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
      <button
        type="button"
        onClick={() => {
          buzz(20);
          navigate({ to: "/store/$appId", params: { appId: String(item.appId) } });
        }}
        className="relative flex min-h-52 w-full flex-col justify-end gap-2 p-5 text-right"
      >
        <span className="flex items-center gap-1.5 text-[11px] font-bold text-primary">
          <Flame className="size-3.5" /> أبرز العروض
        </span>
        <h2 className="line-clamp-2 font-display text-2xl font-black md:text-4xl">{item.name}</h2>
        <div className="flex items-center gap-2">
          {item.discount > 0 && (
            <span className="rounded-xl bg-primary px-2 py-1 text-[11px] font-black text-primary-foreground">
              -{item.discount}%
            </span>
          )}
          <span className="font-display text-xl font-black text-primary">
            {sarLabel(item.uahFinal)}
          </span>
        </div>
      </button>

      <div className="absolute bottom-4 left-4 flex items-center gap-2">
        <button
          type="button"
          aria-label="التالي"
          onClick={() => setI((v) => (v + 1) % len)}
          className="grid size-8 place-items-center rounded-full glass"
        >
          <ChevronLeft className="size-4" />
        </button>
        <button
          type="button"
          aria-label="السابق"
          onClick={() => setI((v) => (v - 1 + len) % len)}
          className="grid size-8 place-items-center rounded-full glass"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
    </section>
  );
}

function Row({ items }: { items: Item[] }) {
  return (
    <div dir="rtl" className="no-scrollbar -mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-1">
      {items.map((item, i) => (
        <div key={item.appId} className="w-[70%] shrink-0 snap-start sm:w-[42%] lg:w-[28%]">
          <GameCardStore item={item} index={i} />
        </div>
      ))}
    </div>
  );
}

const tabs = [
  { v: "sales", l: "العروض الحالية" },
  { v: "favs", l: "مفضلتي" },
] as const;

function StorePage() {
  const [term, setTerm] = useState("");
  const [tab, setTab] = useState<(typeof tabs)[number]["v"]>("sales");
  const favorites = useFavorites((s) => s.favorites);

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
  const all = useMemo(() => (specials.data ?? []) as Item[], [specials.data]);
  const hero = all.filter((x) => x.discount > 0).slice(0, 5);
  const offers = all.filter((x) => x.discount > 0).slice(0, 18);
  const rest = all.slice(offers.length, offers.length + 24);

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

      <div className="flex gap-1 rounded-2xl bg-secondary/50 p-1">
        {tabs.map((t) => (
          <button
            key={t.v}
            type="button"
            onClick={() => {
              buzz(15);
              setTab(t.v);
            }}
            className={cn(
              "flex-1 rounded-xl px-3 py-2 font-display text-sm font-black transition",
              tab === t.v
                ? "bg-primary text-primary-foreground shadow-[0_0_25px_-8px_rgba(234,179,8,0.9)]"
                : "text-muted-foreground",
            )}
          >
            {t.v === "favs" ? (
              <span className="inline-flex items-center gap-1.5">
                <Heart className="size-3.5" /> {t.l}
              </span>
            ) : (
              t.l
            )}
          </button>
        ))}
      </div>

      {q.length >= 2 ? (
        <section className="space-y-3">
          <SectionTitle title="نتائج البحث" subtitle={`عن «${q}»`} />
          {search.isLoading ? (
            <p className="py-6 text-center text-sm text-muted-foreground">جاري البحث…</p>
          ) : results.length ? (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
              {results.map((item, i) => (
                <GameCardStore key={item.appId} item={item} index={i} />
              ))}
            </div>
          ) : (
            <p className="rounded-3xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
              ما لقينا نتائج مطابقة.
            </p>
          )}
        </section>
      ) : tab === "favs" ? (
        <section className="space-y-3">
          <SectionTitle title="مفضلتي" subtitle="الألعاب اللي حفظتها من المتجر" />
          {favorites.length ? (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
              {favorites.map((item, i) => (
                <GameCardStore key={item.appId} item={item} index={i} />
              ))}
            </div>
          ) : (
            <p className="rounded-3xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
              ما فيه ألعاب بالمفضلة — افتح أي لعبة وأضفها ❤️
            </p>
          )}
        </section>
      ) : (
        <>
          <HeroCarousel items={hero} />

          <section className="space-y-3">
            <SectionTitle title="عروض مميزة" subtitle="أسعار ستيم محوّلة للريال السعودي" />
            {specials.isLoading ? (
              <div className="flex gap-3 overflow-hidden">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-48 w-[70%] shrink-0 animate-pulse rounded-3xl bg-secondary/60 sm:w-[42%]" />
                ))}
              </div>
            ) : offers.length ? (
              <Row items={offers} />
            ) : (
              <p className="rounded-3xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
                تعذّر جلب العروض حاليًا، جرّب لاحقًا.
              </p>
            )}
          </section>

          {!!rest.length && (
            <section className="space-y-3">
              <SectionTitle title="الأكثر مبيعًا" subtitle="اختيارات ستيم الرائجة" />
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
                {rest.map((item, i) => (
                  <GameCardStore key={item.appId} item={item} index={i} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

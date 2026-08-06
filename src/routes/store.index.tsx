import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";
import { Search, Heart, Flame, ChevronLeft, ChevronRight, Package } from "lucide-react";
import { steamSearchFn, steamShelvesFn, steamBundlesFn } from "@/lib/steam.functions";
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
export const sarLabel = (
  cents: number,
  opts: { isFree?: boolean | undefined; comingSoon?: boolean | undefined } = {},
) => {
  if (cents > 0) return `${toSar(cents)} ريال`;
  if (opts.comingSoon) return "قريباً";
  return opts.isFree ? "مجانية" : "قريباً";
};

type Item = {
  appId: number;
  name: string;
  image: string;
  uahFinal: number;
  uahInitial: number;
  discount: number;
  isFree?: boolean;
  comingSoon?: boolean;
  released?: string | null;
};

function DiscountBadge({ value }: { value: number }) {
  return (
    <span className="rounded-lg bg-[oklch(0.72_0.19_140)] px-2 py-1 text-[11px] font-black text-[oklch(0.16_0.02_150)] shadow-[0_6px_18px_-6px_oklch(0.72_0.19_140/0.9)]">
      -{value}%
    </span>
  );
}

function PriceTag({ item }: { item: Item }) {
  return (
    <div className="flex items-center gap-2">
      {item.discount > 0 && item.uahInitial > item.uahFinal && (
        <span className="text-[11px] text-muted-foreground line-through">
          {toSar(item.uahInitial)} ريال
        </span>
      )}
      <span className="font-display text-base font-black text-primary">
        {sarLabel(item.uahFinal, { isFree: item.isFree, comingSoon: item.comingSoon })}
      </span>
    </div>
  );
}

function GameCardStore({
  item,
  index,
  bundle = false,
}: {
  item: Item;
  index: number;
  bundle?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      transition={{ delay: Math.min(index * 0.03, 0.3), type: "spring", stiffness: 320, damping: 26 }}
    >
      <Link
        to="/store/$appId"
        params={{ appId: String(item.appId) }}
        onClick={() => buzz(20)}
        className={cn(
          "group block overflow-hidden rounded-3xl border bg-card text-right transition-shadow duration-300 hover:shadow-[0_18px_45px_-24px_oklch(0.85_0.16_85/0.9)]",
          bundle ? "border-primary/40" : "border-border",
        )}
      >
        <div className="relative aspect-[460/215] overflow-hidden">
          <SmartImage
            src={item.image}
            name={item.name}
            alt={item.name}
            className="size-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          {item.discount > 0 && (
            <span className="absolute right-2 top-2">
              <DiscountBadge value={item.discount} />
            </span>
          )}
          {bundle && (
            <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-lg bg-primary px-2 py-1 text-[10px] font-black text-primary-foreground">
              <Package className="size-3" /> حزمة
            </span>
          )}
        </div>
        <div className="space-y-1 p-3">
          <h3 className="line-clamp-2 text-sm font-bold leading-snug">{item.name}</h3>
          {(item.released || item.comingSoon) && (
            <p className="text-[11px] font-semibold text-muted-foreground">
              {item.released ? new Date(item.released).getFullYear() : "قريباً"}
            </p>
          )}
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
    <section className="relative -mx-4 overflow-hidden border-y-2 border-primary/25 shadow-[0_0_60px_-28px_oklch(0.85_0.16_85/0.9)] md:mx-0 md:rounded-[2rem] md:border-2">
      <AnimatePresence mode="wait">
        <motion.img
          key={`${item.appId}-${i}`}
          src={item.image}
          alt={item.name}
          initial={{ opacity: 0, scale: 1.12 }}
          animate={{ opacity: 0.7, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
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
        className="relative flex min-h-[17rem] w-full flex-col justify-end gap-2 p-5 text-right md:min-h-[22rem] md:p-8"
      >
        <span className="flex items-center gap-1.5 text-[11px] font-bold text-primary">
          <Flame className="size-3.5" /> أبرز العروض
        </span>
        <h2 className="line-clamp-2 font-display text-3xl font-black md:text-5xl">{item.name}</h2>
        <div className="flex items-center gap-2">
          {item.discount > 0 && <DiscountBadge value={item.discount} />}
          <span className="font-display text-2xl font-black text-primary">
            {sarLabel(item.uahFinal, { isFree: item.isFree, comingSoon: item.comingSoon })}
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

      <div className="absolute bottom-5 right-5 flex gap-1.5">
        {items.map((g, idx) => (
          <span
            key={`${g.appId}-${idx}`}
            className={cn(
              "h-1.5 rounded-full transition-all",
              idx === i % len ? "w-6 bg-primary" : "w-1.5 bg-foreground/30",
            )}
          />
        ))}
      </div>
    </section>
  );
}

function Shelf({
  title,
  subtitle,
  items,
  bundle = false,
}: {
  title: string;
  subtitle?: string;
  items: Item[];
  bundle?: boolean;
}) {
  if (!items.length) return null;
  return (
    <section className="space-y-3">
      <SectionTitle title={title} {...(subtitle ? { subtitle } : {})} />
      <div
        dir="rtl"
        className="no-scrollbar -mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-1"
      >
        {items.map((item, i) => (
          <div key={`${item.appId}-${i}`} className="w-[70%] shrink-0 snap-start sm:w-[42%] lg:w-[28%]">
            <GameCardStore item={item} index={i} bundle={bundle} />
          </div>
        ))}
      </div>
    </section>
  );
}

const tabs = [
  { v: "sales", l: "العروض الحالية" },
  { v: "favs", l: "مفضلتي" },
] as const;

const genres = [
  { l: "الكل", q: "" },
  { l: "إثارة", q: "action" },
  { l: "رعب", q: "horror" },
  { l: "مغامرة", q: "adventure" },
  { l: "RPG", q: "rpg" },
  { l: "رياضة", q: "sports" },
  { l: "سباقات", q: "racing" },
  { l: "قتال", q: "fighting" },
  { l: "استراتيجية", q: "strategy" },
] as const;

function StorePage() {
  const [term, setTerm] = useState("");
  const [tab, setTab] = useState<(typeof tabs)[number]["v"]>("sales");
  const [genre, setGenre] = useState("");
  const favorites = useFavorites((s) => s.favorites);

  const shelves = useQuery({
    queryKey: ["steam-shelves"],
    queryFn: () => steamShelvesFn(),
    staleTime: 1000 * 60 * 30,
  });

  const bundles = useQuery({
    queryKey: ["steam-bundles"],
    queryFn: () => steamBundlesFn(),
    staleTime: 1000 * 60 * 60,
  });

  const q = term.trim();
  const search = useQuery({
    queryKey: ["steam-search", q],
    queryFn: () => steamSearchFn({ data: { term: q } }),
    enabled: q.length >= 2,
  });

  const genreQuery = useQuery({
    queryKey: ["steam-genre", genre],
    queryFn: () => steamSearchFn({ data: { term: genre } }),
    enabled: genre.length > 0,
  });

  const results = useMemo(() => (search.data ?? []) as Item[], [search.data]);
  const data = shelves.data;
  const specials = useMemo(
    () => ((data?.specials ?? []) as Item[]).filter((x) => x.discount > 0),
    [data],
  );
  const hero = specials.slice(0, 6);
  const topSellers = (data?.topSellers ?? []) as Item[];
  const newReleases = (data?.newReleases ?? []) as Item[];
  const bundleItems = (bundles.data ?? []) as Item[];
  const genreItems = (genreQuery.data ?? []) as Item[];

  const loadingRow = (
    <div className="flex gap-3 overflow-hidden">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="h-48 w-[70%] shrink-0 animate-pulse rounded-3xl bg-secondary/60 sm:w-[42%]"
        />
      ))}
    </div>
  );

  return (
    <div dir="rtl" className="space-y-7">
      <div className="relative">
        <Search className="absolute right-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="ابحث عن لعبة في ستيم…"
          className="h-12 w-full rounded-2xl border border-border bg-card pr-11 ps-4 text-sm outline-none ring-primary/40 transition focus:ring-2"
        />
      </div>

      <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1">
        {genres.map((g) => (
          <button
            key={g.l}
            type="button"
            onClick={() => {
              buzz(15);
              setGenre(g.q);
            }}
            className={cn(
              "shrink-0 rounded-full border px-4 py-2 text-xs font-black transition",
              genre === g.q
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:border-primary/40",
            )}
          >
            {g.l}
          </button>
        ))}
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
                ? "bg-primary text-primary-foreground shadow-[0_0_25px_-8px_oklch(0.85_0.16_85/0.9)]"
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
                <GameCardStore key={`${item.appId}-${i}`} item={item} index={i} />
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
                <GameCardStore key={`${item.appId}-${i}`} item={item} index={i} />
              ))}
            </div>
          ) : (
            <p className="rounded-3xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
              ما فيه ألعاب بالمفضلة — افتح أي لعبة وأضفها ❤️
            </p>
          )}
        </section>
      ) : genre ? (
        <section className="space-y-3">
          <SectionTitle
            title={`تصنيف: ${genres.find((g) => g.q === genre)?.l ?? ""}`}
            subtitle="نتائج من متجر ستيم"
          />
          {genreQuery.isLoading ? (
            loadingRow
          ) : genreItems.length ? (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
              {genreItems.map((item, i) => (
                <GameCardStore key={`${item.appId}-${i}`} item={item} index={i} />
              ))}
            </div>
          ) : (
            <p className="rounded-3xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
              ما فيه نتائج لهذا التصنيف حاليًا.
            </p>
          )}
        </section>
      ) : (
        <>
          {shelves.isLoading ? (
            <div className="h-64 animate-pulse rounded-[2rem] bg-secondary/60" />
          ) : (
            <HeroCarousel items={hero} />
          )}

          {shelves.isLoading ? (
            <section className="space-y-3">
              <SectionTitle title="عروض مميزة" subtitle="أسعار ستيم محوّلة للريال السعودي" />
              {loadingRow}
            </section>
          ) : (
            <Shelf
              title="🔥 عروض مميزة"
              subtitle="أسعار ستيم محوّلة للريال السعودي"
              items={specials.slice(0, 18)}
            />
          )}

          <Shelf title="🏆 الأكثر مبيعاً" subtitle="اختيارات ستيم الرائجة" items={topSellers} />
          <Shelf title="✨ وصل حديثاً" subtitle="أحدث الإصدارات على ستيم" items={newReleases} />

          <section className="space-y-3">
            <SectionTitle title="📦 عروض الحزم" subtitle="حزم وإصدارات ديلوكس وألتيميت" />
            {bundles.isLoading ? (
              loadingRow
            ) : bundleItems.length ? (
              <div
                dir="rtl"
                className="no-scrollbar -mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-1"
              >
                {bundleItems.map((item, i) => (
                  <div key={`${item.appId}-${i}`} className="w-[70%] shrink-0 snap-start sm:w-[42%] lg:w-[28%]">
                    <GameCardStore item={item} index={i} bundle />
                  </div>
                ))}
              </div>
            ) : (
              <p className="rounded-3xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
                ما فيه حزم متاحة حاليًا، جرّب لاحقًا.
              </p>
            )}
          </section>
        </>
      )}
    </div>
  );
}

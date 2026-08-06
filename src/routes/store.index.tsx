import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Search, ShoppingBag, X, Star } from "lucide-react";
import { listDealsFn, searchDealsFn, ratesFn } from "@/lib/deals.functions";
import {
  CATEGORIES,
  FALLBACK_RATES,
  filterByCategory,
  formatSar,
  type CategoryId,
  type Rates,
  type StoreDeal,
} from "@/lib/deals";
import { SectionTitle } from "@/components/ui-bits";
import { cn } from "@/lib/utils";
import { buzz } from "@/lib/haptics";

export const Route = createFileRoute("/store/")({
  head: () => ({
    meta: [
      { title: "المتجر — عروض وتخفيضات الألعاب | GameHub" },
      {
        name: "description",
        content:
          "ابحث وصفّح أقوى عروض ألعاب PC الحيّة بأسعار محوّلة من الهريفنيا الأوكرانية إلى الريال السعودي.",
      },
      { property: "og:title", content: "المتجر — عروض وتخفيضات الألعاب | GameHub" },
      {
        property: "og:description",
        content: "بحث فوري، تصنيفات، وخصومات حقيقية بسعر الريال السعودي.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: StorePage,
});

function StorePage() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<CategoryId>("all");

  const getRates = useServerFn(ratesFn);
  const getPool = useServerFn(listDealsFn);
  const doSearch = useServerFn(searchDealsFn);

  const { data: rates = FALLBACK_RATES } = useQuery<Rates>({
    queryKey: ["fx-rates"],
    queryFn: () => getRates(),
    staleTime: 1000 * 60 * 60,
  });

  const pool = useQuery<StoreDeal[]>({
    queryKey: ["deals-pool"],
    queryFn: () => getPool(),
    staleTime: 1000 * 60 * 10,
  });

  const term = q.trim();
  const remote = useQuery<StoreDeal[]>({
    queryKey: ["deals-search", term],
    queryFn: () => doSearch({ data: { q: term } }),
    enabled: term.length >= 2,
    staleTime: 1000 * 60 * 5,
  });

  const list = useMemo(() => {
    const base = pool.data ?? [];
    if (term.length >= 2) {
      const local = base.filter((d) =>
        d.title.toLowerCase().includes(term.toLowerCase()),
      );
      const merged = [...local];
      for (const d of remote.data ?? []) {
        if (!merged.some((m) => m.title.toLowerCase() === d.title.toLowerCase()))
          merged.push(d);
      }
      return filterByCategory(merged, cat);
    }
    return filterByCategory(base, cat);
  }, [pool.data, remote.data, term, cat]);

  const loading = pool.isLoading || (term.length >= 2 && remote.isLoading);

  return (
    <div className="space-y-5">
      <SectionTitle title="المتجر" subtitle="عروض حيّة بالريال السعودي" />

      {/* البحث */}
      <div className="relative">
        <Search className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="ابحث عن لعبة في المتجر…"
          className="h-12 w-full rounded-2xl border border-border bg-card pr-11 pl-10 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/60"
        />
        {q && (
          <button
            type="button"
            onClick={() => setQ("")}
            aria-label="مسح البحث"
            className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {/* التصنيفات */}
      <div className="-mx-3 flex snap-x gap-2 overflow-x-auto px-3 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => {
              buzz(10);
              setCat(c.id);
            }}
            className={cn(
              "shrink-0 snap-start rounded-full border px-4 py-2 text-xs font-bold transition-colors",
              cat === c.id
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:text-foreground",
            )}
          >
            {c.label}
          </button>
        ))}
      </div>

      {loading && <SkeletonGrid />}
      {pool.isError && !loading && <ErrorBox />}

      {!loading && !pool.isError && list.length === 0 && (
        <p className="rounded-3xl border border-border p-10 text-center text-sm text-muted-foreground">
          لا توجد نتائج مطابقة
        </p>
      )}

      {!loading && list.length > 0 && (
        <>
          <p className="text-xs text-muted-foreground">{list.length} لعبة</p>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {list.map((d) => (
              <DealCard key={d.dealID} d={d} rates={rates} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function DealCard({ d, rates }: { d: StoreDeal; rates: Rates }) {
  const off = Math.round(d.savings);
  return (
    <Link
      to="/store/$dealId"
      params={{ dealId: encodeURIComponent(d.dealID) }}
      className="group block overflow-hidden rounded-3xl border border-border bg-card surface-hover"
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-secondary">
        <img
          src={d.capsule}
          alt={d.title}
          loading="lazy"
          onError={(e) => {
            const img = e.currentTarget;
            if (img.src !== d.thumb) img.src = d.thumb;
          }}
          className="size-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        {off > 0 && (
          <span className="absolute left-2 top-2 rounded-lg bg-primary px-2 py-0.5 text-[11px] font-black text-primary-foreground">
            -{off}%
          </span>
        )}
        {!!d.metacriticScore && (
          <span className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-background/85 px-2 py-0.5 text-[10px] font-bold backdrop-blur">
            <Star className="size-3 text-primary" />
            {d.metacriticScore}
          </span>
        )}
      </div>
      <div className="space-y-1.5 p-3">
        <p className="text-sm font-bold leading-snug break-words line-clamp-2">
          <bdi>{d.title}</bdi>
        </p>
        <div className="flex items-center gap-2">
          <span className="font-display text-sm font-black text-primary">
            {formatSar(d.salePriceUsd, rates)}
          </span>
          {d.normalPriceUsd > d.salePriceUsd && (
            <span className="text-[11px] text-muted-foreground line-through">
              {formatSar(d.normalPriceUsd, rates)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-52 animate-pulse rounded-3xl bg-secondary/60" />
      ))}
    </div>
  );
}

function ErrorBox() {
  return (
    <p className="flex items-center justify-center gap-2 rounded-3xl border border-border p-8 text-center text-sm text-muted-foreground">
      <ShoppingBag className="size-4" />
      تعذّر جلب العروض حاليًا، حاول لاحقًا
    </p>
  );
}

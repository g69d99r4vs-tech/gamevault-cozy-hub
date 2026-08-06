import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Flame, Tag, Loader2, ShoppingBag } from "lucide-react";
import { getTopDeals, getSaleDeals, getRates, formatSar, FALLBACK_RATES, type Deal } from "@/lib/deals";
import { SectionTitle } from "@/components/ui-bits";

export const Route = createFileRoute("/store/")({
  head: () => ({
    meta: [
      { title: "المتجر — عروض وتخفيضات الألعاب | GameHub" },
      {
        name: "description",
        content: "أقوى عروض وتخفيضات ألعاب PC مباشرة، بأسعار محوّلة إلى الريال السعودي داخل GameHub.",
      },
      { property: "og:title", content: "المتجر — عروض وتخفيضات الألعاب | GameHub" },
      { property: "og:description", content: "تصفّح الألعاب الرائجة وأقوى الخصومات بسعر الريال السعودي." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: StorePage,
});

function StorePage() {
  const { data: rates = FALLBACK_RATES } = useQuery({
    queryKey: ["fx-rates"],
    queryFn: getRates,
    staleTime: 1000 * 60 * 60,
  });

  const top = useQuery({ queryKey: ["deals-top"], queryFn: getTopDeals, staleTime: 1000 * 60 * 10 });
  const sales = useQuery({ queryKey: ["deals-sales"], queryFn: getSaleDeals, staleTime: 1000 * 60 * 10 });

  return (
    <div className="space-y-8">
      <SectionTitle title="المتجر" subtitle="عروض حيّة بالريال السعودي" />

      <section className="space-y-3">
        <h2 className="flex items-center gap-2 font-display text-lg font-black">
          <Flame className="size-4 text-primary" />
          الأكثر رواجًا
        </h2>
        {top.isLoading && <SkeletonGrid />}
        {top.isError && <ErrorBox />}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {top.data?.map((d) => <DealCard key={d.dealID} d={d} rates={rates} />)}
        </div>
      </section>

      <section className="space-y-3 border-t border-border pt-8">
        <h2 className="flex items-center gap-2 font-display text-lg font-black">
          <Tag className="size-4 text-primary" />
          التخفيضات
        </h2>
        {sales.isLoading && <SkeletonGrid />}
        {sales.isError && <ErrorBox />}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {sales.data?.map((d) => <DealCard key={d.dealID} d={d} rates={rates} discount />)}
        </div>
      </section>
    </div>
  );
}

function DealCard({
  d,
  rates,
  discount,
}: {
  d: Deal;
  rates: typeof FALLBACK_RATES;
  discount?: boolean;
}) {
  const off = Math.round(d.savings);
  return (
    <Link
      to="/store/$dealId"
      params={{ dealId: d.dealID }}
      className="group block overflow-hidden rounded-3xl border border-border bg-card surface-hover"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-secondary">
        <img
          src={d.thumb}
          alt={d.title}
          loading="lazy"
          className="size-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        {discount && off > 0 && (
          <span className="absolute left-2 top-2 rounded-full bg-primary/90 px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
            -{off}%
          </span>
        )}
        {!!d.metacriticScore && (
          <span className="absolute right-2 top-2 rounded-full bg-background/80 px-2 py-0.5 text-[10px] font-bold backdrop-blur">
            {d.metacriticScore}
          </span>
        )}
      </div>
      <div className="space-y-1 p-3">
        <p className="text-sm font-bold leading-snug break-words line-clamp-2">
          <bdi>{d.title}</bdi>
        </p>
        <div className="flex items-center gap-2">
          <span className="font-display text-sm font-black text-primary">
            {formatSar(d.salePrice, rates)}
          </span>
          {d.normalPrice > d.salePrice && (
            <span className="text-[11px] text-muted-foreground line-through">
              {formatSar(d.normalPrice, rates)}
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
        <div key={i} className="h-56 animate-pulse rounded-3xl bg-secondary/60" />
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

export { Loader2 };

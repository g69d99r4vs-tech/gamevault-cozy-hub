import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, Heart, Loader2, Star } from "lucide-react";
import { dealDetailsFn, ratesFn } from "@/lib/deals.functions";
import {
  FALLBACK_RATES,
  formatSar,
  decodeDealId,
  formatUah,
  type Rates,
  type StoreDealDetails,
} from "@/lib/deals";
import { Button } from "@/components/ui/button";
import { buzz } from "@/lib/haptics";
import { toast } from "sonner";

export const Route = createFileRoute("/store/$dealId")({
  head: () => ({
    meta: [
      { title: "تفاصيل العرض — متجر GameHub" },
      {
        name: "description",
        content: "تفاصيل اللعبة، الوصف، الصور، والسعر بالريال السعودي داخل متجر GameHub.",
      },
      { property: "og:title", content: "تفاصيل العرض — متجر GameHub" },
      {
        property: "og:description",
        content: "سعر اللعبة بعد الخصم محوّلًا من الهريفنيا الأوكرانية إلى الريال السعودي.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DealPage,
});

function DealPage() {
  const { dealId } = Route.useParams();
  const [fav, setFav] = useState(false);

  const getRates = useServerFn(ratesFn);
  const getDetails = useServerFn(dealDetailsFn);

  const { data: rates = FALLBACK_RATES } = useQuery<Rates>({
    queryKey: ["fx-rates"],
    queryFn: () => getRates(),
    staleTime: 1000 * 60 * 60,
  });

  const { data, isLoading, isError } = useQuery<StoreDealDetails>({
    queryKey: ["deal", dealId],
    queryFn: () => getDetails({ data: { dealID: decodeDealId(dealId) } }),
    staleTime: 1000 * 60 * 10,
  });

  if (isLoading)
    return (
      <div className="grid place-items-center py-24">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );

  if (isError || !data)
    return (
      <div className="space-y-4">
        <BackLink />
        <p className="rounded-3xl border border-border p-8 text-center text-sm text-muted-foreground">
          تعذّر تحميل تفاصيل العرض
        </p>
      </div>
    );

  const off =
    data.retailPriceUsd > data.salePriceUsd
      ? Math.round(
          ((data.retailPriceUsd - data.salePriceUsd) / data.retailPriceUsd) * 100,
        )
      : 0;

  const year = data.releaseDate
    ? new Date(data.releaseDate * 1000).getFullYear()
    : null;

  return (
    <div className="space-y-6">
      <BackLink />

      <div className="overflow-hidden rounded-3xl border border-border bg-card">
        <div className="relative aspect-[16/9] overflow-hidden bg-secondary">
          <img
            src={data.hero}
            alt={data.title}
            className="size-full object-cover"
            onError={(e) => {
              const img = e.currentTarget;
              if (data.thumb && img.src !== data.thumb) img.src = data.thumb;
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
          <h1 className="absolute inset-x-0 bottom-0 p-4 font-display text-2xl font-black leading-tight break-words">
            <bdi>{data.title}</bdi>
          </h1>
        </div>

        <div className="space-y-5 p-5">
          <div className="flex flex-wrap items-center gap-3">
            {off > 0 && (
              <span className="rounded-lg bg-primary px-2 py-1 text-xs font-black text-primary-foreground">
                -{off}%
              </span>
            )}
            <span className="font-display text-2xl font-black text-primary">
              {formatSar(data.salePriceUsd, rates)}
            </span>
            {off > 0 && (
              <span className="text-sm text-muted-foreground line-through">
                {formatSar(data.retailPriceUsd, rates)}
              </span>
            )}
            <span className="text-[11px] text-muted-foreground">
              (سعر المنطقة الأوكرانية {formatUah(data.salePriceUsd, rates)})
            </span>
          </div>

          {data.genres.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {data.genres.slice(0, 5).map((g) => (
                <span
                  key={g}
                  className="rounded-full bg-secondary/70 px-3 py-1 text-[11px] text-muted-foreground"
                >
                  <bdi>{g}</bdi>
                </span>
              ))}
            </div>
          )}

          {data.description && (
            <p className="text-sm leading-relaxed text-muted-foreground">
              <bdi>{data.description}</bdi>
            </p>
          )}

          <div className="grid grid-cols-2 gap-2 text-sm">
            <Info label="المطوّر" value={data.developer ?? "—"} />
            <Info label="الناشر" value={data.publisher ?? "—"} />
            <Info label="سنة الإصدار" value={year ? String(year) : "—"} />
            <Info
              label="ميتاكريتيك"
              value={data.metacriticScore ? String(data.metacriticScore) : "—"}
            />
            <Info
              label="تقييم Steam"
              value={
                data.steamRatingPercent ? `${data.steamRatingPercent}%` : "—"
              }
            />
            <Info
              label="أرخص سعر سابقًا"
              value={
                data.cheapestEverUsd
                  ? formatSar(data.cheapestEverUsd, rates)
                  : "—"
              }
            />
          </div>

          {data.screenshots.length > 0 && (
            <div className="-mx-5 flex snap-x gap-3 overflow-x-auto px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {data.screenshots.map((s) => (
                <img
                  key={s}
                  src={s}
                  alt={data.title}
                  loading="lazy"
                  className="h-36 shrink-0 snap-start rounded-2xl object-cover ring-1 ring-border"
                />
              ))}
            </div>
          )}

          <Button
            className="w-full rounded-2xl"
            variant={fav ? "secondary" : "default"}
            onClick={() => {
              buzz(20);
              setFav((v) => !v);
              toast.success(fav ? "أُزيلت من المفضلة" : "أُضيفت للمفضلة");
            }}
          >
            <Heart className={fav ? "size-4 fill-current" : "size-4"} />
            {fav ? "في المفضلة" : "إضافة للمفضلة"}
          </Button>

          {data.steamRatingText && (
            <p className="flex items-center justify-center gap-1 text-[11px] text-muted-foreground">
              <Star className="size-3 text-primary" />
              <bdi>{data.steamRatingText}</bdi>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function BackLink() {
  return (
    <Link
      to="/store"
      className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"
    >
      <ArrowRight className="size-4" />
      رجوع للمتجر
    </Link>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-secondary/50 p-3">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="truncate font-bold">
        <bdi>{value}</bdi>
      </p>
    </div>
  );
}

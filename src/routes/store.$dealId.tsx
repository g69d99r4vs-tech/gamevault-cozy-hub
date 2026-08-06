import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Heart, Loader2 } from "lucide-react";
import { getDealDetails, getRates, formatSar, FALLBACK_RATES } from "@/lib/deals";
import { Button } from "@/components/ui/button";
import { buzz } from "@/lib/haptics";
import { toast } from "sonner";

export const Route = createFileRoute("/store/$dealId")({
  head: () => ({
    meta: [
      { title: "تفاصيل العرض — متجر GameHub" },
      { name: "description", content: "تفاصيل عرض اللعبة والسعر بالريال السعودي داخل متجر GameHub." },
      { property: "og:title", content: "تفاصيل العرض — متجر GameHub" },
      { property: "og:description", content: "سعر اللعبة بعد الخصم محوّلًا إلى الريال السعودي." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DealPage,
});

function DealPage() {
  const { dealId } = Route.useParams();
  const [fav, setFav] = useState(false);

  const { data: rates = FALLBACK_RATES } = useQuery({
    queryKey: ["fx-rates"],
    queryFn: getRates,
    staleTime: 1000 * 60 * 60,
  });

  const { data, isLoading, isError } = useQuery({
    queryKey: ["deal", dealId],
    queryFn: () => getDealDetails(dealId),
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
      <p className="rounded-3xl border border-border p-8 text-center text-sm text-muted-foreground">
        تعذّر تحميل تفاصيل العرض
      </p>
    );

  const off =
    data.retailPrice > data.salePrice
      ? Math.round(((data.retailPrice - data.salePrice) / data.retailPrice) * 100)
      : 0;

  return (
    <div className="space-y-6">
      <Link
        to="/store"
        className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowRight className="size-4" />
        رجوع للمتجر
      </Link>

      <div className="overflow-hidden rounded-3xl border border-border bg-card">
        <div className="relative aspect-[16/7] overflow-hidden bg-secondary">
          {data.thumb && (
            <img src={data.thumb} alt={data.title} className="size-full object-cover blur-sm scale-110" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 flex items-end gap-4 p-4">
            {data.thumb && (
              <img
                src={data.thumb}
                alt={data.title}
                className="w-28 shrink-0 rounded-2xl ring-1 ring-primary/40"
              />
            )}
            <h1 className="font-display text-2xl font-black leading-tight break-words">
              <bdi>{data.title}</bdi>
            </h1>
          </div>
        </div>

        <div className="space-y-4 p-5">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-display text-2xl font-black text-primary">
              {formatSar(data.salePrice, rates)}
            </span>
            {off > 0 && (
              <>
                <span className="text-sm text-muted-foreground line-through">
                  {formatSar(data.retailPrice, rates)}
                </span>
                <span className="rounded-full bg-primary/90 px-2 py-0.5 text-[11px] font-bold text-primary-foreground">
                  -{off}%
                </span>
              </>
            )}
          </div>

          <p className="text-sm leading-relaxed text-muted-foreground">{data.description}</p>

          <div className="grid grid-cols-2 gap-2 text-sm">
            <Info label="الناشر" value={data.publisher ?? "—"} />
            <Info label="ميتاكريتيك" value={data.metacriticScore ? String(data.metacriticScore) : "—"} />
          </div>

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
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-secondary/50 p-3">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="truncate font-bold">{value}</p>
    </div>
  );
}

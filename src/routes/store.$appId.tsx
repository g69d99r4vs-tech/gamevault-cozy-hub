import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import { ArrowRight, CalendarPlus, ExternalLink, Heart, Loader2 } from "lucide-react";
import { steamDetailsFn } from "@/lib/steam.functions";
import { Button } from "@/components/ui/button";
import { useFavorites } from "@/lib/store-favorites";
import { buzz } from "@/lib/haptics";
import { cn } from "@/lib/utils";
import { safeImg } from "@/lib/img";
import { SmartImage } from "@/components/SmartImage";
import { useStore } from "@/lib/store";
import { gdate, safeUpcomingDate, isFuture } from "@/lib/dates";
import { toast } from "sonner";

export const Route = createFileRoute("/store/$appId")({
  head: () => ({
    meta: [
      { title: "تفاصيل اللعبة — متجر GameHub" },
      { name: "description", content: "تفاصيل لعبة من متجر ستيم بسعر محوّل إلى الريال السعودي." },
      { property: "og:title", content: "تفاصيل اللعبة — متجر GameHub" },
      { property: "og:description", content: "سعر بالريال السعودي، وصف، وإضافة للمفضلة." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: StoreGamePage,
});

const UAH_TO_SAR = 0.091;
const toSar = (cents: number) => Math.round((cents / 100) * UAH_TO_SAR);
const sarLabel = (
  cents: number,
  opts: { isFree?: boolean; comingSoon?: boolean } = {},
) => {
  if (cents > 0) return `${toSar(cents)} ريال`;
  if (opts.comingSoon) return "قريباً";
  return opts.isFree ? "مجانية" : "قريباً";
};

function StoreGamePage() {
  const { appId: raw } = Route.useParams();
  const appId = Number(raw);
  const favorites = useFavorites((s) => s.favorites);
  const toggleFavorite = useFavorites((s) => s.toggleFavorite);
  const isFav = favorites.some((f) => f.appId === appId);
  const addGame = useStore((s) => s.addGame);
  const entries = useStore((s) => s.users[s.currentUser].entries);
  const gameId = 900_000_000 + appId;
  const inPlan = entries.some((e) => e.id === gameId && e.status === "hype");

  const { data, isLoading } = useQuery({
    queryKey: ["steam-details", appId],
    queryFn: () => steamDetailsFn({ data: { appId } }),
  });

  const plannedRelease = safeUpcomingDate(data?.released ?? null);

  const image =
    data?.image ?? `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/header.jpg`;

  return (
    <div dir="rtl" className="relative -mt-2 space-y-6">
      {/* خلفية سينمائية */}
      <div className="pointer-events-none absolute inset-x-0 -top-24 h-[420px] overflow-hidden">
        <img src={safeImg(image)} alt="" aria-hidden className="size-full scale-110 object-cover opacity-25 blur-2xl" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/70 to-background" />
      </div>

      <div className="relative space-y-5">
        <Link
          to="/store"
          className="inline-flex items-center gap-1.5 rounded-2xl border border-border bg-card px-3 py-2 text-xs text-muted-foreground"
        >
          <ArrowRight className="size-3.5" /> رجوع للمتجر
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="overflow-hidden rounded-[2rem] border-2 border-yellow-500/25 bg-card shadow-[0_0_45px_-22px_rgba(234,179,8,0.9)]"
        >
          <SmartImage
            src={data?.image ?? image}
            name={data?.name ?? `App ${appId}`}
            alt={data?.name ?? "غلاف اللعبة"}
            className="aspect-[460/215] w-full object-cover"
          />
        </motion.div>

        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> جاري التحميل…
          </div>
        ) : (
          <div className="space-y-4">
            <h1 className="font-display text-3xl font-black leading-tight">{data?.name ?? "لعبة"}</h1>

            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-2xl bg-primary/12 px-4 py-2 font-display text-xl font-black text-primary">
                {sarLabel(data?.uahFinal ?? 0, {
                  isFree: data?.isFree,
                  comingSoon: data?.comingSoon,
                })}
              </span>
              {!!data?.discount && (
                <span className="rounded-xl bg-primary px-2 py-1 text-[11px] font-black text-primary-foreground">
                  -{data.discount}%
                </span>
              )}
              {!!data?.uahInitial && data.uahInitial > (data.uahFinal ?? 0) && (
                <span className="text-xs text-muted-foreground line-through">
                  {toSar(data.uahInitial)} ريال
                </span>
              )}
            </div>

            {!!data?.genres?.length && (
              <div className="flex flex-wrap gap-2">
                {data.genres.slice(0, 5).map((g) => (
                  <span key={g} className="rounded-full bg-secondary px-3 py-1 text-[11px] text-muted-foreground">
                    {g}
                  </span>
                ))}
              </div>
            )}

            {!!data?.released && (
              <p className="text-xs text-muted-foreground">تاريخ الإصدار: {gdate(data.released)}</p>
            )}

            {!!data?.developers?.length && (
              <p className="text-xs text-muted-foreground">المطوّر: {data.developers.join("، ")}</p>
            )}

            <p className="text-sm leading-relaxed text-muted-foreground">
              {data?.description || "لا يوجد وصف متاح لهذه اللعبة."}
            </p>

            <Button
              onClick={() => {
                buzz(30);
                addGame(
                  {
                    id: gameId,
                    slug: `steam-${appId}`,
                    name: data?.name ?? `App ${appId}`,
                    released: plannedRelease,
                    background_image: image,
                    rating: 0,
                    metacritic: null,
                    genres: (data?.genres ?? []).map((g, i) => ({ id: i, name: g, slug: g })),
                    developers: (data?.developers ?? []).map((n, i) => ({ id: i, name: n })),
                  },
                  "hype",
                );
                toast.success(
                  isFuture(data?.released)
                    ? "أُضيفت إلى الإصدارات المرتقبة"
                    : "أُضيفت بموعد تقديري (بعد 3 أشهر) — عدّله متى ما أُعلن",
                );
              }}
              disabled={inPlan}
              className="h-12 w-full rounded-2xl border border-yellow-300/70 bg-primary/15 font-display text-base font-black text-primary hover:bg-primary/25"
            >
              <CalendarPlus className="size-4" />
              {inPlan ? "في الإصدارات المرتقبة" : "إضافة للإصدارات المرتقبة"}
            </Button>

            <div className="grid gap-3 pt-2 sm:grid-cols-2">
              <Button
                onClick={() => {
                  buzz(30);
                  toggleFavorite({
                    appId,
                    name: data?.name ?? `App ${appId}`,
                    image,
                    uahFinal: data?.uahFinal ?? 0,
                    uahInitial: data?.uahInitial ?? 0,
                    discount: data?.discount ?? 0,
                  });
                }}
                variant={isFav ? "default" : "secondary"}
                className={cn(
                  "h-12 rounded-2xl font-display text-base font-black",
                  isFav && "border border-yellow-300/70 bg-primary text-primary-foreground",
                )}
              >
                <Heart className={cn("size-4", isFav && "fill-current")} />
                {isFav ? "في المفضلة" : "إضافة للمفضلة"}
              </Button>

              <Button
                onClick={() => {
                  buzz(30);
                  window.open(
                    `https://store.steampowered.com/app/${appId}`,
                    "_blank",
                    "noopener,noreferrer",
                  );
                }}
                className="h-12 rounded-2xl border border-yellow-300/70 bg-primary font-display text-base font-black text-primary-foreground shadow-[0_0_30px_-6px_rgba(234,179,8,0.85)] hover:bg-primary/90"
              >
                <ExternalLink className="size-4" /> انقلني للموقع
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import { useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { Search, Loader2, Plus } from "lucide-react";
import { useStore, type Status } from "@/lib/store";
import { buzz } from "@/lib/haptics";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/search")({
  validateSearch: (s: Record<string, unknown>) => ({ q: typeof s["q"] === "string" ? (s["q"] as string) : "" }),
  head: () => ({
    meta: [
      { title: "بحث الألعاب — Steam & GameHub" },
      {
        name: "description",
        content: "ابحث في ألعاب متجر ستيم وتتبعها مع الأسعار المباشرة.",
      },
      { property: "og:title", content: "بحث الألعاب — GameHub" },
      { property: "og:description", content: "نتائج بحث فورية من متجر ستيم بأسعارها." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SearchPage,
});

type SteamSearchResult = {
  id: number;
  name: string;
  thumb: string;
  headerImage: string;
  cheapest: string;
  normalPrice: string;
  savings: number;
  steamAppID: string;
};

const quickAdd: { status: Status; label: string }[] = [
  { status: "current", label: "قيد اللعب" },
  { status: "backlog", label: "الانتظار" },
  { status: "completed", label: "مكتملة" },
];

function SearchPage() {
  const { q } = Route.useSearch();
  const navigate = useNavigate();
  const [term, setTerm] = useState(q);
  const addGame = useStore((s) => s.addGame);

  const { data, isFetching } = useQuery({
    queryKey: ["search-full-steam", q],
    queryFn: async () => {
      if (!q || q.trim().length < 2) return [];
      try {
        const res = await fetch(`https://www.cheapshark.com/api/1.0/games?title=${encodeURIComponent(q)}&limit=30`);
        if (!res.ok) return [];
        const json = await res.json();
        if (!Array.isArray(json)) return [];

        return json
          .filter((item) => item.steamAppID)
          .map((item) => ({
            id: parseInt(item.steamAppID),
            name: item.external,
            thumb: item.thumb,
            headerImage: `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${item.steamAppID}/header.jpg`,
            cheapest: item.cheapest,
            normalPrice: item.normalPrice || item.cheapest,
            savings: item.savings ? Math.round(parseFloat(item.savings)) : 0,
            steamAppID: item.steamAppID,
          })) as SteamSearchResult[];
      } catch (err) {
        console.error("Full Search Error:", err);
        return [];
      }
    },
    enabled: q.trim().length >= 2,
    staleTime: 1000 * 60 * 10,
    placeholderData: keepPreviousData,
  });

  const add = (game: SteamSearchResult, status: Status) => {
    buzz(status === "completed" ? [40, 60, 40] : 20);
    addGame({
      id: game.id,
      name: game.name,
      background_image: game.headerImage,
      released: "Steam",
      genres: [],
      developers: [],
    } as any, status);
    toast.success(`أُضيفت ${game.name} إلى مكتبتك`);
  };

  return (
    <div className="space-y-6 pb-24">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          navigate({ to: "/search", search: { q: term.trim() } });
        }}
        className="flex items-center gap-2 rounded-2xl glass px-4 py-3"
      >
        <Search className="size-4 shrink-0 text-muted-foreground" />
        <input
          autoFocus
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="ابحث عن أي لعبة في ستيم..."
          className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
        {isFetching && <Loader2 className="size-4 animate-spin text-primary" />}
      </form>

      <div className="flex items-baseline justify-between">
        <h1 className="font-display text-2xl font-black">
          نتائج البحث {q && <bdi className="text-primary">«{q}»</bdi>}
        </h1>
        {data && <span className="text-xs text-muted-foreground">{data.length} لعبة</span>}
      </div>

      {q.trim().length < 2 && (
        <p className="rounded-3xl border border-border p-8 text-center text-sm text-muted-foreground">
          اكتب حرفين على الأقل لبدء البحث في متجر ستيم
        </p>
      )}

      {!data && q.trim().length >= 2 && (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-secondary/60" />
          ))}
        </div>
      )}

      {data?.length === 0 && !isFetching && (
        <p className="rounded-3xl border border-border p-8 text-center text-sm text-muted-foreground">
          لا توجد نتائج مطابقة في ستيم
        </p>
      )}

      {/* تصميم البطاقات العريضة (ستايل ستيم الاحترافي) */}
      <div className="space-y-3">
        {data?.map((game) => {
          const hasDiscount = game.savings > 0;
          return (
            <div
              key={game.id}
              className="group flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 glass p-3.5 rounded-2xl border border-white/5 hover:border-primary/30 transition-all"
            >
              {/* رابط يوديك لصفحة تفاصيل اللعبة */}
              <Link
                to="/game/$id"
                params={{ id: String(game.id) }}
                className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 flex-1 min-w-0"
              >
                {/* الصورة العريضة */}
                <div className="relative shrink-0 overflow-hidden rounded-xl bg-black/40">
                  <img
                    src={game.headerImage}
                    alt={game.name}
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.src = game.thumb;
                    }}
                    className="w-full sm:w-44 h-24 object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>

                {/* الاسم والسعر */}
                <div className="flex-1 min-w-0 space-y-1.5 text-right">
                  <h2 className="text-base font-bold text-foreground truncate">
                    {game.name}
                  </h2>

                  <div className="flex items-center gap-3 flex-wrap">
                    {hasDiscount ? (
                      <>
                        <span className="bg-emerald-500/20 text-emerald-400 font-bold text-xs px-2 py-1 rounded-lg">
                          -{game.savings}%
                        </span>
                        <span className="text-xs text-muted-foreground line-through">
                          ${game.normalPrice}
                        </span>
                        <span className="text-sm font-extrabold text-foreground">
                          ${game.cheapest}
                        </span>
                      </>
                    ) : (
                      <span className="text-sm font-extrabold text-foreground">
                        {game.cheapest && parseFloat(game.cheapest) > 0 ? `$${game.cheapest}` : "مجانية"}
                      </span>
                    )}
                    <span className="text-[10px] text-muted-foreground px-2 py-0.5 rounded bg-secondary/60">
                      Steam Store
                    </span>
                  </div>
                </div>
              </Link>

              {/* أزرار الإضافة السريعة */}
              <div className="flex items-center gap-1.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5 justify-end">
                {quickAdd.map((a) => (
                  <Button
                    key={a.status}
                    size="sm"
                    variant="secondary"
                    className="h-8 rounded-xl px-3 text-xs font-medium bg-secondary/80 hover:bg-primary hover:text-primary-foreground transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      add(game, a.status);
                    }}
                  >
                    <Plus className="size-3.5 ml-1" />
                    {a.label}
                  </Button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

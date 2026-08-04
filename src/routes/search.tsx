import { useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { Search, Loader2, Plus, X } from "lucide-react";
import { useStore, type Status } from "@/lib/store";
import { buzz } from "@/lib/haptics";
import { Button } from "@/components/ui/button";
import { GameEditDialog } from "@/components/GameEditDialog";

export const Route = createFileRoute("/search")({
  validateSearch: (s: Record<string, unknown>) => ({ q: typeof s["q"] === "string" ? (s["q"] as string) : "" }),
  head: () => ({
    meta: [
      { title: "بحث الألعاب -- Steam & GameHub" },
      {
        name: "description",
        content: "ابحث في ألعاب متجر ستيم وتتبعها مع الأسعار المباشرة.",
      },
      { property: "og:title", content: "بحث الألعاب -- GameHub" },
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
  
  // حالة التحكم في فتح نافذة التعديل والخصائص عند الضغط على زر الحالة
  const [selectedGameForEdit, setSelectedGameForEdit] = useState<{ game: any; initialStatus: Status } | null>(null);

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

  const handleOpenEdit = (game: SteamSearchResult, status: Status) => {
    buzz(20);
    // تجهيز اللعبة بالبيانات المتوافقة مع نظام الهيكل وتفعيل النافذة المنبثقة
    const formattedGame = {
      id: game.id,
      name: game.name,
      background_image: game.headerImage,
      released: "Steam",
      genres: [],
      developers: [],
    };
    setSelectedGameForEdit({ game: formattedGame, initialStatus: status });
  };

  return (
    <div className="space-y-6 pb-24">
      {/* صندوق البحث المربع (ستايل ستيم) */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          navigate({ to: "/search", search: { q: term.trim() } });
        }}
        className="flex items-center gap-2 bg-[#2a475e] p-2 rounded-md shadow-md border border-blue-500/30"
      >
        <button type="submit" className="text-muted-foreground hover:text-white p-1">
          <Search className="size-5 shrink-0" />
        </button>
        <input
          autoFocus
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="ابحث عن أي لعبة في ستيم..."
          className="w-full bg-[#171a21] text-white px-3 py-2 text-sm outline-none rounded border border-gray-700 focus:border-blue-500 placeholder:text-muted-foreground"
        />
        {term && (
          <button
            type="button"
            onClick={() => {
              setTerm("");
              navigate({ to: "/search", search: { q: "" } });
            }}
            className="text-gray-400 hover:text-white p-1"
          >
            <X className="size-5" />
          </button>
        )}
        {isFetching && <Loader2 className="size-5 animate-spin text-primary" />}
        <div className="bg-[#171a21] border border-gray-600 w-10 h-10 rounded flex items-center justify-center text-lg font-bold text-white shrink-0">
          ?
        </div>
      </form>

      <div className="flex items-baseline justify-between">
        <h1 className="font-display text-2xl font-black">
          نتائج البحث {q && <bdi className="text-primary">«{q}»</bdi>}
        </h1>
        {data && <span className="text-xs text-muted-foreground">{data.length} لعبة</span>}
      </div>

      {q.trim().length < 2 && (
        <p className="rounded-xl border border-border p-8 text-center text-sm text-muted-foreground">
          اكتب حرفين على الأقل لبدء البحث في متجر ستيم
        </p>
      )}

      {!data && q.trim().length >= 2 && (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-secondary/60" />
          ))}
        </div>
      )}

      {data?.length === 0 && !isFetching && (
        <p className="rounded-xl border border-border p-8 text-center text-sm text-muted-foreground">
          لا توجد نتائج مطابقة في ستيم
        </p>
      )}

      {/* تصميم البطاقات العريضة */}
      <div className="space-y-3">
        {data?.map((game) => {
          const hasDiscount = game.savings > 0;
          return (
            <div
              key={game.id}
              className="group flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 glass p-3.5 rounded-xl border border-white/5 hover:border-primary/30 transition-all"
            >
              <Link
                to="/game/$id"
                params={{ id: String(game.id) }}
                className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 flex-1 min-w-0"
              >
                <div className="relative shrink-0 overflow-hidden rounded-lg bg-black/40">
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

                <div className="flex-1 min-w-0 space-y-1.5 text-right">
                  <h2 className="text-base font-bold text-foreground truncate">
                    {game.name}
                  </h2>

                  <div className="flex items-center gap-3 flex-wrap">
                    {hasDiscount ? (
                      <>
                        <span className="bg-[#4c6b22] text-[#beee11] font-bold text-xs px-2 py-0.5 rounded">
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

              <div className="flex items-center gap-1.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5 justify-end">
                {quickAdd.map((a) => (
                  <Button
                    key={a.status}
                    size="sm"
                    variant="secondary"
                    className="h-8 rounded-lg px-3 text-xs font-medium bg-secondary/80 hover:bg-primary hover:text-primary-foreground transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenEdit(game, a.status);
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

      {/* نافذة التعديل المنبثقة تفتح تلقائياً عند الضغط على أي حالة */}
      {selectedGameForEdit && (
        <GameEditDialog
          game={selectedGameForEdit.game}
          initialStatus={selectedGameForEdit.initialStatus}
          open={!!selectedGameForEdit}
          onOpenChange={(open) => !open && setSelectedGameForEdit(null)}
        />
      )}
    </div>
  );
}

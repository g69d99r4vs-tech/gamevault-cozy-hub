import { useEffect, useRef, useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Search, Plus, Loader2 } from "lucide-react";
import { searchGames, isUnreleased, type RawgGame } from "@/lib/rawg";
import { useStore, type Status } from "@/lib/store";
import { buzz } from "@/lib/haptics";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { GameEditDialog } from "@/components/GameEditDialog";

// دمجنا نوع جديد عشان يستقبل السعر من ستيم
export type GameWithPrice = RawgGame & {
  steamPrice?: string | null;
  steamAppID?: string | null;
};

const quickAdd: { status: Status; label: string }[] = [
  { status: "current", label: "قيد اللعب" },
  { status: "backlog", label: "الانتظار" },
  { status: "hype", label: "المرتقبة" },
  { status: "completed", label: "مكتملة" },
];

export function SmartSearch() {
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const addGame = useStore((s) => s.addGame);
  const entry = useStore((s) =>
    editId ? (s.users[s.currentUser].entries.find((e) => e.id === editId) ?? null) : null,
  );

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q.trim()), 160);
    return () => clearTimeout(t);
  }, [q]);

  const { data, isFetching } = useQuery({
    queryKey: ["search", debounced],
    queryFn: async () => {
      // 1. نجيب الألعاب من مصدرها الأصلي عشان الصور والتفاصيل
      const games = await searchGames(debounced, 14);

      // 2. نجيب الأسعار من ستيم عبر وسيط لتفادي مشاكل الـ CORS
      try {
        const priceRes = await fetch(`https://www.cheapshark.com/api/1.0/games?title=${debounced}&limit=14`);
        const priceData = await priceRes.json();

        // 3. ندمج السعر مع اللعبة المطابقة
        return games.map((game) => {
          const matched = priceData.find((p: any) =>
            game.name.toLowerCase().includes(p.external.toLowerCase()) ||
            p.external.toLowerCase().includes(game.name.toLowerCase())
          );
          return {
            ...game,
            steamPrice: matched?.cheapest || null,
            steamAppID: matched?.steamAppID || null,
          } as GameWithPrice;
        });
      } catch (err) {
        return games as GameWithPrice[]; // في حال فشل جلب السعر، ترجع الألعاب طبيعي
      }
    },
    enabled: debounced.length >= 2,
    staleTime: 1000 * 60 * 10,
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const pick = (g: GameWithPrice) => {
    setOpen(false);
    setQ("");
    navigate({ to: "/game/$id", params: { id: String(g.id) } });
  };

  const submit = () => {
    const term = q.trim();
    if (term.length < 2) return;
    setOpen(false);
    navigate({ to: "/search", search: { q: term } });
  };

  const add = (g: GameWithPrice, status: Status) => {
    buzz(status === "completed" ? [40, 60, 40] : 20);
    addGame(g, status);
    setOpen(false);
    setQ("");
    if (status === "completed") setEditId(g.id);
    else toast.success(`أُضيفت ${g.name}`);
  };

  return (
    <div ref={boxRef} className="relative">
      {entry && (
        <GameEditDialog
          entry={entry}
          open={editId !== null}
          onOpenChange={(o) => !o && setEditId(null)}
        />
      )}
      <div className="flex items-center gap-2 rounded-2xl glass px-4 py-2.5">
        <Search className="size-4 shrink-0 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              submit();
            }
            if (e.key === "Escape") setOpen(false);
          }}
          enterKeyHint="search"
          type="search"
          placeholder="ابحث عن أي لعبة… اكتب حرفين فقط"
          className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground [&::-webkit-search-cancel-button]:hidden"
        />
        {isFetching && <Loader2 className="size-4 animate-spin text-primary" />}
      </div>

      {open && q.trim().length >= 2 && (
        <div className="absolute inset-x-0 top-full z-50 mt-2 max-h-[70vh] overflow-y-auto rounded-3xl glass p-2">
          {!data && (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-20 animate-pulse rounded-2xl bg-secondary/60" />
              ))}
            </div>
          )}
          {data?.length === 0 && (
            <p className="p-4 text-center text-sm text-muted-foreground">لا توجد نتائج</p>
          )}
          {data?.map((g) => (
            <div
              key={g.id}
              className="group flex cursor-pointer items-center gap-3 rounded-2xl p-2 transition-colors hover:bg-secondary/60"
              onClick={() => pick(g)}
            >
              <div className="relative shrink-0">
                <img
                  src={g.background_image ?? "/favicon.ico"}
                  alt={g.name}
                  loading="lazy"
                  className="size-16 rounded-xl object-cover"
                />
                {isUnreleased(g) && (
                  <span className="absolute -bottom-1 right-1 rounded-full bg-accent px-1.5 py-0.5 text-[9px] font-bold text-accent-foreground">
                    قريبًا
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1 space-y-0.5">
                <p className="text-sm font-semibold leading-snug break-words line-clamp-2">
                  <bdi>{g.name}</bdi>
                </p>
                <p className="text-xs text-muted-foreground line-clamp-1">
                  {isUnreleased(g) ? (g.released ?? "بلا تاريخ") : (g.released?.slice(0, 4) ?? "—")} ·{" "}
                  {(g.genres ?? []).map((x) => x.name).join("، ")}
                </p>
                
                {/* هنا تم إضافة السعر باللون الأخضر ليكون بارزاً */}
                {g.steamPrice && (
                  <p className="text-[12px] font-bold text-green-400 line-clamp-1">
                    السعر في ستيم: ${g.steamPrice}
                  </p>
                )}

                <p className="text-[11px] text-muted-foreground line-clamp-1">
                  {g.developers?.[0]?.name ?? ""}
                  {g.metacritic ? ` · ميتاكريتيك ${g.metacritic}` : ""}
                  {g.rating ? ` · ★ ${g.rating}` : ""}
                </p>
              </div>

              <div className="hidden shrink-0 gap-1 group-hover:flex md:flex">
                {(isUnreleased(g)
                  ? quickAdd.filter((a) => a.status === "hype")
                  : quickAdd.filter((a) => a.status !== "hype")
                ).map((a) => (
                  <Button
                    key={a.status}
                    size="sm"
                    variant="secondary"
                    className="h-7 rounded-lg px-2 text-[11px]"
                    onClick={(e) => {
                      e.stopPropagation();
                      add(g, a.status);
                    }}
                  >
                    <Plus className="size-3" />
                    {a.label}
                  </Button>
                ))}
              </div>
            </div>
          ))}
          {!!data?.length && (
            <button
              type="button"
              onClick={submit}
              className="mt-1 w-full rounded-2xl bg-primary/12 px-4 py-2.5 text-center text-sm font-bold text-primary transition-colors hover:bg-primary/20"
            >
              عرض كل النتائج لـ «{q.trim()}»
            </button>
          )}
        </div>
      )}
    </div>
  );
}

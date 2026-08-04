import { useEffect, useRef, useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Search, Plus, Loader2 } from "lucide-react";
import { useStore, type Status } from "@/lib/store";
import { buzz } from "@/lib/haptics";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { GameEditDialog } from "@/components/GameEditDialog";

export type SteamGame = {
  id: number;
  name: string;
  background_image: string;
  fallback_image: string;
  steamPrice: string;
  steamAppID: string;
};

const quickAdd: { status: Status; label: string }[] = [
  { status: "current", label: "قيد اللعب" },
  { status: "backlog", label: "الانتظار" },
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
    const t = setTimeout(() => setDebounced(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);

  const { data, isFetching } = useQuery({
    queryKey: ["steam-search-direct", debounced],
    queryFn: async () => {
      if (debounced.length < 2) return [];

      try {
        const res = await fetch(`https://www.cheapshark.com/api/1.0/games?title=${encodeURIComponent(debounced)}&limit=12`);
        if (!res.ok) return [];
        
        const json = await res.json();
        if (!Array.isArray(json)) return [];

        return json
          .filter((item) => item.steamAppID)
          .map((item) => ({
            id: parseInt(item.steamAppID),
            name: item.external,
            background_image: `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${item.steamAppID}/header.jpg`,
            fallback_image: item.thumb,
            steamPrice: item.cheapest,
            steamAppID: item.steamAppID,
          })) as SteamGame[];
      } catch (err) {
        console.error("Search Error:", err);
        return [];
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

  const pick = (g: SteamGame) => {
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

  const add = (g: SteamGame, status: Status) => {
    buzz(status === "completed" ? [40, 60, 40] : 20);
    addGame({ ...g, released: "Steam", genres: [], developers: [] } as any, status);
    setOpen(false);
    setQ("");
    if (status === "completed") setEditId(g.id);
    else toast.success(`أُضيفت ${g.name}`);
  };

  return (
    <div ref={boxRef} className="relative w-full">
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
          placeholder="ابحث عن أي لعبة في ستيم..."
          className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground [&::-webkit-search-cancel-button]:hidden"
        />
        {isFetching && <Loader2 className="size-4 animate-spin text-primary" />}
      </div>

      {open && q.trim().length >= 2 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[80vh] overflow-y-auto rounded-3xl glass p-3 shadow-2xl">
          {!data && isFetching && (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-16 animate-pulse rounded-2xl bg-secondary/60" />
              ))}
            </div>
          )}
          
          {data?.length === 0 && !isFetching && (
            <p className="p-4 text-center text-sm text-muted-foreground">لا توجد نتائج في ستيم</p>
          )}
          
          {data?.map((g) => (
            <div
              key={g.id}
              className="group flex cursor-pointer items-center justify-between gap-3 rounded-2xl p-3 transition-colors hover:bg-secondary/60 mb-1"
              onClick={() => pick(g)}
            >
              {/* 1. الصورة ثابتة على اليسار */}
              <div className="relative shrink-0">
                <img
                  src={g.background_image}
                  alt={g.name}
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.src = g.fallback_image;
                  }}
                  className="w-28 h-16 rounded-xl object-cover shadow-md" 
                />
              </div>

              {/* 2. اسم اللعبة والتفاصيل في الوسط تأخذ المساحة المتبقية بأمان تامة */}
              <div className="min-w-0 flex-1 space-y-1 text-right px-2">
                <p className="text-sm font-bold leading-snug truncate text-foreground">
                  {g.name}
                </p>
                
                <div className="flex items-center gap-1.5 justify-end">
                  <span className="text-[10px] text-muted-foreground">Steam ·</span>
                  {g.steamPrice ? (
                    <span className="text-xs font-bold text-green-400">
                      ${g.steamPrice}
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-muted-foreground">
                      مجانية
                    </span>
                  )}
                </div>
              </div>

              {/* 3. أزرار الإضافة السريعة */}
              <div className="hidden shrink-0 gap-1 group-hover:flex md:flex">
                {quickAdd.map((a) => (
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
        </div>
      )}
    </div>
  );
}

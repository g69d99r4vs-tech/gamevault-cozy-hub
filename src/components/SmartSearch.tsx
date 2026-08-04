import { useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { Search, Loader2, Plus, X } from "lucide-react";
import { searchGames, isUnreleased, type RawgGame } from "@/lib/rawg";
import { useStore, type Status } from "@/lib/store";
import { buzz } from "@/lib/haptics";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/search")({
  validateSearch: (s: Record<string, unknown>) => ({ q: typeof s["q"] === "string" ? (s["q"] as string) : "" }),
  head: () => ({
    meta: [
      { title: "بحث الألعاب -- GameHub" },
      {
        name: "description",
        content: "ابحث في آلاف ألعاب PC وبلايستيشن وإكس بوكس وسويتش وأضفها لمكتبتك فورًا.",
      },
      { property: "og:title", content: "بحث الألعاب -- GameHub" },
      { property: "og:description", content: "نتائج بحث فورية بأسلوب ستيم مع إضافة سريعة للمكتبة." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SearchPage,
});

const quickAdd: { status: Status; label: string }[] = [
  { status: "current", label: "قيد اللعب" },
  { status: "backlog", label: "الانتظار" },
  { status: "hype", label: "المرتقبة" },
  { status: "completed", label: "مكتملة" },
];

function SearchPage() {
  const { q } = Route.useSearch();
  const navigate = useNavigate();
  const [term, setTerm] = useState(q);
  const addGame = useStore((s) => s.addGame);

  const { data, isFetching } = useQuery({
    queryKey: ["search-full", q],
    queryFn: () => searchGames(q, 60),
    enabled: q.trim().length >= 2,
    staleTime: 1000 * 60 * 10,
    placeholderData: keepPreviousData,
  });

  const add = (g: RawgGame, status: Status) => {
    buzz(20);
    addGame(g, status);
    toast.success(`أُضيفت ${g.name}`);
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
          placeholder="ابحث عن أي لعبة…"
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
          اكتب حرفين على الأقل لبدء البحث
        </p>
      )}

      {!data && q.trim().length >= 2 && (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-secondary/60" />
          ))}
        </div>
      )}

      {data?.length === 0 && (
        <p className="rounded-xl border border-border p-8 text-center text-sm text-muted-foreground">
          لا توجد نتائج مطابقة
        </p>
      )}

      {/* تصميم البطاقات العريضة المربعة */}
      <div className="space-y-3">
        {data?.map((g) => {
          const soon = isUnreleased(g);
          const actions = soon
            ? quickAdd.filter((a) => a.status === "hype")
            : quickAdd.filter((a) => a.status !== "hype");
          return (
            <div
              key={g.id}
              className="group flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 glass p-3.5 rounded-xl border border-white/5 hover:border-primary/30 transition-all"
            >
              <Link
                to="/game/$id"
                params={{ id: String(g.id) }}
                className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 flex-1 min-w-0"
              >
                <div className="relative shrink-0 overflow-hidden rounded-lg bg-black/40">
                  {g.background_image ? (
                    <img
                      src={g.background_image}
                      alt={g.name}
                      loading="lazy"
                      className="w-full sm:w-44 h-24 object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full sm:w-44 h-24 bg-secondary" />
                  )}
                  <span className="absolute right-2 top-2 rounded bg-background/80 px-2 py-0.5 text-[10px] font-bold backdrop-blur text-white">
                    {soon ? "قريبًا" : (g.released?.slice(0, 4) ?? "--")}
                  </span>
                  {!!g.metacritic && (
                    <span className="absolute left-2 top-2 rounded bg-primary/90 px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
                      {g.metacritic}
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0 space-y-1.5 text-right">
                  <h2 className="text-base font-bold text-foreground truncate">
                    <bdi>{g.name}</bdi>
                  </h2>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {(g.genres ?? []).map((x) => x.name).join("، ") || "--"}
                  </p>
                </div>
              </Link>

              <div className="flex items-center gap-1.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5 justify-end flex-wrap">
                {actions.map((a) => (
                  <Button
                    key={a.status}
                    size="sm"
                    variant="secondary"
                    className="h-8 rounded-lg px-3 text-xs font-medium bg-secondary/80 hover:bg-primary hover:text-primary-foreground transition-colors"
                    onClick={() => add(g, a.status)}
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

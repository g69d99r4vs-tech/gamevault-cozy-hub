import { useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { Search, Loader2, Plus } from "lucide-react";
import { searchGames, isUnreleased, type RawgGame } from "@/lib/rawg";
import { useStore, type Status } from "@/lib/store";
import { buzz } from "@/lib/haptics";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";


export const Route = createFileRoute("/search")({
  validateSearch: (s: Record<string, unknown>) => ({ q: typeof s["q"] === "string" ? (s["q"] as string) : "" }),
  head: () => ({
    meta: [
      { title: "بحث الألعاب — GameHub" },
      {
        name: "description",
        content: "ابحث في آلاف ألعاب PC وبلايستيشن وإكس بوكس وسويتش وأضفها لمكتبتك فورًا.",
      },
      { property: "og:title", content: "بحث الألعاب — GameHub" },
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
    <div className="space-y-6">
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
          placeholder="ابحث عن أي لعبة…"
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
          اكتب حرفين على الأقل لبدء البحث
        </p>
      )}

      {!data && q.trim().length >= 2 && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-64 animate-pulse rounded-3xl bg-secondary/60" />
          ))}
        </div>
      )}

      {data?.length === 0 && (
        <p className="rounded-3xl border border-border p-8 text-center text-sm text-muted-foreground">
          لا توجد نتائج مطابقة
        </p>
      )}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {data?.map((g) => {
          const soon = isUnreleased(g);
          const actions = soon
            ? quickAdd.filter((a) => a.status === "hype")
            : quickAdd.filter((a) => a.status !== "hype");
          return (
            <div
              key={g.id}
              className="group overflow-hidden rounded-3xl border border-border bg-card surface-hover"
            >
              <Link to="/game/$id" params={{ id: String(g.id) }} className="block">
                <div className="relative aspect-[16/10] overflow-hidden">
                  {g.background_image ? (
                    <img
                      src={g.background_image}
                      alt={g.name}
                      loading="lazy"
                      className="size-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  ) : (
                    <div className="size-full bg-secondary" />
                  )}
                  <span className="absolute right-2 top-2 rounded-full bg-background/80 px-2 py-0.5 text-[10px] font-bold backdrop-blur">
                    {soon ? "قريبًا" : (g.released?.slice(0, 4) ?? "—")}
                  </span>
                  {!!g.metacritic && (
                    <span className="absolute left-2 top-2 rounded-full bg-primary/90 px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
                      {g.metacritic}
                    </span>
                  )}
                </div>
                <div className="space-y-1 p-3">
                  <p className="text-sm font-bold leading-snug break-words line-clamp-2">
                    <bdi>{g.name}</bdi>
                  </p>
                  <p className="text-[11px] text-muted-foreground line-clamp-1">
                    {(g.genres ?? []).map((x) => x.name).join("، ") || "—"}
                  </p>
                </div>
              </Link>
              <div className="flex flex-wrap gap-1 px-3 pb-3">
                {actions.map((a) => (
                  <Button
                    key={a.status}
                    size="sm"
                    variant="secondary"
                    className="h-7 rounded-lg px-2 text-[11px]"
                    onClick={() => add(g, a.status)}
                  >
                    <Plus className="size-3" />
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

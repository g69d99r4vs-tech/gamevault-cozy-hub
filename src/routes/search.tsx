import { useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { Search, Loader2, Plus, X } from "lucide-react";
import { searchGames, type RawgGame } from "@/lib/rawg";
import { useStore, type Status } from "@/lib/store";
import { buzz } from "@/lib/haptics";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/search")({
  validateSearch: (s: Record<string, unknown>) => ({
    q: typeof s["q"] === "string" ? (s["q"] as string) : "",
  }),
  head: () => ({
    meta: [
      { title: "بحث ألعاب ستيم -- GameHub" },
      {
        name: "description",
        content: "ابحث في متجر ستيم واعرف السعر الحالي لكل لعبة وأضفها لمكتبتك فورًا.",
      },
      { property: "og:title", content: "بحث ألعاب ستيم -- GameHub" },
      { property: "og:description", content: "نتائج بحث فورية من متجر ستيم مع الأسعار." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SearchPage,
});

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
    queryKey: ["steam-search", q],
    queryFn: () => searchGames(q, 40),
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
      <form
        onSubmit={(e) => {
          e.preventDefault();
          navigate({ to: "/search", search: { q: term.trim() } });
        }}
        className="flex items-center gap-2 rounded-2xl border border-border bg-secondary/60 p-2 backdrop-blur"
      >
        <button type="submit" className="p-1 text-muted-foreground hover:text-foreground">
          <Search className="size-5 shrink-0" />
        </button>
        <input
          autoFocus
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="ابحث عن أي لعبة في ستيم…"
          className="w-full bg-transparent px-2 py-2 text-sm outline-none placeholder:text-muted-foreground"
        />
        {term && (
          <button
            type="button"
            onClick={() => {
              setTerm("");
              navigate({ to: "/search", search: { q: "" } });
            }}
            className="p-1 text-muted-foreground hover:text-foreground"
          >
            <X className="size-5" />
          </button>
        )}
        {isFetching && <Loader2 className="size-5 animate-spin text-primary" />}
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

      <div className="space-y-3">
        {data?.map((g) => (
          <div
            key={g.id}
            className="group glass flex flex-col items-stretch justify-between gap-4 rounded-xl border border-white/5 p-3.5 transition-all hover:border-primary/30 sm:flex-row sm:items-center"
          >
            <Link
              to="/game/$id"
              params={{ id: String(g.id) }}
              className="flex min-w-0 flex-1 flex-col items-stretch gap-4 sm:flex-row sm:items-center"
            >
              <div className="relative shrink-0 overflow-hidden rounded-lg bg-black/40">
                <img
                  src={g.background_image ?? ""}
                  alt={g.name}
                  loading="lazy"
                  className="h-24 w-full object-cover transition-transform duration-300 group-hover:scale-105 sm:w-44"
                />
                {!!g.metacritic && (
                  <span className="absolute left-2 top-2 rounded bg-primary/90 px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
                    {g.metacritic}
                  </span>
                )}
              </div>

              <div className="min-w-0 flex-1 space-y-1.5 text-right">
                <h2 className="truncate text-base font-bold text-foreground">
                  <bdi>{g.name}</bdi>
                </h2>
                <p className="flex items-center gap-2 text-xs">
                  <span className="font-bold text-primary">{g.price ?? "غير متاح"}</span>
                  {!!g.discount && g.discount > 0 && (
                    <span className="rounded bg-primary/20 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                      -{g.discount}%
                    </span>
                  )}
                </p>
              </div>
            </Link>

            <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5 border-t border-white/5 pt-2 sm:border-t-0 sm:pt-0">
              {quickAdd.map((a) => (
                <Button
                  key={a.status}
                  size="sm"
                  variant="secondary"
                  className="h-8 rounded-lg bg-secondary/80 px-3 text-xs font-medium transition-colors hover:bg-primary hover:text-primary-foreground"
                  onClick={() => add(g, a.status)}
                >
                  <Plus className="ml-1 size-3.5" />
                  {a.label}
                </Button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

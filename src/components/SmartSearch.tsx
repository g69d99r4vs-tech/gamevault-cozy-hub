import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, Link } from "@tanstack/react-router";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { Search, Loader2, X } from "lucide-react";
import { searchGames } from "@/lib/rawg";

/** بحث فوري بأسلوب ستيم: صورة + اسم + السعر الحالي */
export function SmartSearch() {
  const navigate = useNavigate();
  const [term, setTerm] = useState("");
  const [debounced, setDebounced] = useState("");
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(term.trim()), 180);
    return () => clearTimeout(t);
  }, [term]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const { data, isFetching } = useQuery({
    queryKey: ["steam-suggest", debounced],
    queryFn: () => searchGames(debounced, 8),
    enabled: debounced.length >= 2,
    staleTime: 1000 * 60 * 5,
    placeholderData: keepPreviousData,
  });

  const results = useMemo(() => data ?? [], [data]);

  const go = () => {
    if (!term.trim()) return;
    setOpen(false);
    navigate({ to: "/search", search: { q: term.trim() } });
  };

  return (
    <div ref={box} className="relative">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          go();
        }}
        className="flex items-center gap-2 rounded-2xl border border-border bg-secondary/60 px-3 py-2 backdrop-blur"
      >
        <Search className="size-4 shrink-0 text-muted-foreground" />
        <input
          value={term}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setTerm(e.target.value);
            setOpen(true);
          }}
          placeholder="ابحث في متجر ستيم…"
          className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
        {isFetching && <Loader2 className="size-4 animate-spin text-primary" />}
        {term && (
          <button type="button" onClick={() => setTerm("")} className="text-muted-foreground">
            <X className="size-4" />
          </button>
        )}
      </form>

      {open && debounced.length >= 2 && (
        <div className="absolute inset-x-0 top-full z-50 mt-2 max-h-[70vh] overflow-y-auto rounded-2xl border border-border bg-card/95 p-1.5 shadow-2xl backdrop-blur">
          {results.length === 0 && !isFetching && (
            <p className="p-4 text-center text-xs text-muted-foreground">لا توجد نتائج</p>
          )}
          {results.map((g) => (
            <Link
              key={g.id}
              to="/game/$id"
              params={{ id: String(g.id) }}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-secondary/70"
            >
              <img
                src={g.background_image ?? ""}
                alt={g.name}
                loading="lazy"
                className="h-12 w-24 shrink-0 rounded-lg object-cover"
              />
              <span className="min-w-0 flex-1 text-right">
                <span className="block truncate text-sm font-bold">
                  <bdi>{g.name}</bdi>
                </span>
                <span className="block text-[11px] text-muted-foreground">
                  {g.price ?? "غير متاح"}
                  {!!g.discount && g.discount > 0 && (
                    <span className="mr-1 rounded bg-primary/20 px-1 text-primary">
                      -{g.discount}%
                    </span>
                  )}
                </span>
              </span>
            </Link>
          ))}
          {results.length > 0 && (
            <button
              onClick={go}
              className="mt-1 w-full rounded-xl bg-secondary/60 py-2 text-xs font-semibold text-primary"
            >
              عرض كل النتائج
            </button>
          )}
        </div>
      )}
    </div>
  );
}

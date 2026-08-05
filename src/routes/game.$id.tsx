import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useStore, type Status } from "@/lib/store";
import { GameEditDialog } from "@/components/GameEditDialog";
import { CelebrationModal, CompletionCard } from "@/components/CelebrationModal";
import { buzz } from "@/lib/haptics";
import { getGame, steamStoreUrl, type RawgGame } from "@/lib/rawg";
import { toast } from "sonner";
import { motion } from "motion/react";
import { ExternalLink, ArrowRight, Plus, Loader2, X } from "lucide-react";

export const Route = createFileRoute("/game/$id")({
  head: () => ({
    meta: [
      { title: "تفاصيل اللعبة -- GameHub" },
      { name: "description", content: "تفاصيل اللعبة من متجر ستيم: السعر والوصف والصور." },
      { property: "og:title", content: "تفاصيل اللعبة -- GameHub" },
      { property: "og:description", content: "بيانات مباشرة من متجر ستيم." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: GamePage,
});

const addOptions: { v: Status; l: string }[] = [
  { v: "current", l: "قيد اللعب" },
  { v: "completed", l: "مكتملة" },
  { v: "backlog", l: "الانتظار" },
  { v: "hype", l: "المرتقبة" },
];

function GamePage() {
  const { id } = Route.useParams();
  const addGame = useStore((s) => s.addGame);
  const [editing, setEditing] = useState(false);
  const [celebrated, setCelebrated] = useState<any | null>(null);
  const [shot, setShot] = useState<string | null>(null);

  const entry = useStore(
    (s) =>
      s.users[s.currentUser].entries.find((e) => String(e.id) === String(id) || e.slug === id) ??
      null,
  );

  const { data, isLoading } = useQuery({
    queryKey: ["steam-game", id, entry?.name],
    queryFn: () =>
      getGame(id, {
        ...(entry?.slug ? { slug: entry.slug } : {}),
        ...(entry?.name ? { name: entry.name } : {}),
      }),
    staleTime: 1000 * 60 * 30,
    retry: 1,
  });

  const game: RawgGame = data ?? {
    id: Number(id) || 0,
    slug: entry?.slug ?? String(id),
    name: entry?.name ?? `لعبة #${id}`,
    released: entry?.released ?? null,
    background_image:
      entry?.image ?? `https://cdn.cloudflare.steamstatic.com/steam/apps/${id}/header.jpg`,
    rating: 0,
    metacritic: entry?.metacritic ?? null,
    website: steamStoreUrl(id),
    genres: [],
    developers: [],
    short_screenshots: [],
  };

  const shots = game.short_screenshots ?? [];

  return (
    <div className="relative mx-auto max-w-4xl space-y-8 px-4 pb-24 pt-4">
      <CelebrationModal game={celebrated} onClose={() => setCelebrated(null)} />

      {/* زر الرجوع */}
      <div>
        <button
          onClick={() => window.history.back()}
          className="glass flex items-center gap-2 rounded-2xl px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowRight className="size-4" />
          <span>الرجوع</span>
        </button>
      </div>

      {/* خلفية ضبابية فخمة */}
      {game.background_image && (
        <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
          <img
            src={game.background_image}
            alt=""
            className="size-full scale-125 object-cover opacity-30 blur-3xl"
          />
          <div className="absolute inset-0 bg-background/80" />
        </div>
      )}

      {entry && (
        <GameEditDialog
          entry={entry}
          open={editing}
          onOpenChange={setEditing}
          onCompleted={(done) => setCelebrated(done)}
        />
      )}

      {/* قسم الهيدر */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative overflow-hidden rounded-[2rem] border border-border"
      >
        {game.background_image && (
          <img
            src={game.background_image}
            alt={game.name}
            className="absolute inset-0 size-full object-cover opacity-40"
          />
        )}
        <div className="relative space-y-4 bg-gradient-to-t from-card via-card/70 to-transparent p-6 pt-40 md:p-10 md:pt-56">
          <h1 className="font-display text-3xl font-black md:text-5xl">
            <bdi>{game.name}</bdi>
          </h1>

          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-primary/15 px-3 py-1 text-xs font-bold text-primary backdrop-blur">
              {isLoading ? "…" : (game.price ?? "Steam Store")}
            </span>
            {!!game.discount && game.discount > 0 && (
              <span className="rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground">
                -{game.discount}%
              </span>
            )}
            {game.released && (
              <span className="rounded-full bg-secondary/80 px-3 py-1 text-xs font-semibold text-muted-foreground backdrop-blur">
                {game.released.slice(0, 4)}
              </span>
            )}
            {!!game.metacritic && (
              <span className="rounded-full bg-secondary/80 px-3 py-1 text-xs font-semibold text-muted-foreground backdrop-blur">
                Metacritic {game.metacritic}
              </span>
            )}
            {(game.genres ?? []).slice(0, 3).map((g) => (
              <span
                key={g.name}
                className="rounded-full bg-secondary/80 px-3 py-1 text-xs font-semibold text-muted-foreground backdrop-blur"
              >
                {g.name}
              </span>
            ))}
          </div>

          {/* أزرار التتبع */}
          <div className="flex flex-wrap gap-2 pt-2">
            {addOptions.map((o) => (
              <Button
                key={o.v}
                size="sm"
                variant="secondary"
                className="rounded-xl bg-secondary/90 transition-colors hover:bg-primary hover:text-primary-foreground"
                onClick={() => {
                  buzz(o.v === "completed" ? [40, 60, 40] : 20);
                  addGame(game, o.v);
                  if (o.v === "completed") setEditing(true);
                  else toast.success(`أُضيفت إلى ${o.l}`);
                }}
              >
                <Plus className="ml-1 size-3.5" />
                {o.l}
              </Button>
            ))}
            {entry && (
              <Button size="sm" className="rounded-xl" onClick={() => setEditing(true)}>
                تعديل التتبع
              </Button>
            )}
            <a
              href={game.website ?? steamStoreUrl(game.id)}
              target="_blank"
              rel="noreferrer"
            >
              <Button size="sm" variant="ghost" className="glass rounded-xl">
                <ExternalLink className="ml-1 size-3.5" /> الموقع الرسمي
              </Button>
            </a>
          </div>
        </div>
      </motion.section>

      {isLoading && (
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> جارٍ جلب البيانات من ستيم…
        </div>
      )}

      {/* الوصف */}
      {game.description_raw && (
        <section className="rounded-3xl border border-border bg-card p-6">
          <h2 className="mb-2 font-display text-lg font-bold">نبذة</h2>
          <p className="whitespace-pre-line text-sm leading-7 text-muted-foreground">
            {game.description_raw}
          </p>
        </section>
      )}

      {/* معرض الصور */}
      {shots.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-display text-lg font-bold">صور من اللعبة</h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {shots.slice(0, 12).map((s) => (
              <button
                key={s.id}
                onClick={() => setShot(s.image)}
                className="overflow-hidden rounded-2xl border border-border"
              >
                <img
                  src={s.image}
                  alt={game.name}
                  loading="lazy"
                  className="h-28 w-full object-cover transition-transform duration-300 hover:scale-105 md:h-32"
                />
              </button>
            ))}
          </div>
        </section>
      )}

      {shot && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4"
          onClick={() => setShot(null)}
        >
          <button className="absolute left-4 top-4 text-white" onClick={() => setShot(null)}>
            <X className="size-6" />
          </button>
          <img src={shot} alt="" className="max-h-full max-w-full rounded-2xl object-contain" />
        </div>
      )}

      {/* بطاقة الختم */}
      {entry?.status === "completed" && (
        <section className="rounded-3xl border border-border bg-card p-6">
          <h2 className="mb-3 font-display text-lg font-bold">بطاقة الختم</h2>
          <CompletionCard game={entry} />
        </section>
      )}

      {/* ملاحظات ومراجعات */}
      {entry && (entry.review || entry.notes) && (
        <section className="rounded-3xl border border-border bg-card p-6">
          <h2 className="mb-2 font-display text-lg font-bold">ملاحظاتك</h2>
          {entry.review && <p className="text-sm leading-7">{entry.review}</p>}
          {entry.notes && (
            <p className="mt-2 whitespace-pre-line text-sm leading-7 text-muted-foreground">
              {entry.notes}
            </p>
          )}
        </section>
      )}
    </div>
  );
}

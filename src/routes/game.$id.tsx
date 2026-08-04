import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getGame, getScreenshots, getSimilar } from "@/lib/rawg";
import { gregorian, hijri } from "@/lib/dates";
import { Button } from "@/components/ui/button";
import { useStore, type GameEntry, type Status } from "@/lib/store";
import { GameEditDialog } from "@/components/GameEditDialog";
import { CelebrationModal, CompletionCard } from "@/components/CelebrationModal";
import { buzz } from "@/lib/haptics";
import { toast } from "sonner";
import { Countdown } from "@/components/Countdown";
import { motion } from "motion/react";
import { ExternalLink } from "lucide-react";
import { Lightbox } from "@/components/Lightbox";

export const Route = createFileRoute("/game/$id")({
  head: () => ({
    meta: [
      { title: "تفاصيل اللعبة — GameHub" },
      { name: "description", content: "صفحة تفاصيل غنية: القصة، الصور، التقييمات والتاريخ الهجري." },
      { property: "og:title", content: "تفاصيل اللعبة — GameHub" },
      { property: "og:description", content: "كل معلومات اللعبة في صفحة واحدة." },
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
  const [celebrated, setCelebrated] = useState<GameEntry | null>(null);
  const [shotIndex, setShotIndex] = useState<number | null>(null);
  const entry = useStore(
    (s) => s.users[s.currentUser].entries.find((e) => e.id === Number(id)) ?? null,
  );

  const { data: game, isLoading } = useQuery({
    queryKey: ["game", id, entry?.slug ?? null],
    queryFn: () =>
      getGame(id, {
        ...(entry?.slug ? { slug: entry.slug } : {}),
        ...(entry?.name ? { name: entry.name } : {}),
      }),
    retry: false,
    staleTime: 1000 * 60 * 60,
  });
  const resolvedId = game?.id ?? Number(id);
  const { data: shots } = useQuery({
    queryKey: ["shots", resolvedId],
    queryFn: () => getScreenshots(resolvedId),
    enabled: !!game,
    staleTime: 1000 * 60 * 60,
  });
  const { data: similar } = useQuery({
    queryKey: ["similar", resolvedId],
    queryFn: () => getSimilar(resolvedId),
    enabled: !!game,
    staleTime: 1000 * 60 * 60,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-72 animate-pulse rounded-[2rem] bg-card/70" />
        <div className="h-40 animate-pulse rounded-3xl bg-card/70" />
      </div>
    );
  }

  if (!game) {
    return (
      <div className="space-y-4 rounded-3xl border border-border bg-card p-8 text-center">
        <p className="font-display text-xl font-black">
          <bdi>{entry?.name ?? "اللعبة"}</bdi>
        </p>
        <p className="text-sm text-muted-foreground">
          تعذر جلب تفاصيل هذه اللعبة من قاعدة البيانات. جرّب البحث عنها بالاسم وإضافتها من جديد.
        </p>
        <Button asChild className="rounded-xl">
          <Link to="/search" search={{ q: entry?.name ?? "" }}>
            ابحث عنها
          </Link>
        </Button>
      </div>
    );
  }

  const upcoming = game.released && new Date(game.released).getTime() > Date.now();

  return (
    <div className="relative space-y-8">
      <CelebrationModal game={celebrated} onClose={() => setCelebrated(null)} />

      {/* dynamic blurred backdrop (PS5 / Apple Music style) */}
      {game.background_image && (
        <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
          <img
            src={game.background_image}
            alt=""
            className="size-full scale-125 object-cover blur-3xl"
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

      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative overflow-hidden rounded-[2rem] border border-border"
      >
        {game.background_image && (
          <img
            src={game.background_image}
            alt={game.name}
            className="absolute inset-0 size-full object-cover opacity-35"
          />
        )}
        <div className="relative bg-gradient-to-t from-card via-card/70 to-transparent p-6 pt-40 md:p-10 md:pt-56">
          <h1 className="font-display text-3xl font-black md:text-5xl">{game.name}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {(game.genres ?? []).map((g) => (
              <span
                key={g.id}
                className="rounded-full bg-secondary/70 px-2.5 py-1 text-[11px] font-semibold text-muted-foreground"
              >
                {g.name}
              </span>
            ))}
            {game.metacritic && (
              <span className="rounded-full bg-primary/15 px-2.5 py-1 text-[11px] font-bold text-primary">
                ميتاكريتيك {game.metacritic}
              </span>
            )}
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {gregorian(game.released)} · {hijri(game.released)}
          </p>
          {upcoming && (
            <div className="mt-4">
              <Countdown target={game.released} />
            </div>
          )}
          <div className="mt-5 flex flex-wrap gap-2">
            {(upcoming ? addOptions.filter((o) => o.v === "hype") : addOptions.filter((o) => o.v !== "hype")).map((o) => (
              <Button
                key={o.v}
                size="sm"
                variant="secondary"
                className="rounded-xl"
                onClick={() => {
                  buzz(o.v === "completed" ? [40, 60, 40] : 20);
                  addGame(game, o.v);
                  if (o.v === "completed") setEditing(true);
                  else toast.success(`أُضيفت إلى ${o.l}`);
                }}
              >
                {o.l}
              </Button>
            ))}
            {entry && (
              <Button size="sm" className="rounded-xl" onClick={() => setEditing(true)}>
                تعديل التتبع
              </Button>
            )}
            {game.website && (
              <a href={game.website} target="_blank" rel="noreferrer">
                <Button size="sm" variant="ghost" className="rounded-xl">
                  <ExternalLink className="size-3.5" /> الموقع الرسمي
                </Button>
              </a>
            )}
          </div>
        </div>
      </motion.section>

      {entry?.status === "completed" && (
        <section className="rounded-3xl border border-border bg-card p-6">
          <h2 className="mb-3 font-display text-lg font-bold">بطاقة الختم</h2>
          <CompletionCard game={entry} />
        </section>
      )}

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


      {!!shots?.length && (
        <section>
          <h2 className="mb-3 font-display text-lg font-bold">الصور</h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {shots.map((s, i) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setShotIndex(i)}
                className="overflow-hidden rounded-2xl surface-hover"
                aria-label="عرض الصورة بملء الشاشة"
              >
                <img
                  src={s.image}
                  alt={game.name}
                  loading="lazy"
                  className="aspect-video w-full object-cover"
                />
              </button>
            ))}
          </div>
          <Lightbox
            images={shots.map((s) => s.image)}
            index={shotIndex}
            alt={game.name}
            onIndexChange={setShotIndex}
            onClose={() => setShotIndex(null)}
          />
        </section>
      )}


      {!!similar?.length && (
        <section>
          <h2 className="mb-3 font-display text-lg font-bold">ألعاب مشابهة</h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {similar.map((g) => (
              <Link
                key={g.id}
                to="/game/$id"
                params={{ id: String(g.id) }}
                className="overflow-hidden rounded-2xl border border-border bg-card surface-hover"
              >
                {g.background_image && (
                  <img
                    src={g.background_image}
                    alt={g.name}
                    loading="lazy"
                    className="aspect-video w-full object-cover"
                  />
                )}
                <p className="truncate p-3 text-xs font-bold">{g.name}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

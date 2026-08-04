import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useStore, type Status } from "@/lib/store";
import { GameEditDialog } from "@/components/GameEditDialog";
import { CelebrationModal, CompletionCard } from "@/components/CelebrationModal";
import { buzz } from "@/lib/haptics";
import { toast } from "sonner";
import { motion } from "motion/react";
import { ExternalLink, ArrowRight, Plus, Loader2 } from "lucide-react";

export const Route = createFileRoute("/game/$id")({
  head: () => ({
    meta: [
      { title: "تفاصيل اللعبة -- GameHub" },
      { name: "description", content: "صفحة تفاصيل اللعبة مع الأسعار الفورية." },
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
  const [gameDetails, setGameDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // البحث عن اللعبة في المكتبة المحفوظة للمستخدم أولاً
  const entry = useStore(
    (s) => s.users[s.currentUser].entries.find((e) => String(e.id) === String(id) || e.slug === id) ?? null,
  );

  // جلب تفاصيل اللعبة والأسعار من CheapShark/Steam مباشرة إذا لم تكن موجودة في المكتبة
  useEffect(() => {
    async function fetchSteamGame() {
      if (entry) {
        setGameDetails({
          id: entry.id,
          name: entry.name,
          background_image: entry.background_image || `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${id}/header.jpg`,
          released: entry.released || "Steam",
          website: `https://store.steampowered.com/app/${id}`,
          cheapest: null,
          normalPrice: null,
          savings: 0,
        });
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // محاولة البحث بالـ AppID مباشرة أو عبر اسم الـ ID إذا كان نصاً
        const res = await fetch(`https://www.cheapshark.com/api/1.0/games?steamAppID=${id}`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.info) {
            setGameDetails({
              id: Number(id),
              name: data.info.name || `لعبة #${id}`,
              background_image: data.info.thumb || `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${id}/header.jpg`,
              released: "Steam",
              website: `https://store.steampowered.com/app/${id}`,
              cheapest: data.cheapest,
              normalPrice: data.deals?.[0]?.retailPrice || data.cheapest,
              savings: data.deals?.[0]?.savings ? Math.round(parseFloat(data.deals[0].savings)) : 0,
            });
            setLoading(false);
            return;
          }
        }
      } catch (e) {
        console.error("Error fetching game info:", e);
      }

      // Fallback افتراضي في حال فشل جلب البيانات الفورية
      setGameDetails({
        id: Number(id) || id,
        name: typeof id === 'string' && isNaN(Number(id)) ? id.replace(/-/g, ' ').toUpperCase() : `لعبة رقم #${id}`,
        background_image: `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${id}/header.jpg`,
        released: "Steam",
        website: `https://store.steampowered.com/app/${id}`,
        cheapest: null,
        normalPrice: null,
        savings: 0,
      });
      setLoading(false);
    }

    fetchSteamGame();
  }, [id, entry]);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  const game = gameDetails || {};

  return (
    <div className="relative space-y-8 pb-24 max-w-4xl mx-auto px-4 pt-4">
      <CelebrationModal game={celebrated} onClose={() => setCelebrated(null)} />

      {/* زر الرجوع */}
      <div>
        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors glass px-4 py-2 rounded-2xl"
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
            className="size-full scale-125 object-cover blur-3xl opacity-30"
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
        <img
          src={game.background_image}
          alt={game.name}
          className="absolute inset-0 size-full object-cover opacity-40"
        />
        <div className="relative bg-gradient-to-t from-card via-card/70 to-transparent p-6 pt-40 md:p-10 md:pt-56 space-y-4">
          <h1 className="font-display text-3xl font-black md:text-5xl">{game.name}</h1>
          
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-secondary/80 px-3 py-1 text-xs font-semibold text-muted-foreground backdrop-blur">
              Steam Store
            </span>
            {game.cheapest && (
              <div className="flex items-center gap-2 bg-[#171a21]/80 px-3 py-1 rounded-full border border-white/10 backdrop-blur">
                {game.savings > 0 && (
                  <span className="bg-[#4c6b22] text-[#beee11] font-bold text-xs px-1.5 py-0.2 rounded">
                    -{game.savings}%
                  </span>
                )}
                <span className="text-sm font-extrabold text-white">${game.cheapest}</span>
              </div>
            )}
          </div>

          {/* أزرار التتبع */}
          <div className="flex flex-wrap gap-2 pt-2">
            {addOptions.map((o) => (
              <Button
                key={o.v}
                size="sm"
                variant="secondary"
                className="rounded-xl bg-secondary/90 hover:bg-primary hover:text-primary-foreground transition-colors"
                onClick={() => {
                  buzz(o.v === "completed" ? [40, 60, 40] : 20);
                  addGame({
                    id: game.id,
                    name: game.name,
                    background_image: game.background_image,
                    released: "Steam",
                    genres: [],
                    developers: [],
                  } as any, o.v);
                  if (o.v === "completed") setEditing(true);
                  else toast.success(`أُضيفت إلى ${o.l}`);
                }}
              >
                <Plus className="size-3.5 ml-1" />
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
                <Button size="sm" variant="ghost" className="rounded-xl glass">
                  <ExternalLink className="size-3.5 ml-1" /> متجر Steam
                </Button>
              </a>
            )}
          </div>
        </div>
      </motion.section>

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

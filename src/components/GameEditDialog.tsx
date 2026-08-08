import { useEffect, useMemo, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Star } from "lucide-react";
import { DIFFICULTIES, isFutureRelease, useStore, type GameEntry, type Status } from "@/lib/store";
import { buzz } from "@/lib/haptics";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { ReactNode } from "react";

const allStatuses: { v: Status; l: string }[] = [
  { v: "current", l: "قيد اللعب" },
  { v: "backlog", l: "ناوي أختمها" },
  { v: "completed", l: "تم الختم" },
];

/** تقييم مرئي من 10 نجوم */
function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex flex-row-reverse justify-end gap-1">
      {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
        <button
          key={n}
          type="button"
          aria-label={`${n} من 10`}
          onClick={() => {
            buzz(20);
            onChange(n === value ? 0 : n);
          }}
        >
          <Star
            className={cn(
              "size-5 transition-colors",
              n <= value ? "fill-primary text-primary" : "text-muted-foreground/40",
            )}
          />
        </button>
      ))}
    </div>
  );
}

/** أزرار جلسات سريعة — بدون حقول يدوية */
const QUICK = [30, 60, 120, 180];

export function SessionBox({
  entryId,
  onDone,
  onComplete,
}: {
  entryId: number;
  onDone?: () => void;
  onComplete?: () => void;
}) {
  const addSession = useStore((s) => s.addSession);

  const log = (minutes: number) => {
    buzz(50);
    const now = new Date();
    const end = now.toTimeString().slice(0, 5);
    const startDate = new Date(now.getTime() - minutes * 60000);
    addSession(entryId, {
      date: now.toISOString().slice(0, 10),
      start: startDate.toTimeString().slice(0, 5),
      end,
      minutes,
    });
    toast.success("أُضيفت الجلسة إلى ساعاتك");
    onDone?.();
  };

  return (
    <div className="space-y-4 rounded-3xl border border-primary/25 bg-secondary/50 p-4">
      <Label className="text-sm font-bold">⏱️ تسجيل جلسة سريعة</Label>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {QUICK.map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => log(m)}
            className="h-14 rounded-2xl border-2 border-primary/50 bg-background/60 font-display text-base font-black text-primary transition-all hover:bg-primary hover:text-primary-foreground active:scale-95"
          >
            {m < 60 ? `${m} د` : `${m / 60} س`}
          </button>
        ))}
      </div>
      {onComplete && (
        <button
          type="button"
          onClick={() => {
            buzz([40, 60, 40]);
            onComplete();
          }}
          className="h-14 w-full rounded-2xl border-2 border-primary/70 bg-transparent font-display text-base font-black text-primary shadow-[0_0_30px_-14px_color-mix(in_oklab,var(--primary)_70%,transparent)] transition-all hover:bg-primary hover:text-primary-foreground active:scale-95"
        >
          تم الختم 🏆
        </button>
      )}
    </div>
  );
}

/** ورقة سفلية لتسجيل جلسة سريعة من الرئيسية */
export function LogSessionSheet({ entry, trigger }: { entry: GameEntry; trigger: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState(false);
  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>{trigger}</SheetTrigger>
        <SheetContent side="bottom" dir="rtl" className="rounded-t-3xl pb-10">
          <SheetHeader>
            <SheetTitle className="text-right font-display">تسجيل جلسة — {entry.name}</SheetTitle>
          </SheetHeader>
          <div className="p-4">
            <SessionBox
              entryId={entry.id}
              onDone={() => setOpen(false)}
              onComplete={() => {
                setOpen(false);
                setEdit(true);
              }}
            />
          </div>
        </SheetContent>
      </Sheet>
      <GameEditDialog entry={entry} open={edit} onOpenChange={setEdit} initialStatus="completed" />
    </>
  );
}

export function GameEditDialog({
  entry,
  trigger,
  onCompleted,
  open: openProp,
  onOpenChange,
  initialStatus,
}: {
  entry: GameEntry;
  trigger?: ReactNode;
  onCompleted?: (e: GameEntry) => void;
  open?: boolean;
  onOpenChange?: (o: boolean) => void;
  initialStatus?: Status;
}) {
  const [openState, setOpenState] = useState(false);
  const controlled = openProp !== undefined;
  const open = controlled ? openProp : openState;
  const setOpen = (o: boolean) => {
    if (!controlled) setOpenState(o);
    onOpenChange?.(o);
  };

  const [draft, setDraft] = useState(entry);
  const updateGame = useStore((s) => s.updateGame);
  const completeGame = useStore((s) => s.completeGame);
  const removeGame = useStore((s) => s.removeGame);

  useEffect(() => {
    if (open) setDraft(initialStatus ? { ...entry, status: initialStatus } : entry);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, entry.id, initialStatus]);


  const set = <K extends keyof GameEntry>(k: K, v: GameEntry[K]) =>
    setDraft((d) => ({ ...d, [k]: v }));

  const unreleased = isFutureRelease(entry.released);
  const statuses = unreleased ? [{ v: "hype" as Status, l: "المرتقبة" }] : allStatuses;
  const isCompleted = draft.status === "completed";
  const isPlaying = draft.status === "current";
  const planOnly = !isCompleted && !isPlaying; // مرتقبة / انتظار / التالي

  const normalized = (): GameEntry => ({
    ...draft,
    status: unreleased ? "hype" : draft.status,
    fullCompletion: isCompleted ? draft.fullCompletion : false,
    progress: isCompleted ? 100 : draft.progress,
    completedAt: isCompleted ? (draft.completedAt ?? new Date().toISOString()) : null,
  });

  const finish = () => {
    buzz([40, 60, 40]);
    const payload = { ...normalized(), status: "completed" as Status };
    completeGame(entry.id, payload);
    setOpen(false);
    onCompleted?.({ ...entry, ...payload, completedAt: payload.completedAt ?? new Date().toISOString() });
  };

  const save = () => {
    // اختيار «مكتملة» يفتح بطاقة الختم مباشرة
    if (isCompleted && entry.status !== "completed") {
      finish();
      return;
    }
    buzz(50);
    updateGame(entry.id, normalized());
    toast.success("تم الحفظ");
    setOpen(false);
  };


  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {trigger && <SheetTrigger asChild>{trigger}</SheetTrigger>}
      <SheetContent
        side="bottom"
        dir="rtl"
        className="max-h-[92vh] overflow-y-auto rounded-t-3xl pb-10"
      >
        <SheetHeader>
          <SheetTitle className="text-right font-display">{entry.name}</SheetTitle>
        </SheetHeader>

        <div className="space-y-4 p-4">
          {unreleased && (
            <p className="rounded-2xl bg-secondary/50 px-4 py-3 text-xs text-muted-foreground">
              لم تصدر بعد — يمكن إضافتها إلى «المرتقبة» فقط.
            </p>
          )}
          <div className="grid grid-cols-3 gap-2">
            {statuses.map((s) => (
              <Button
                key={s.v}
                variant={draft.status === s.v ? "default" : "secondary"}
                size="sm"
                className="h-11 rounded-2xl whitespace-nowrap text-xs"
                onClick={() => {
                  buzz(20);
                  set("status", s.v);
                }}
              >
                {s.l}
              </Button>
            ))}
          </div>

          {/* قيد اللعب: جلسات فقط */}
          {isPlaying && <SessionBox entryId={entry.id} />}

          {/* مكتملة: التتبع الكامل */}
          {isCompleted && (
            <>
              <div>
                <Label className="mb-1 block text-xs">إجمالي الساعات</Label>
                <div className="flex items-center gap-2">
                  <Button
                    size="icon"
                    variant="secondary"
                    onClick={() => set("hours", Math.max(0, draft.hours - 1))}
                  >
                    −
                  </Button>
                  <Input
                    type="number"
                    className="text-center"
                    value={draft.hours}
                    onChange={(e) => set("hours", Number(e.target.value))}
                  />
                  <Button
                    size="icon"
                    variant="secondary"
                    onClick={() => {
                      buzz(20);
                      set("hours", draft.hours + 1);
                    }}
                  >
                    +
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="block text-xs">تقييمك: {draft.personalRating}/10</Label>
                <StarRating value={draft.personalRating} onChange={(v) => set("personalRating", v)} />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center justify-between rounded-2xl bg-secondary/50 px-4 py-3">
                  <Label className="text-xs">تنصح بها؟</Label>
                  <Switch
                    checked={draft.recommend}
                    onCheckedChange={(v) => {
                      buzz(20);
                      set("recommend", v);
                    }}
                  />
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-secondary/50 px-4 py-3">
                  <Label className="text-xs">ستعيد لعبها؟</Label>
                  <Switch
                    checked={draft.replay}
                    onCheckedChange={(v) => {
                      buzz(20);
                      set("replay", v);
                    }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="block text-xs">مستوى الصعوبة (يحدد نقاط الخبرة)</Label>
                <div className="grid grid-cols-4 gap-2">
                  {DIFFICULTIES.map((d) => (
                    <Button
                      key={d.v}
                      size="sm"
                      variant={(draft.difficulty ?? "normal") === d.v ? "default" : "secondary"}
                      className="h-11 rounded-2xl whitespace-nowrap px-1 text-[11px]"
                      onClick={() => {
                        buzz(20);
                        set("difficulty", d.v);
                      }}
                    >
                      {d.l}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between rounded-2xl bg-secondary/50 px-4 py-3">
                <div className="min-w-0 pl-3">
                  <Label className="text-xs">🕰️ ختمت هذه اللعبة قديماً</Label>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    تُحتسب في عدد المكتملة والأوسمة فقط، وتُستثنى من المعدلات والخرائط والتحدي
                  </p>
                </div>
                <Switch
                  checked={draft.legacy}
                  onCheckedChange={(v) => {
                    buzz(30);
                    set("legacy", v);
                  }}
                />
              </div>

              <div className="flex items-center justify-between rounded-2xl bg-secondary/50 px-4 py-3">
                <Label className="text-xs">إكمال 100% 🏆</Label>
                <Switch
                  checked={draft.fullCompletion}
                  onCheckedChange={(v) => {
                    buzz(50);
                    set("fullCompletion", v);
                  }}
                />
              </div>


              <Textarea
                placeholder="مراجعتك عن اللعبة"
                value={draft.review}
                onChange={(e) => set("review", e.target.value)}
              />
            </>
          )}

          {!planOnly && (
            <div className="flex items-center justify-between rounded-2xl bg-secondary/50 px-4 py-3">
              <div>
                <Label className="text-xs">🎮🎮 لعبناها سوا</Label>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  تُضاف اللعبة والساعات تلقائيًا لملف أخوك
                </p>
              </div>
              <Switch
                checked={draft.coop}
                onCheckedChange={(v) => {
                  buzz(50);
                  set("coop", v);
                }}
              />
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Button onClick={save} className="flex-1">
              حفظ
            </Button>
            {!planOnly && entry.status !== "completed" && !unreleased && (
              <Button onClick={finish} variant="secondary" className="flex-1">
                🏁 إنهاء اللعبة
              </Button>
            )}
            <Button
              variant="destructive"
              onClick={() => {
                removeGame(entry.id);
                setOpen(false);
                toast("تم الحذف");
              }}
            >
              حذف
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

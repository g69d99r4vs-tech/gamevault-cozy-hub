import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useStore, type GameEntry } from "@/lib/store";
import { buzz } from "@/lib/haptics";
import { toast } from "sonner";

const pad = (n: number) => String(n).padStart(2, "0");

export function DateEditDialog({
  game,
  onClose,
}: {
  game: GameEntry | null;
  onClose: () => void;
}) {
  const updateGame = useStore((s) => s.updateGame);
  const [d, setD] = useState("");
  const [m, setM] = useState("");
  const [y, setY] = useState("");

  useEffect(() => {
    if (!game) return;
    const dt = game.released ? new Date(game.released) : null;
    if (dt && !Number.isNaN(dt.getTime())) {
      setD(pad(dt.getDate()));
      setM(pad(dt.getMonth() + 1));
      setY(String(dt.getFullYear()));
    } else {
      setD("");
      setM("");
      setY("");
    }
  }, [game]);

  const save = () => {
    const day = Number(d);
    const mon = Number(m);
    const year = Number(y);
    if (!day || !mon || !year || day > 31 || mon > 12 || year < 1970 || year > 2999) {
      toast.error("تاريخ غير صالح — اكتب يوم/شهر/سنة بالأرقام");
      return;
    }
    const dt = new Date(year, mon - 1, day);
    if (dt.getDate() !== day || dt.getMonth() !== mon - 1) {
      toast.error("هذا اليوم غير موجود في هذا الشهر");
      return;
    }
    buzz(30);
    updateGame(game!.id, { released: `${year}-${pad(mon)}-${pad(day)}` });
    toast.success(`تم تحديث التاريخ: ${pad(day)}/${pad(mon)}/${year}`);
    onClose();
  };

  return (
    <Dialog open={!!game} onOpenChange={(o) => !o && onClose()}>
      <DialogContent dir="rtl" className="rounded-3xl sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-right font-display">
            تعديل تاريخ الإصدار
          </DialogTitle>
        </DialogHeader>
        <p className="text-right text-xs text-muted-foreground">{game?.name}</p>
        <div className="grid grid-cols-3 gap-2" dir="ltr">
          <div>
            <label className="mb-1 block text-center text-[11px] text-muted-foreground">
              يوم
            </label>
            <Input
              inputMode="numeric"
              maxLength={2}
              value={d}
              onChange={(e) => setD(e.target.value.replace(/\D/g, ""))}
              placeholder="15"
              className="rounded-xl text-center"
            />
          </div>
          <div>
            <label className="mb-1 block text-center text-[11px] text-muted-foreground">
              شهر
            </label>
            <Input
              inputMode="numeric"
              maxLength={2}
              value={m}
              onChange={(e) => setM(e.target.value.replace(/\D/g, ""))}
              placeholder="03"
              className="rounded-xl text-center"
            />
          </div>
          <div>
            <label className="mb-1 block text-center text-[11px] text-muted-foreground">
              سنة
            </label>
            <Input
              inputMode="numeric"
              maxLength={4}
              value={y}
              onChange={(e) => setY(e.target.value.replace(/\D/g, ""))}
              placeholder="2026"
              className="rounded-xl text-center"
            />
          </div>
        </div>
        <Button onClick={save} className="mt-2 h-11 rounded-2xl font-display font-black">
          حفظ التاريخ
        </Button>
      </DialogContent>
    </Dialog>
  );
}

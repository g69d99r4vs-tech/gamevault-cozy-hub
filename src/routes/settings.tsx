import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useStore, useCurrentData, useOtherData, type UserId } from "@/lib/store";
import { SectionTitle } from "@/components/ui-bits";
import { AvatarPicker } from "@/components/AvatarPicker";
import { UserAvatar } from "@/components/UserAvatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { buzz } from "@/lib/haptics";
import { getGameBySlug } from "@/lib/rawg";
import { RETRO_IMPORT } from "@/lib/retro-import";
import {
  Download,
  Upload,
  Bell,
  Users,
  Palette,
  UserCog,
  HardDrive,
  TriangleAlert,
  Archive,
  Loader2,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { ReactNode } from "react";


export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "الإعدادات — GameHub" },
      {
        name: "description",
        content: "الملف الشخصي، الإشعارات، الربط مع أخوك، النسخ الاحتياطي والمظهر.",
      },
      { property: "og:title", content: "الإعدادات — GameHub" },
      { property: "og:description", content: "تحكم كامل في حسابك وبياناتك داخل GameHub." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SettingsPage,
});

const NOTIFY_KEY = "gamehub:notify";
const APPEARANCE_KEY = "gamehub:appearance";

const notifications = [
  { id: "activity", label: "تنبيهات نشاط أخوك" },
  { id: "releases", label: "تذكير الإصدارات" },
  { id: "showdown", label: "تحديثات التحدي الأسبوعي" },
];

const appearance = [
  { id: "animations", label: "حركات الواجهة" },
  { id: "haptics", label: "الاهتزاز عند اللمس" },
];

function readFlags(key: string, ids: string[]) {
  if (typeof localStorage === "undefined") return Object.fromEntries(ids.map((i) => [i, true]));
  try {
    const raw = JSON.parse(localStorage.getItem(key) ?? "{}") as Record<string, boolean>;
    return Object.fromEntries(ids.map((i) => [i, raw[i] ?? true]));
  } catch {
    return Object.fromEntries(ids.map((i) => [i, true]));
  }
}

/** بطاقة قسم بأسلوب VIP مع فاصل ذهبي */
function Card({ icon: Icon, title, hint, children }: { icon: typeof Bell; title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="overflow-hidden rounded-[2rem] border border-border bg-card">
      <div className="flex items-center gap-3 p-5">
        <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-secondary/60 text-primary">
          <Icon className="size-5" />
        </span>
        <div className="min-w-0">
          <h3 className="font-display font-bold">{title}</h3>
          {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
        </div>
      </div>
      <div className="h-px bg-gradient-to-l from-transparent via-primary/40 to-transparent" />
      <div className="space-y-4 p-5">{children}</div>
    </section>
  );
}

function ToggleRow({
  label,
  storageKey,
  id,
  defaults,
}: {
  label: string;
  storageKey: string;
  id: string;
  defaults: Record<string, boolean>;
}) {
  const set = (v: boolean) => {
    buzz(20);
    const next = { ...defaults, [id]: v };
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
    } catch {
      /* ignore */
    }
    defaults[id] = v;
  };
  return (
    <div className="flex items-center justify-between rounded-2xl bg-secondary/40 px-4 py-3">
      <Label className="text-sm">{label}</Label>
      <Switch defaultChecked={defaults[id] ?? true} onCheckedChange={set} />
    </div>
  );
}

function SettingsPage() {
  const users = useStore((s) => s.users);
  const currentUser = useStore((s) => s.currentUser);
  const setUser = useStore((s) => s.setUser);
  const updateProfile = useStore((s) => s.updateProfile);
  const importData = useStore((s) => s.importData);
  const resetAll = useStore((s) => s.resetAll);
  const bulkAdd = useStore((s) => s.bulkAdd);
  const data = useCurrentData();
  const other = useOtherData();
  const fileRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);

  const notifyFlags = readFlags(NOTIFY_KEY, notifications.map((n) => n.id));
  const appearanceFlags = readFlags(APPEARANCE_KEY, appearance.map((a) => a.id));

  const importRetro = async () => {
    buzz(30);
    setImporting(true);
    try {
      const fetched = await Promise.allSettled(
        RETRO_IMPORT.map(async (item) => ({ item, game: await getGameBySlug(item.slug) })),
      );
      const items = fetched.flatMap((r) =>
        r.status === "fulfilled"
          ? [
              {
                game: r.value.game,
                status: r.value.item.status,
                hours: r.value.item.hours,
                legacy: r.value.item.status === "completed",
              },
            ]
          : [],
      );
      if (!items.length) {
        toast.error("تعذر جلب الألعاب — حاول مرة أخرى");
        return;
      }
      bulkAdd(items);
      buzz([40, 60, 40]);
      toast.success(`تم استيراد ${items.length} لعبة إلى الأرشيف التاريخي 🗄️`);
    } catch {
      toast.error("فشل الاستيراد");
    } finally {
      setImporting(false);
    }
  };


  const exportJson = () => {
    const blob = new Blob([JSON.stringify({ users }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `gamehub-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("تم تصدير النسخة الاحتياطية");
  };

  const onFile = async (file: File) => {
    const text = await file.text();
    if (importData(text)) toast.success("تم الاستيراد بنجاح");
    else toast.error("ملف غير صالح");
  };

  return (
    <div className="space-y-5">
      <SectionTitle title="الإعدادات" subtitle="تحكم كامل في حسابك وتجربتك" />

      <Card icon={UserCog} title="الملف الشخصي" hint="غيّر اسمك وصورتك">
        <div className="flex items-center gap-4">
          <AvatarPicker size={72} />
          <div className="min-w-0 flex-1 space-y-2">
            <Label className="text-xs text-muted-foreground">الاسم</Label>
            <Input
              value={data.profile.name}
              onChange={(e) => updateProfile({ name: e.target.value })}
              className="rounded-2xl"
            />
          </div>
        </div>
      </Card>

      <Card icon={Bell} title="الإشعارات" hint="تنبيهات الويب">
        {notifications.map((n) => (
          <ToggleRow key={n.id} id={n.id} label={n.label} storageKey={NOTIFY_KEY} defaults={notifyFlags} />
        ))}
      </Card>

      <Card icon={Users} title={`الربط مع ${other.profile.name}`} hint="الحساب المقترن في تحدي الأسبوع">
        <div className="flex items-center gap-3 rounded-2xl bg-secondary/40 px-4 py-3">
          <UserAvatar value={other.profile.avatar} size={40} framed={false} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold">{other.profile.name}</p>
            <p className="text-[11px] text-muted-foreground">مرتبط — تتم مزامنة النشاط والتحدي</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(users) as UserId[]).map((u) => (
            <Button
              key={u}
              size="sm"
              variant={u === currentUser ? "default" : "secondary"}
              className="rounded-xl"
              onClick={() => {
                buzz(20);
                setUser(u);
              }}
            >
              {users[u].profile.name}
            </Button>
          ))}
        </div>
      </Card>

      <Card
        icon={Archive}
        title="استيراد الأرشيف التاريخي"
        hint={`${RETRO_IMPORT.length} لعبة AAA بساعات الختم العالمية — تُسجَّل كـ«ختمت قديماً» ولا تدخل المعدلات اليومية`}
      >
        <div className="max-h-52 space-y-1.5 overflow-y-auto pl-1">
          {RETRO_IMPORT.map((g) => (
            <div
              key={g.slug}
              className="flex items-center justify-between gap-2 rounded-xl bg-secondary/40 px-3 py-2 text-xs"
            >
              <bdi className="truncate">{g.title}</bdi>
              <span className="shrink-0 text-[11px] text-muted-foreground">
                {g.status === "hype" ? "مرتقبة" : `${g.hours} ساعة`}
              </span>
            </div>
          ))}
        </div>
        <Button className="w-full rounded-xl" disabled={importing} onClick={() => void importRetro()}>
          {importing ? <Loader2 className="size-4 animate-spin" /> : <Archive className="size-4" />}
          {importing ? "جارٍ الاستيراد…" : "استيراد المكتبة القديمة"}
        </Button>
      </Card>


      <Card icon={HardDrive} title="النسخ الاحتياطي" hint="لا تفقد سجل ألعابك أبدًا">
        <div className="flex flex-wrap gap-2">
          <Button onClick={exportJson} className="rounded-xl">
            <Download className="size-4" /> تصدير JSON
          </Button>
          <Button variant="secondary" className="rounded-xl" onClick={() => fileRef.current?.click()}>
            <Upload className="size-4" /> استيراد JSON
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onFile(f);
            }}
          />
        </div>
      </Card>

      <Card
        icon={TriangleAlert}
        title="تصفير شامل (Master Reset)"
        hint={`يمسح ألعاب ونشاطات وإحصائيات ${data.profile.name} فقط — ملف ${other.profile.name} يبقى كما هو`}
      >
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="w-full rounded-xl">
              تصفير كل شيء والبدء من الصفر
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent dir="rtl">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-right font-display">متأكد من التصفير؟</AlertDialogTitle>
              <AlertDialogDescription className="text-right">
                سيتم حذف كل ألعابك وساعاتك ونقاط الخبرة والمستوى والنشاطات نهائيًا من الجهاز والسحابة. لا
                يمكن التراجع — يُنصح بتصدير نسخة احتياطية أولاً.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-2">
              <AlertDialogCancel className="rounded-xl">إلغاء</AlertDialogCancel>
              <AlertDialogAction
                className="rounded-xl"
                onClick={() => {
                  buzz([40, 60, 40]);
                  void resetAll().then(() => toast.success("تم التصفير — بداية جديدة 🎮"));
                }}
              >
                نعم، صفّر كل شيء
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Card>

      <Card icon={Palette} title="المظهر" hint="حركات الواجهة والاهتزاز">
        {appearance.map((a) => (
          <ToggleRow key={a.id} id={a.id} label={a.label} storageKey={APPEARANCE_KEY} defaults={appearanceFlags} />
        ))}
      </Card>
    </div>
  );
}

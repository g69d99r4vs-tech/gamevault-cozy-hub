import { useEffect, useState } from "react";
import { resolveArtFn } from "@/lib/igdb.functions";
import { GAME_PLACEHOLDER } from "@/lib/img";

/** كاش بسيط للأغلفة المستخرجة بالاسم حتى لا نكرر الطلبات */
const artCache = new Map<string, string | null>();
const pending = new Map<string, Promise<string | null>>();

const lookup = (name: string) => {
  const key = name.trim().toLowerCase();
  if (artCache.has(key)) return Promise.resolve(artCache.get(key) ?? null);
  let p = pending.get(key);
  if (!p) {
    p = resolveArtFn({ data: { name } })
      .then((r) => r.image ?? null)
      .catch(() => null)
      .then((img) => {
        artCache.set(key, img);
        pending.delete(key);
        return img;
      });
    pending.set(key, p);
  }
  return p;
};

/**
 * صورة لعبة ذكية: تجرّب مصدر المتجر، وعند فشله تبحث تلقائيًا عن الغلاف
 * بالاسم عبر قاعدة IGDB، وأخيرًا تستخدم البديل الفاخر.
 */
export function SmartImage({
  src,
  name,
  alt,
  className,
  loading = "lazy",
  ...rest
}: {
  src?: string | null;
  name: string;
  alt?: string;
} & Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src" | "alt">) {
  const [current, setCurrent] = useState<string>(src || "");
  const [stage, setStage] = useState<"store" | "lookup" | "placeholder">(
    src ? "store" : "lookup",
  );

  useEffect(() => {
    setCurrent(src || "");
    setStage(src ? "store" : "lookup");
  }, [src]);

  useEffect(() => {
    if (stage !== "lookup") return;
    let alive = true;
    lookup(name).then((img) => {
      if (!alive) return;
      if (img) setCurrent(img);
      else {
        setCurrent(GAME_PLACEHOLDER);
        setStage("placeholder");
      }
    });
    return () => {
      alive = false;
    };
  }, [stage, name]);

  return (
    <img
      {...rest}
      src={current || GAME_PLACEHOLDER}
      alt={alt ?? name}
      loading={loading}
      className={className}
      onError={() => {
        if (stage === "store") setStage("lookup");
        else if (stage === "lookup") {
          setCurrent(GAME_PLACEHOLDER);
          setStage("placeholder");
        }
      }}
    />
  );
}

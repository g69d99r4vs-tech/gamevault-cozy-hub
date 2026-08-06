import placeholder from "@/assets/game-placeholder.jpg";

/** صورة بديلة فاخرة تُستخدم عند فشل تحميل أي غلاف */
export const GAME_PLACEHOLDER = placeholder;

/** معالج onError موحّد — يمنع ظهور أيقونة الصورة المكسورة */
export const onImgError = (e: React.SyntheticEvent<HTMLImageElement>) => {
  const el = e.currentTarget;
  if (el.dataset["fallback"] === "1") return;
  el.dataset["fallback"] = "1";
  el.src = GAME_PLACEHOLDER;
};

export const safeImg = (src: string | null | undefined) => src || GAME_PLACEHOLDER;

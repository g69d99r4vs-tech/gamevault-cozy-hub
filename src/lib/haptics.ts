import { hapticsEnabled } from "./prefs";

export const buzz = (pattern: number | number[] = 50) => {
  if (typeof navigator === "undefined") return;
  try {
    if (!hapticsEnabled()) return;
    navigator.vibrate?.(pattern);
  } catch {
    /* unsupported */
  }
};

/** نبضة مزدوجة مُرضية للأحداث المهمة (تسجيل جلسة، إضافة لعبة، ختم لعبة) */
export const buzzDouble = () => buzz([40, 30, 40]);

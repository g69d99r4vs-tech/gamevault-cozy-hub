/** كل التواريخ في التطبيق تُعرض بالميلادي الرقمي: 15/03/2026 */

const toDate = (date: string | Date | null | undefined) => {
  if (!date) return null;
  const d = typeof date === "string" ? new Date(date) : date;
  return Number.isNaN(d.getTime()) ? null : d;
};

/** 15/03/2026 — يوم/شهر/سنة بأرقام فقط (ميلادي) */
export const gdate = (date: string | Date | null | undefined, fallback = "—") => {
  const d = toDate(date);
  if (!d) return fallback;
  const day = d.getDate();
  const m = d.getMonth() + 1;
  const y = d.getFullYear();
  if (!day || !m || !y) return fallback;
  return `${String(day).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y}`;
};

/** أسماء قديمة للتوافق — كلها ميلادية رقمية الآن */
export const gregorian = (date: string | Date | null | undefined) => gdate(date, "غير معلن");

export const num = (n: number, digits = 0) =>
  new Intl.NumberFormat("ar-EG", { maximumFractionDigits: digits }).format(n);

/** فرق الأيام بين تاريخين */
export const daysBetween = (
  from: string | Date | null | undefined,
  to: string | Date | null | undefined,
) => {
  const a = toDate(from);
  const b = toDate(to) ?? new Date();
  if (!a) return null;
  return Math.max(0, Math.round((b.getTime() - a.getTime()) / 86400000));
};

export const countdown = (target: string | null, now: number) => {
  if (!target) return null;
  const diff = new Date(target).getTime() - now;
  if (Number.isNaN(diff) || diff <= 0) return null;
  const s = Math.floor(diff / 1000);
  return {
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
  };
};

/** «15/03» — يوم/شهر بأرقام ميلادية فقط */
export const dayMonth = (date: string | Date | null | undefined, fallback = "—") => {
  const h = gdate(date, fallback);
  if (h === fallback) return fallback;
  return h.split("/").slice(0, 2).join("/");
};


/** يضيف عددًا من الأشهر لتاريخ اليوم ويرجع YYYY-MM-DD */
export const monthsFromNow = (months: number) => {
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
};

/** هل التاريخ صالح ولم يمضِ بعد؟ */
export const isFuture = (date: string | Date | null | undefined) => {
  const d = toDate(date);
  return !!d && d.getTime() > Date.now();
};

/**
 * تاريخ إصدار آمن للألعاب المرتقبة: لو التاريخ ناقص أو ماضٍ
 * نستخدم موعدًا افتراضيًا بعد 3 أشهر بدل وسمها كـ«صدرت بالفعل».
 */
export const safeUpcomingDate = (date: string | null | undefined, fallbackMonths = 3) =>
  isFuture(date) ? (date as string) : monthsFromNow(fallbackMonths);

/** كل التواريخ في التطبيق تُعرض بالهجري الرقمي: 1448/02/15 */

const hijriFmt = new Intl.DateTimeFormat("ar-SA-u-ca-islamic-nu-latn", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const toDate = (date: string | Date | null | undefined) => {
  if (!date) return null;
  const d = typeof date === "string" ? new Date(date) : date;
  return Number.isNaN(d.getTime()) ? null : d;
};

/** 15/03/1448 — يوم/شهر/سنة بأرقام فقط */
export const hijri = (date: string | Date | null | undefined, fallback = "—") => {
  const d = toDate(date);
  if (!d) return fallback;
  try {
    const parts = hijriFmt.formatToParts(d);
    const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
    const y = Number(get("year").replace(/[^\d]/g, ""));
    const m = Number(get("month").replace(/[^\d]/g, ""));
    const day = Number(get("day").replace(/[^\d]/g, ""));
    // لا نسمح أبدًا بأصفار أو قيم غير صالحة
    if (!y || !m || !day || m > 12 || day > 30) return fallback;
    return `${String(day).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y}`;
  } catch {
    return fallback;
  }
};


/** يبقى الاسم للتوافق — لكنه يعرض هجريًا رقميًا مثل بقية التطبيق */
export const gregorian = (date: string | Date | null | undefined) => hijri(date, "غير معلن");

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

/** «15/03» — يوم/شهر بأرقام هجرية فقط */
export const dayMonth = (date: string | Date | null | undefined, fallback = "—") => {
  const h = hijri(date, fallback);
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

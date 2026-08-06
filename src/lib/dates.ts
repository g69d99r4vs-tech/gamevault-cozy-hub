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
    const y = get("year").replace(/[^\d]/g, "");
    const m = get("month").replace(/[^\d]/g, "").padStart(2, "0");
    const day = get("day").replace(/[^\d]/g, "").padStart(2, "0");
    return `${day}/${m}/${y}`;
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


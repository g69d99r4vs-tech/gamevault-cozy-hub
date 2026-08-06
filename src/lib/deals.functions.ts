import { createServerFn } from "@tanstack/react-start";

export const listDealsFn = createServerFn({ method: "GET" }).handler(async () => {
  const { fetchDealPool } = await import("./deals.server");
  return fetchDealPool();
});

export const searchDealsFn = createServerFn({ method: "POST" })
  .inputValidator((d: { q: string }) => d)
  .handler(async ({ data }) => {
    const q = data.q.trim();
    if (q.length < 2) return [];
    const { searchDeals } = await import("./deals.server");
    return searchDeals(q);
  });

export const dealDetailsFn = createServerFn({ method: "POST" })
  .inputValidator((d: { dealID: string }) => d)
  .handler(async ({ data }) => {
    const { fetchDealDetails } = await import("./deals.server");
    return fetchDealDetails(data.dealID);
  });

/** أسعار الصرف الحيّة مع سقوط آمن */
export const ratesFn = createServerFn({ method: "GET" }).handler(async () => {
  const { FALLBACK_RATES } = await import("./deals");
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD");
    if (!res.ok) return FALLBACK_RATES;
    const json = (await res.json()) as { rates?: Record<string, number> };
    const uah = json.rates?.["UAH"];
    const sar = json.rates?.["SAR"];
    if (!uah || !sar) return FALLBACK_RATES;
    return { usdToUah: uah, uahToSar: sar / uah };
  } catch {
    return FALLBACK_RATES;
  }
});

import { createServerFn } from "@tanstack/react-start";

export const steamSpecialsFn = createServerFn({ method: "GET" }).handler(async () => {
  const { fetchSpecials } = await import("./steam.server");
  try {
    return await fetchSpecials();
  } catch {
    return [];
  }
});

export const steamSearchFn = createServerFn({ method: "GET" })
  .inputValidator((d: { term: string }) => ({ term: String(d?.term ?? "") }))
  .handler(async ({ data }) => {
    const { searchSteam } = await import("./steam.server");
    try {
      return await searchSteam(data.term);
    } catch {
      return [];
    }
  });

export const steamDetailsFn = createServerFn({ method: "GET" })
  .inputValidator((d: { appId: number }) => ({ appId: Number(d?.appId) }))
  .handler(async ({ data }) => {
    const { fetchAppDetails } = await import("./steam.server");
    try {
      return await fetchAppDetails(data.appId);
    } catch {
      return null;
    }
  });

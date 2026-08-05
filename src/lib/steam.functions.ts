import { createServerFn } from "@tanstack/react-start";

export const searchGamesFn = createServerFn({ method: "POST" })
  .inputValidator((d: { q: string; limit?: number }) => d)
  .handler(async ({ data }) => {
    const { searchSteam } = await import("./steam.server");
    return searchSteam(data.q, data.limit ?? 20);
  });

export const getGameFn = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string; slug?: string; name?: string }) => d)
  .handler(async ({ data }) => {
    const { resolveSteamGame } = await import("./steam.server");
    return resolveSteamGame(data.id, {
      ...(data.slug ? { slug: data.slug } : {}),
      ...(data.name ? { name: data.name } : {}),
    });
  });

export const getGameBySlugFn = createServerFn({ method: "POST" })
  .inputValidator((d: { slug: string }) => d)
  .handler(async ({ data }) => {
    const { gameBySlugSteam } = await import("./steam.server");
    return gameBySlugSteam(data.slug);
  });

export const getScreenshotsFn = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data }) => {
    const { screenshotsSteam } = await import("./steam.server");
    return screenshotsSteam(data.id);
  });

export const getSimilarFn = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data }) => {
    const { similarSteam } = await import("./steam.server");
    return similarSteam(data.id);
  });

export const getTrendingFn = createServerFn({ method: "GET" }).handler(async () => {
  const { trendingSteam } = await import("./steam.server");
  return trendingSteam();
});

export const getUpcomingFn = createServerFn({ method: "GET" }).handler(async () => {
  const { upcomingSteam } = await import("./steam.server");
  return upcomingSteam();
});

export const getRecommendedFn = createServerFn({ method: "POST" })
  .inputValidator((d: { genres?: string[]; ids?: number[]; names?: string[] }) => d)
  .handler(async ({ data }) => {
    const { recommendedSteam } = await import("./steam.server");
    return recommendedSteam(data.ids ?? [], data.names ?? []);
  });

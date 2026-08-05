import { createServerFn } from "@tanstack/react-start";

export const searchGamesFn = createServerFn({ method: "POST" })
  .inputValidator((d: { q: string; limit?: number }) => d)
  .handler(async ({ data }) => {
    const { searchIgdb } = await import("./igdb-search.server");
    return searchIgdb(data.q, data.limit ?? 12);
  });

export const getGameFn = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data }) => {
    const { gameById } = await import("./igdb-search.server");
    return gameById(data.id);
  });

export const getGameBySlugFn = createServerFn({ method: "POST" })
  .inputValidator((d: { slug: string }) => d)
  .handler(async ({ data }) => {
    const { gameBySlug } = await import("./igdb-search.server");
    return gameBySlug(data.slug);
  });

export const getScreenshotsFn = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data }) => {
    const { screenshotsFor } = await import("./igdb-search.server");
    return screenshotsFor(data.id);
  });

export const getSimilarFn = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data }) => {
    const { similarFor } = await import("./igdb-search.server");
    return similarFor(data.id);
  });

export const getTrendingFn = createServerFn({ method: "GET" }).handler(async () => {
  const { trendingGames } = await import("./igdb-search.server");
  return trendingGames();
});

export const getUpcomingFn = createServerFn({ method: "GET" }).handler(async () => {
  const { upcomingGames } = await import("./igdb-search.server");
  return upcomingGames();
});

export const getRecommendedFn = createServerFn({ method: "POST" })
  .inputValidator((d: { genres?: string[]; ids?: number[]; names?: string[] }) => d)
  .handler(async ({ data }) => {
    const { recommendedGames } = await import("./igdb-search.server");
    return recommendedGames(data.genres ?? [], data.ids ?? [], data.names ?? []);
  });

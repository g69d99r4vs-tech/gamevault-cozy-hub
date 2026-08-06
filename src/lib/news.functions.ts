import { createServerFn } from "@tanstack/react-start";

export const listNewsFn = createServerFn({ method: "GET" }).handler(async () => {
  const { fetchNews } = await import("./news.server");
  return fetchNews();
});

/** جلب أخبار الألعاب من خلاصات RSS وتحويلها إلى منشورات على نمط X */

export type NewsPost = {
  id: string;
  source: string;
  handle: string;
  title: string;
  summary: string;
  image: string | null;
  publishedAt: string;
  link: string;
};

const FEEDS: { name: string; handle: string; url: string }[] = [
  { name: "Saudi Gamer", handle: "@saudigamer", url: "https://saudigamer.com/feed/" },
  { name: "IGN", handle: "@IGN", url: "https://feeds.ign.com/ign/games-all" },
  { name: "Eurogamer", handle: "@eurogamer", url: "https://www.eurogamer.net/feed" },
  { name: "PC Gamer", handle: "@pcgamer", url: "https://www.pcgamer.com/rss/" },
  { name: "Push Square", handle: "@PushSquare", url: "https://www.pushsquare.com/feeds/latest" },
  { name: "Gematsu", handle: "@gematsu", url: "https://www.gematsu.com/feed" },
];

const tag = (xml: string, name: string) => {
  const m = xml.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, "i"));
  return m?.[1] ? clean(m[1]) : "";
};

const clean = (raw: string) =>
  raw
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#8217;|&rsquo;/g, "'")
    .replace(/&#\d+;/g, "")
    .replace(/&[a-z]+;/g, "")
    .replace(/\s+/g, " ")
    .trim();

const imageFrom = (xml: string): string | null => {
  const candidates = [
    /<media:content[^>]+url="([^"]+)"/i,
    /<media:thumbnail[^>]+url="([^"]+)"/i,
    /<enclosure[^>]+url="([^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"/i,
    /<img[^>]+src="([^"]+)"/i,
  ];
  for (const re of candidates) {
    const m = xml.match(re);
    if (m?.[1]) return m[1].replace(/&amp;/g, "&");
  }
  return null;
};

async function fetchFeed(feed: (typeof FEEDS)[number]): Promise<NewsPost[]> {
  try {
    const res = await fetch(feed.url, {
      headers: { "user-agent": "Mozilla/5.0 GameHubNewsBot", accept: "application/rss+xml,text/xml,*/*" },
    });
    if (!res.ok) return [];
    const xml = await res.text();
    const items = xml.match(/<(item|entry)[\s\S]*?<\/(item|entry)>/gi) ?? [];
    return items.slice(0, 15).map((raw, i) => {
      const link =
        tag(raw, "link") || (raw.match(/<link[^>]+href="([^"]+)"/i)?.[1] ?? "");
      const date = tag(raw, "pubDate") || tag(raw, "updated") || tag(raw, "published");
      const summary =
        tag(raw, "description") || tag(raw, "content:encoded") || tag(raw, "summary");
      return {
        id: `${feed.handle}-${link || i}`,
        source: feed.name,
        handle: feed.handle,
        title: tag(raw, "title"),
        summary: summary.slice(0, 700),
        image: imageFrom(raw),
        publishedAt: date ? new Date(date).toISOString() : new Date().toISOString(),
        link,
      };
    });
  } catch {
    return [];
  }
}

export async function fetchNews(): Promise<NewsPost[]> {
  const all = (await Promise.all(FEEDS.map(fetchFeed))).flat();
  const seen = new Set<string>();
  return all
    .filter((p) => p.title && !seen.has(p.title) && (seen.add(p.title), true))
    .sort((a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt))
    .slice(0, 80);
}

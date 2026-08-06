import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { motion, AnimatePresence } from "motion/react";
import { Bookmark, BookmarkCheck, Newspaper, Clock, ChevronDown, Trash2 } from "lucide-react";
import { listNewsFn } from "@/lib/news.functions";
import type { NewsPost } from "@/lib/news.server";
import { useNewsStore } from "@/lib/news-store";
import { buzz } from "@/lib/haptics";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/news")({
  head: () => ({
    meta: [
      { title: "أخبار الألعاب — GameHub" },
      { name: "description", content: "خلاصة أخبار الألعاب على نمط X مع حفظ المنشورات المفضلة داخل التطبيق." },
      { property: "og:title", content: "أخبار الألعاب — GameHub" },
      { property: "og:description", content: "تايم لاين أخبار الألعاب مع المحفوظات." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: NewsPage,
});

const timeAgo = (iso: string) => {
  const diff = (Date.now() - new Date(iso).getTime()) / 60000;
  if (diff < 60) return `${Math.max(1, Math.round(diff))} د`;
  if (diff < 1440) return `${Math.round(diff / 60)} س`;
  return `${Math.round(diff / 1440)} ي`;
};

function PostCard({ post }: { post: NewsPost }) {
  const [open, setOpen] = useState(false);
  const saved = useNewsStore((s) => s.saved.some((p) => p.id === post.id));
  const toggleSave = useNewsStore((s) => s.toggleSave);

  return (
    <motion.article
      layout
      onClick={() => {
        buzz();
        setOpen((v) => !v);
      }}
      className="cursor-pointer border-b border-border/60 px-4 py-4 transition-colors hover:bg-secondary/30"
    >
      <div className="flex gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[var(--gradient-primary)] text-xs font-black text-primary-foreground">
          {post.source.slice(0, 2).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 text-[13px]">
            <span className="font-bold">{post.source}</span>
            <span className="text-muted-foreground">{post.handle}</span>
            <span className="text-muted-foreground">·</span>
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <Clock className="size-3" />
              {timeAgo(post.publishedAt)}
            </span>
          </div>

          <h3 className="mt-1 text-[15px] font-extrabold leading-snug">{post.title}</h3>

          <p
            className={cn(
              "mt-1 text-sm leading-relaxed text-muted-foreground",
              !open && "line-clamp-2",
            )}
          >
            {post.summary}
          </p>

          {post.image && (
            <img
              src={post.image}
              alt={post.title}
              loading="lazy"
              className={cn(
                "mt-3 w-full rounded-2xl object-cover ring-1 ring-border/60 transition-all",
                open ? "max-h-[420px]" : "max-h-52",
              )}
            />
          )}

          <AnimatePresence initial={false}>
            {open && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <p className="mt-3 rounded-2xl bg-secondary/40 p-3 text-xs text-muted-foreground">
                  عرض داخلي فقط — لا يتم فتح أي مواقع خارجية. نُشر بتاريخ{" "}
                  {new Date(post.publishedAt).toLocaleDateString("ar-SA")} عبر {post.source}.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-3 flex items-center gap-3">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                buzz();
                toggleSave(post);
              }}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-colors",
                saved
                  ? "bg-primary/15 text-primary ring-1 ring-primary/40"
                  : "bg-secondary/60 text-muted-foreground hover:text-foreground",
              )}
            >
              {saved ? <BookmarkCheck className="size-4" /> : <Bookmark className="size-4" />}
              {saved ? "محفوظ" : "حفظ"}
            </button>
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} />
              {open ? "إخفاء" : "التفاصيل"}
            </span>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

function NewsPage() {
  const [tab, setTab] = useState<"feed" | "saved">("feed");
  const fetchNews = useServerFn(listNewsFn);
  const saved = useNewsStore((s) => s.saved);
  const clearSaved = useNewsStore((s) => s.clearSaved);

  const { data, isLoading } = useQuery({
    queryKey: ["news"],
    queryFn: () => fetchNews(),
    staleTime: 5 * 60 * 1000,
  });

  const posts = tab === "feed" ? (data ?? []) : saved;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 flex items-center gap-2">
        <Newspaper className="size-5 text-primary" />
        <h1 className="font-display text-2xl font-black">الأخبار</h1>
      </div>

      <div className="sticky top-0 z-20 mb-2 flex gap-1 rounded-2xl glass p-1">
        {(
          [
            ["feed", "الأحدث"],
            ["saved", `المحفوظة (${saved.length})`],
          ] as const
        ).map(([v, l]) => (
          <button
            key={v}
            type="button"
            onClick={() => {
              buzz();
              setTab(v);
            }}
            className={cn(
              "flex-1 rounded-xl py-2 text-sm font-bold transition-colors",
              tab === v ? "bg-primary/15 text-primary" : "text-muted-foreground",
            )}
          >
            {l}
          </button>
        ))}
      </div>

      {tab === "saved" && saved.length > 0 && (
        <div className="mb-2 flex justify-end">
          <button
            type="button"
            onClick={() => {
              buzz();
              clearSaved();
            }}
            className="inline-flex items-center gap-1 rounded-full bg-secondary/60 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <Trash2 className="size-3.5" /> مسح المحفوظات
          </button>
        </div>
      )}

      <div className="overflow-hidden rounded-3xl glass">
        {tab === "feed" && isLoading && (
          <div className="space-y-4 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-2xl bg-secondary/50" />
            ))}
          </div>
        )}

        {posts.map((p) => (
          <PostCard key={p.id} post={p} />
        ))}

        {!isLoading && posts.length === 0 && (
          <p className="p-8 text-center text-sm text-muted-foreground">
            {tab === "saved" ? "لا توجد أخبار محفوظة بعد." : "تعذّر جلب الأخبار الآن."}
          </p>
        )}
      </div>
    </div>
  );
}

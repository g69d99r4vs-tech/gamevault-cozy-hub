import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { NewsPost } from "./news.server";

type NewsState = {
  saved: NewsPost[];
  toggleSave: (post: NewsPost) => void;
  isSaved: (id: string) => boolean;
  clearSaved: () => void;
};

/** مفضلة الأخبار — محفوظة محليًا على الجهاز */
export const useNewsStore = create<NewsState>()(
  persist(
    (set, get) => ({
      saved: [],
      toggleSave: (post) =>
        set((s) =>
          s.saved.some((p) => p.id === post.id)
            ? { saved: s.saved.filter((p) => p.id !== post.id) }
            : { saved: [post, ...s.saved].slice(0, 200) },
        ),
      isSaved: (id) => get().saved.some((p) => p.id === id),
      clearSaved: () => set({ saved: [] }),
    }),
    { name: "gamehub-news-bookmarks-v1" },
  ),
);

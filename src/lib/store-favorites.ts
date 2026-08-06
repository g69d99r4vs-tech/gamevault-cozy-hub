import { create } from "zustand";
import { persist } from "zustand/middleware";

export type FavItem = {
  appId: number;
  name: string;
  image: string;
  uahFinal: number;
  uahInitial: number;
  discount: number;
};

type FavState = {
  favorites: FavItem[];
  toggleFavorite: (item: FavItem) => void;
  isFavorite: (appId: number) => boolean;
};

export const useFavorites = create<FavState>()(
  persist(
    (set, get) => ({
      favorites: [],
      toggleFavorite: (item) =>
        set((s) => ({
          favorites: s.favorites.some((f) => f.appId === item.appId)
            ? s.favorites.filter((f) => f.appId !== item.appId)
            : [item, ...s.favorites],
        })),
      isFavorite: (appId) => get().favorites.some((f) => f.appId === appId),
    }),
    { name: "gamehub-store-favorites" },
  ),
);

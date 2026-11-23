import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const MAX_RECENTLY_VIEWED = 5;

interface RecentlyViewedState {
  /** Most-recently-viewed product id first. */
  productIds: number[];
  addProduct: (id: number) => void;
  clear: () => void;
}

/**
 * Tracks which products the visitor has looked at, persisted to
 * localStorage so it survives a page reload. This is genuinely
 * client-only UI state (it has no server representation and no sane URL
 * shape) - the right job for Zustand, as opposed to product data itself
 * (server state -> TanStack Query) or the current route/search term
 * (URL state -> React Router).
 */
export const useRecentlyViewedStore = create<RecentlyViewedState>()(
  persist(
    (set) => ({
      productIds: [],
      addProduct: (id) =>
        set((state) => ({
          productIds: [id, ...state.productIds.filter((existing) => existing !== id)].slice(
            0,
            MAX_RECENTLY_VIEWED,
          ),
        })),
      clear: () => set({ productIds: [] }),
    }),
    { name: 'catalogue-recently-viewed' },
  ),
);

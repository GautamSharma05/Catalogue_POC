import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const MAX_RECENT_SEARCHES = 5;

interface RecentSearchesState {
  /** Most-recent search term first. */
  terms: string[];
  addTerm: (term: string) => void;
  removeTerm: (term: string) => void;
  clear: () => void;
}

/**
 * Tracks the visitor's past search submissions, persisted to localStorage.
 * Same shape and reasoning as recently-viewed.store.ts: client-only UI
 * state with no server representation, needs to survive a reload.
 *
 * Only a full search *submission* (Enter, or "view all results") records
 * a term here - clicking a suggested product directly does not, since
 * finding the product on the first try isn't a search the visitor
 * necessarily wants remembered.
 */
export const useRecentSearchesStore = create<RecentSearchesState>()(
  persist(
    (set) => ({
      terms: [],
      addTerm: (term) =>
        set((state) => {
          const normalized = term.trim();
          if (normalized.length === 0) return state;
          return {
            terms: [
              normalized,
              ...state.terms.filter((existing) => existing.toLowerCase() !== normalized.toLowerCase()),
            ].slice(0, MAX_RECENT_SEARCHES),
          };
        }),
      removeTerm: (term) => set((state) => ({ terms: state.terms.filter((existing) => existing !== term) })),
      clear: () => set({ terms: [] }),
    }),
    { name: 'catalogue-recent-searches' },
  ),
);

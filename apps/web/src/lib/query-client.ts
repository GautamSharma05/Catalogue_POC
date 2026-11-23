import { QueryClient } from '@tanstack/react-query';

/**
 * One QueryClient for the whole app (created in main.tsx). Defaults are
 * tuned for a small read-mostly catalogue: a short staleTime avoids
 * refetching on every route change within the same session, and a single
 * retry keeps a flaky upstream (Fake Store API) from hanging the UI for
 * the default 3-retry/exponential-backoff duration.
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: 1,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: 0,
      },
    },
  });
}

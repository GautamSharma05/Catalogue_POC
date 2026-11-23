import type { ReactElement } from 'react';
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

/** A QueryClient with retries disabled so error-path tests fail fast and deterministically. */
export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
}

/**
 * Renders `ui` inside a fresh QueryClientProvider + MemoryRouter. Pass
 * `route`/`path` to exercise useParams/useSearchParams the way a real
 * route match would.
 */
export function renderWithProviders(
  ui: ReactElement,
  options: { route?: string; path?: string } = {},
) {
  const queryClient = createTestQueryClient();
  const { route = '/', path = '/' } = options;

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]}>
        <Routes>
          <Route path={path} element={ui} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

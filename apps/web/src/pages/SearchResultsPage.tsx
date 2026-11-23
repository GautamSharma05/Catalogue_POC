import { useSearchParams } from 'react-router-dom';
import { TriangleAlertIcon } from 'lucide-react';

import { useSearchProductsQuery } from '../queries/catalogue.queries';
import { ProductGrid } from '../components/ProductGrid';
import { ProductSkeleton } from '../components/ProductSkeleton';

export function SearchResultsPage() {
  const [params] = useSearchParams();
  const term = params.get('q') ?? '';
  const { status, data, error, fetchStatus } = useSearchProductsQuery(term);

  const isLoading = status === 'pending' && fetchStatus === 'fetching';

  return (
    <section>
      {isLoading && (
        <>
          <span className="sr-only">Searching...</span>
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {[...Array(6)].map((_, i) => (
              <ProductSkeleton key={i} />
            ))}
          </div>
        </>
      )}

      {status === 'error' && (
        <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-5 text-destructive">
          <TriangleAlertIcon className="mt-0.5 size-6 shrink-0" />
          <p role="alert">Search failed: {error instanceof Error ? error.message : String(error)}</p>
        </div>
      )}

      {(status === 'success' || (status === 'pending' && fetchStatus === 'idle')) && (
        <>
          <h2 className="mb-5 text-2xl tracking-tight">
            Search results for <em>"{term}"</em>
          </h2>
          <ProductGrid products={data ?? []} emptyMessage="No results for that search" />
        </>
      )}
    </section>
  );
}

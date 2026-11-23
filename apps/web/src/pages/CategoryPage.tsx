import { useParams } from 'react-router-dom';
import { TriangleAlertIcon } from 'lucide-react';

import { useCategoryViewQuery } from '../queries/catalogue.queries';
import { ProductGrid } from '../components/ProductGrid';
import { ProductSkeleton } from '../components/ProductSkeleton';

export function CategoryPage() {
  const { slug = '' } = useParams();
  const { status, data, error } = useCategoryViewQuery(slug);

  return (
    <section>
      {status === 'pending' && (
        <>
          <span className="sr-only">Loading category...</span>
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
          <p role="alert">Could not load this category: {error instanceof Error ? error.message : String(error)}</p>
        </div>
      )}

      {status === 'success' && (
        <>
          <div className="mb-5">
            <h2 className="text-2xl tracking-tight capitalize">{data.category}</h2>
          </div>

          <h3 className="mb-4 text-lg font-semibold">Top rated in this category</h3>
          <div className="mb-8">
            <ProductGrid products={data.topRated} />
          </div>

          <h3 className="mb-4 text-lg font-semibold">More in this category</h3>
          <ProductGrid products={data.others} emptyMessage="No additional products in this category" />
        </>
      )}
    </section>
  );
}

import { TriangleAlertIcon } from 'lucide-react';

import { useFeaturedProductsQuery } from '../queries/catalogue.queries';
import { ProductGrid } from '../components/ProductGrid';
import { ProductSkeleton } from '../components/ProductSkeleton';
import { RecentlyViewed } from '../components/RecentlyViewed';

export function HomePage() {
  const { status, data, error } = useFeaturedProductsQuery();

  return (
    <>
      <section className="relative mb-10 overflow-hidden rounded-2xl bg-primary px-8 py-14 text-primary-foreground">
        <div className="relative z-10 max-w-xl">
          <h1 className="text-3xl tracking-tight sm:text-4xl">Browse the full catalogue</h1>
          <p className="mt-3 text-primary-foreground/80">
            Search by category, check ratings, and send an enquiry straight to our sales team.
          </p>
        </div>
      </section>

      <section>
        <div className="mb-5">
          <h2 className="text-2xl tracking-tight">Top rated products</h2>
          <p className="text-sm text-muted-foreground">Our 5 highest-rated items right now</p>
        </div>

        {status === 'pending' && (
          <>
            <span className="sr-only">Loading featured products...</span>
            <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {[...Array(5)].map((_, i) => (
                <ProductSkeleton key={i} />
              ))}
            </div>
          </>
        )}

        {status === 'error' && (
          <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-5 text-destructive">
            <TriangleAlertIcon className="mt-0.5 size-6 shrink-0" />
            <div>
              <p className="font-semibold">Could not load featured products</p>
              <p role="alert">{error instanceof Error ? error.message : String(error)}</p>
            </div>
          </div>
        )}

        {status === 'success' && <ProductGrid products={data} />}
      </section>

      <RecentlyViewed />
    </>
  );
}

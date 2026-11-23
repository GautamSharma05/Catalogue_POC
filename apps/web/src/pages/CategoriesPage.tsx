import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { PackageIcon, TriangleAlertIcon } from 'lucide-react';

import { useCategoriesQuery, useFeaturedProductsQuery } from '../queries/catalogue.queries';
import { ProductSkeleton } from '../components/ProductSkeleton';

/**
 * Category discovery page: browse all categories with counts, images, and
 * quick links. This is the destination when "See all" is clicked from the
 * header nav.
 *
 * To show a representative product image for each category, we fetch all
 * products once and group them. In a larger app, the backend would
 * precompute this data, but for a small catalogue, it's simpler and
 * cheaper to compute on the client.
 */
export function CategoriesPage() {
  const { data: categories, status: categoriesStatus } = useCategoriesQuery();
  const { data: featured, status: featuredStatus } = useFeaturedProductsQuery();

  const categoryMetadata = useMemo(() => {
    if (!featured || !categories) return [];

    return categories.map((category) => {
      const products = featured.filter((p) => p.category === category);
      const topProduct = products[0]; // already sorted by rating
      const image = topProduct?.imageUrl;
      return { category, count: products.length, image };
    });
  }, [categories, featured]);

  const isLoading = categoriesStatus === 'pending' || featuredStatus === 'pending';
  const isError = categoriesStatus === 'error' || featuredStatus === 'error';

  if (isError) {
    return (
      <section className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-5 text-destructive">
        <TriangleAlertIcon className="mt-0.5 size-6 shrink-0" />
        <p className="font-semibold">Could not load categories</p>
      </section>
    );
  }

  return (
    <section>
      <div className="mb-8">
        <h1 className="text-2xl tracking-tight">Browse all categories</h1>
        <p className="text-sm text-muted-foreground">Explore our entire collection</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <ProductSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {categoryMetadata.map(({ category, count, image }) => (
            <Link
              key={category}
              to={`/categories/${encodeURIComponent(category)}`}
              className="group flex flex-col overflow-hidden rounded-xl border bg-card shadow-sm transition-shadow hover:shadow-md"
            >
              {/* object-contain, not a cropped bg-cover banner: a
                  background-image crop on a tall/narrow product photo
                  (jewelry especially) was hiding the one thing a category
                  tile needs to show - what's actually in that category. */}
              <div className="flex aspect-[4/3] items-center justify-center overflow-hidden bg-muted">
                {image ? (
                  <img
                    src={image}
                    alt=""
                    className="h-full w-full object-contain p-4 transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <PackageIcon className="size-10 text-muted-foreground" />
                )}
              </div>
              <div className="flex flex-col gap-0.5 p-4">
                <h2 className="text-lg font-semibold capitalize">{category}</h2>
                <p className="text-sm text-muted-foreground">
                  {count} product{count !== 1 ? 's' : ''}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

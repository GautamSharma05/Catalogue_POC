import { useRecentlyViewedStore } from '../stores/recently-viewed.store';
import { useProductsByIdQuery } from '../queries/catalogue.queries';
import { ProductGrid } from './ProductGrid';
import type { Product } from '../lib/types';

export function RecentlyViewed() {
  const productIds = useRecentlyViewedStore((state) => state.productIds);
  const results = useProductsByIdQuery(productIds);

  if (productIds.length === 0) {
    return null;
  }

  const products = results
    .map((result) => result.data)
    .filter((product): product is Product => Boolean(product));

  if (products.length === 0) {
    return null;
  }

  return (
    <section className="section mt-12">
      <div className="mb-5">
        <h2 className="text-lg font-semibold">Recently viewed</h2>
      </div>
      <ProductGrid products={products} />
    </section>
  );
}

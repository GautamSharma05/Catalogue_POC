import { Link } from 'react-router-dom';
import { PackageIcon } from 'lucide-react';

import { StarRating } from './StarRating';
import type { Product } from '../lib/types';

export interface ProductGridProps {
  products: Product[];
  emptyMessage?: string;
}

export function ProductGrid({ products, emptyMessage = 'No products available' }: ProductGridProps) {
  if (!products.length) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border bg-card/60 px-6 py-12 text-center">
        <PackageIcon className="size-8 text-muted-foreground" />
        <p className="text-lg text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {products.map((p) => (
        <Link
          key={p.id}
          to={`/products/${p.id}`}
          className="group flex flex-col overflow-hidden rounded-xl border bg-card shadow-sm transition-shadow hover:shadow-md"
        >
          {/* object-contain, not object-cover: a lot of these photos are
              tall/narrow (jewelry, jackets, dresses), and cover would crop
              them into an uninformative torso/clasp close-up. A catalogue
              thumbnail's job is to show the whole product. */}
          <div className="flex aspect-[4/3] items-center justify-center overflow-hidden bg-muted">
            <img
              src={p.imageUrl}
              alt={p.title}
              className="h-full w-full object-contain p-3 transition-transform duration-300 group-hover:scale-105"
            />
          </div>
          <div className="flex flex-1 flex-col gap-1.5 p-3">
            <div className="text-xs font-medium capitalize text-primary">{p.category}</div>
            <h3 className="line-clamp-2 flex-1 text-sm font-medium leading-snug">{p.title}</h3>
            <div className="mt-1 flex flex-col gap-1">
              <strong className="text-base font-semibold">${p.price.toFixed(2)}</strong>
              <StarRating rate={p.rating.rate} count={p.rating.count} />
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

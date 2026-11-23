import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { PackageOpenIcon } from 'lucide-react';

import { useProductQuery } from '../queries/catalogue.queries';
import { useRecentlyViewedStore } from '../stores/recently-viewed.store';
import { EnquiryForm } from '../components/EnquiryForm';
import { StarRating } from '../components/StarRating';
import { ProductSkeleton } from '../components/ProductSkeleton';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export function ProductPage() {
  const { id = '' } = useParams();
  const productId = Number(id);
  const [enquiryOpen, setEnquiryOpen] = useState(false);
  const { status, data } = useProductQuery(productId);
  const addRecentlyViewed = useRecentlyViewedStore((state) => state.addProduct);

  useEffect(() => {
    if (status === 'success' && data) {
      addRecentlyViewed(data.id);
    }
  }, [status, data, addRecentlyViewed]);

  if (status === 'pending') {
    return (
      <section>
        <span className="sr-only">Loading product...</span>
        <ProductSkeleton />
      </section>
    );
  }

  if (status === 'error' || !data) {
    return (
      <section className="flex flex-col items-center gap-3 rounded-xl border bg-card/60 px-6 py-12 text-center">
        <PackageOpenIcon className="size-8 text-muted-foreground" />
        <p role="alert" className="text-lg text-muted-foreground">
          Product not found
        </p>
      </section>
    );
  }

  const product = data;

  return (
    <section>
      <div className="grid gap-8 md:grid-cols-2">
        <div className="flex aspect-square items-center justify-center overflow-hidden rounded-xl border bg-card">
          {/* object-contain, not object-cover: Fake Store product photos are
              often tall/narrow (jewelry especially), and cover would crop
              into a zoomed-in sliver that cuts off most of the product.
              contain shows the whole image, letterboxed on the card's
              background instead of destructively cropping. */}
          <img
            src={product.imageUrl}
            alt={product.title}
            className="h-full w-full object-contain p-6"
          />
        </div>

        <div className="flex flex-col gap-4">
          <Link
            to={`/categories/${encodeURIComponent(product.category)}`}
            className="inline-block text-xs font-medium capitalize text-primary hover:underline"
          >
            {product.category}
          </Link>
          <h1 className="text-3xl tracking-tight">{product.title}</h1>

          <div className="flex items-center gap-3">
            <div className="text-2xl font-semibold">${product.price.toFixed(2)}</div>
            <StarRating rate={product.rating.rate} count={product.rating.count} />
          </div>

          <hr className="border-border" />

          <p className="leading-relaxed text-muted-foreground">{product.description}</p>

          <Dialog open={enquiryOpen} onOpenChange={setEnquiryOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="mt-2 w-fit">
                Enquire
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogTitle className="sr-only">Send us an enquiry</DialogTitle>
              <EnquiryForm productId={product.id} />
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </section>
  );
}

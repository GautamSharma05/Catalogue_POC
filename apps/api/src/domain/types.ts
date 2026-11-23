/**
 * Internal product shape. Deliberately decoupled from any upstream provider's
 * payload so a new product data source only needs a new adapter, not changes
 * to use-cases, routes, or the web client.
 */
export interface Product {
  id: number;
  title: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  rating: ProductRating;
}

export interface ProductRating {
  rate: number;
  count: number;
}

/** A category landing view: the best-rated items, then everything else. */
export interface CategoryView {
  category: string;
  topRated: Product[];
  others: Product[];
}

export interface Enquiry {
  productId: number;
  name: string;
  email: string;
  message: string;
}

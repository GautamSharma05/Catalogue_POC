export interface Product {
  id: number;
  title: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  rating: { rate: number; count: number };
}

export interface CategoryView {
  category: string;
  topRated: Product[];
  others: Product[];
}

export interface EnquiryInput {
  productId: number;
  name: string;
  email: string;
  message: string;
}

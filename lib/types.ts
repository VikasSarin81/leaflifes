export type Category = {
  id: string;
  name: string;
  slug: string;
};

export type ProductVariant = {
  id: string;
  label: string; // e.g. "100 pieces", "250ml"
  sku: string;
  price: number; // in paise-free rupees, e.g. 499
  stock: number;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  images: string[];
  categorySlug: string;
  mrp: number;
  price: number;
  rating: number; // 0–5
  reviewCount: number;
  tags: string[];
  variants: ProductVariant[];
  isNewArrival?: boolean;
  isBestSeller?: boolean;
};

export type CartLine = {
  productId: string;
  variantId: string;
  quantity: number;
};

import { prisma } from "./prisma";
import type { Category, Product } from "./types";

// This file now reads from Postgres via Prisma instead of an in-memory
// array. The exported function names/signatures are unchanged from the
// demo-data version, so app/shop, app/products/[slug], and app/cart all
// keep working without edits.

function toProduct(p: {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  mrp: unknown;
  price: unknown;
  tags: string[];
  isNewArrival: boolean;
  isBestSeller: boolean;
  category: { slug: string };
  images: { url: string; position: number }[];
  variants: {
    id: string;
    label: string;
    sku: string;
    price: unknown;
    stock: number;
  }[];
}): Product {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    shortDescription: p.shortDescription,
    description: p.description,
    images: [...p.images]
      .sort((a, b) => a.position - b.position)
      .map((img) => img.url),
    categorySlug: p.category.slug,
    mrp: Number(p.mrp),
    price: Number(p.price),
    rating: 0, // wire up once the Review model exists (later phase)
    reviewCount: 0,
    tags: p.tags,
    isNewArrival: p.isNewArrival,
    isBestSeller: p.isBestSeller,
    variants: p.variants.map((v) => ({
      id: v.id,
      label: v.label,
      sku: v.sku,
      price: Number(v.price),
      stock: v.stock,
    })),
  };
}

const productInclude = {
  category: true,
  images: true,
  variants: true,
} as const;

export async function getCategories(): Promise<Category[]> {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
  });
  return categories.map((c) => ({ id: c.id, name: c.name, slug: c.slug }));
}

export async function getProducts(filters?: {
  categorySlug?: string;
  query?: string;
  sort?: "newest" | "price-asc" | "price-desc" | "rating";
}): Promise<Product[]> {
  const products = await prisma.product.findMany({
    where: {
      status: "PUBLISHED",
      category: filters?.categorySlug
        ? { slug: filters.categorySlug }
        : undefined,
      ...(filters?.query
        ? {
            OR: [
              { name: { contains: filters.query, mode: "insensitive" } },
              { tags: { has: filters.query.toLowerCase() } },
            ],
          }
        : {}),
    },
    include: productInclude,
    orderBy:
      filters?.sort === "price-asc"
        ? { price: "asc" }
        : filters?.sort === "price-desc"
        ? { price: "desc" }
        : filters?.sort === "newest"
        ? { createdAt: "desc" }
        : undefined,
  });

  return products.map(toProduct);
}

export async function getProductBySlug(
  slug: string
): Promise<Product | undefined> {
  const product = await prisma.product.findUnique({
    where: { slug },
    include: productInclude,
  });
  return product ? toProduct(product) : undefined;
}

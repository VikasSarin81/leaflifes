import Link from "next/link";
import { getCategories, getProducts } from "@/lib/products";
import ProductCard from "@/components/ProductCard";

export const dynamic = "force-dynamic";

type Sort = "newest" | "price-asc" | "price-desc" | "rating";

export default async function ShopPage({
  searchParams,
}: {
  searchParams: { category?: string; sort?: Sort; q?: string };
}) {
  const [categories, products] = await Promise.all([
    getCategories(),
    getProducts({
      categorySlug: searchParams.category,
      sort: searchParams.sort,
      query: searchParams.q,
    }),
  ]);

  const activeCategory = searchParams.category;

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6">
        <h1 className="font-display text-3xl text-ink">Shop</h1>

        <form className="flex items-center gap-2" action="/shop">
          {activeCategory && (
            <input type="hidden" name="category" value={activeCategory} />
          )}
          <label htmlFor="sort" className="text-sm text-ink/60">
            Sort
          </label>
          <select
            id="sort"
            name="sort"
            defaultValue={searchParams.sort ?? ""}
            className="border border-ink/30 bg-parchment px-3 py-1.5 text-sm"
          >
            <option value="">Featured</option>
            <option value="newest">Newest</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
            <option value="rating">Top rated</option>
          </select>
        </form>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <Link
          href="/shop"
          className={`px-3 py-1.5 text-sm ${
            !activeCategory
              ? "bg-ink text-parchment"
              : "border border-ink/30 hover:bg-ink/5"
          }`}
        >
          All
        </Link>
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/shop?category=${cat.slug}`}
            className={`px-3 py-1.5 text-sm ${
              activeCategory === cat.slug
                ? "bg-ink text-parchment"
                : "border border-ink/30 hover:bg-ink/5"
            }`}
          >
            {cat.name}
          </Link>
        ))}
      </div>

      {products.length === 0 ? (
        <p className="mt-16 text-center text-ink/60">
          No products match this filter yet.
        </p>
      ) : (
        <div className="mt-10 grid grid-cols-2 gap-x-6 gap-y-12 md:grid-cols-3">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}

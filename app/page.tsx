import Link from "next/link";
import Image from "next/image";
import { getProducts } from "@/lib/products";
import ProductCard from "@/components/ProductCard";

export default async function HomePage() {
  const bestSellers = (await getProducts()).filter((p) => p.isBestSeller);

  return (
    <div>
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-6 py-16 md:grid-cols-2 md:py-24">
        <div>
          <h1 className="font-display text-4xl leading-[1.1] text-ink md:text-5xl">
            Fewer ingredients.
            <br />
            Ones you can pronounce.
          </h1>
          <p className="mt-5 max-w-prose text-ink/70">
            LEAFLIFE makes skin, hair, and wellness essentials the way they
            were made before "natural" needed a marketing department behind
            it — cold-pressed, hand-blended, and priced like the middleman
            was cut, because it was.
          </p>
          <Link
            href="/shop"
            className="mt-8 inline-block bg-moss px-6 py-3 text-sm text-parchment transition-colors hover:bg-moss-dark"
          >
            Shop the range
          </Link>
        </div>
        <div className="relative aspect-square overflow-hidden">
          <Image
            src="https://images.unsplash.com/photo-1556228720-195a672e8a03?w=900"
            alt="LEAFLIFE natural ingredients laid out on linen"
            fill
            sizes="(min-width: 768px) 50vw, 100vw"
            className="object-cover"
            priority
          />
        </div>
      </section>

      {bestSellers.length > 0 && (
        <section className="mx-auto max-w-6xl px-6 pb-20">
          <h2 className="font-display text-2xl text-ink">Best sellers</h2>
          <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-3">
            {bestSellers.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

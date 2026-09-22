import Link from "next/link";
import Image from "next/image";
import { getProducts } from "@/lib/products";
import { prisma } from "@/lib/prisma";
import ProductCard from "@/components/ProductCard";

// This page queries the database on every request rather than being frozen
// at build time — needed since product/stock data changes constantly, and
// it also avoids the build itself needing a live database connection.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [bestSellers, hero, story] = await Promise.all([
    getProducts().then((products) => products.filter((p) => p.isBestSeller)),
    prisma.banner.findUnique({ where: { id: "hero" } }),
    prisma.banner.findUnique({ where: { id: "story" } }),
  ]);

  const headline = hero?.headline ?? "Fewer ingredients.\nOnes you can pronounce.";
  const description =
    hero?.description ??
    `LEAFLIFE makes skin, hair, and wellness essentials the way they were made before "natural" needed a marketing department behind it — cold-pressed, hand-blended, and priced like the middleman was cut, because it was.`;
  const buttonText = hero?.buttonText ?? "Shop the range";
  const buttonUrl = hero?.buttonUrl ?? "/shop";
  const imageUrl = hero?.imageUrl || "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=900";

  return (
    <div>
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-6 py-16 md:grid-cols-2 md:py-24">
        <div>
          <h1 className="whitespace-pre-line font-display text-4xl leading-[1.1] text-ink md:text-5xl">
            {headline}
          </h1>
          <p className="mt-5 max-w-prose text-ink/70">{description}</p>
          <Link
            href={buttonUrl}
            className="mt-8 inline-block bg-moss px-6 py-3 text-sm text-parchment transition-colors hover:bg-moss-dark"
          >
            {buttonText}
          </Link>
        </div>
        <div className="relative aspect-square overflow-hidden">
          <Image
            src={imageUrl}
            alt="LEAFLIFE"
            fill
            sizes="(min-width: 768px) 50vw, 100vw"
            className="object-cover"
            priority
          />
        </div>
      </section>

      {story?.headline && (
        <section className="mx-auto grid max-w-6xl items-center gap-10 px-6 py-16 md:grid-cols-2">
          {story.imageUrl && (
            <div className="relative aspect-square overflow-hidden order-last md:order-first">
              <Image
                src={story.imageUrl}
                alt=""
                fill
                sizes="(min-width: 768px) 50vw, 100vw"
                className="object-cover"
              />
            </div>
          )}
          <div>
            <h2 className="whitespace-pre-line font-display text-3xl leading-[1.1] text-ink">
              {story.headline}
            </h2>
            <p className="mt-4 max-w-prose text-ink/70">{story.description}</p>
            {story.buttonText && story.buttonUrl && (
              <Link
                href={story.buttonUrl}
                className="mt-6 inline-block border border-ink px-6 py-3 text-sm text-ink transition-colors hover:bg-ink hover:text-parchment"
              >
                {story.buttonText}
              </Link>
            )}
          </div>
        </section>
      )}

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

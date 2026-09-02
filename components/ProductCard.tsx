import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/types";

export default function ProductCard({ product }: { product: Product }) {
  const discount = Math.round(
    ((product.mrp - product.price) / product.mrp) * 100
  );

  return (
    <Link href={`/products/${product.slug}`} className="group block">
      <div className="relative aspect-[4/5] overflow-hidden bg-line/40">
        {product.images[0] ? (
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(min-width: 768px) 25vw, 50vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-ink/40">
            No image
          </div>
        )}
        {discount > 0 && (
          <span className="absolute left-3 top-3 bg-clay px-2 py-1 text-xs text-parchment">
            {discount}% off
          </span>
        )}
      </div>

      <div className="mt-3 space-y-1">
        <h3 className="font-display text-lg leading-snug text-ink">
          {product.name}
        </h3>
        <p className="text-sm text-ink/60">{product.shortDescription}</p>
        <div className="flex items-baseline gap-2 pt-1">
          <span className="font-medium text-ink">₹{product.price}</span>
          {product.mrp > product.price && (
            <span className="text-sm text-ink/40 line-through">
              ₹{product.mrp}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

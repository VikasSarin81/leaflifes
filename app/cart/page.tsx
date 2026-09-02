"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import QuantityStepper from "@/components/QuantityStepper";
import type { Product } from "@/lib/types";

export default function CartPage() {
  const { lines, updateQuantity, removeItem } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => {
        setProducts(data);
        setLoaded(true);
      });
  }, []);

  if (!loaded) {
    return <div className="mx-auto max-w-4xl px-6 py-12">Loading cart…</div>;
  }

  const resolved = lines
    .map((line) => {
      const product = products.find((p) => p.id === line.productId);
      const variant = product?.variants.find((v) => v.id === line.variantId);
      if (!product || !variant) return null;
      return { line, product, variant };
    })
    .filter(Boolean) as {
    line: (typeof lines)[number];
    product: Product;
    variant: Product["variants"][number];
  }[];

  const subtotal = resolved.reduce(
    (sum, r) => sum + r.variant.price * r.line.quantity,
    0
  );

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-20 text-center">
        <h1 className="font-display text-2xl text-ink">Your cart is empty</h1>
        <p className="mt-2 text-ink/60">Nothing here yet — go find something worth adding.</p>
        <Link
          href="/shop"
          className="mt-6 inline-block bg-moss px-6 py-3 text-sm text-parchment hover:bg-moss-dark"
        >
          Browse the shop
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="font-display text-3xl text-ink">Your cart</h1>

      <ul className="mt-8 divide-y divide-line">
        {resolved.map(({ line, product, variant }) => (
          <li key={variant.id} className="flex gap-4 py-6">
            <div className="relative h-24 w-24 shrink-0 overflow-hidden bg-line/40">
              {product.images[0] ? (
                <Image
                  src={product.images[0]}
                  alt={product.name}
                  fill
                  sizes="96px"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-[10px] text-ink/40">
                  No image
                </div>
              )}
            </div>

            <div className="flex flex-1 flex-col justify-between">
              <div className="flex justify-between gap-4">
                <div>
                  <Link
                    href={`/products/${product.slug}`}
                    className="font-medium text-ink hover:text-moss"
                  >
                    {product.name}
                  </Link>
                  <p className="text-sm text-ink/50">{variant.label}</p>
                </div>
                <p className="whitespace-nowrap font-medium text-ink">
                  ₹{variant.price * line.quantity}
                </p>
              </div>

              <div className="flex items-center justify-between">
                <QuantityStepper
                  quantity={line.quantity}
                  onChange={(q) => updateQuantity(variant.id, q)}
                  max={variant.stock}
                />
                <button
                  type="button"
                  onClick={() => removeItem(variant.id)}
                  className="text-sm text-ink/50 underline hover:text-clay"
                >
                  Remove
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-8 flex flex-col items-end gap-1 border-t border-line pt-6">
        <div className="flex w-full max-w-xs justify-between text-sm text-ink/60">
          <span>Subtotal</span>
          <span>₹{subtotal}</span>
        </div>
        <p className="w-full max-w-xs text-right text-xs text-ink/40">
          GST and shipping calculated at checkout
        </p>
        <Link
          href="/checkout"
          className="mt-4 block w-full max-w-xs bg-moss px-6 py-3 text-center text-sm text-parchment hover:bg-moss-dark"
        >
          Checkout
        </Link>
      </div>
    </div>
  );
}

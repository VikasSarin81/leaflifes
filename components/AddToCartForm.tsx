"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Product } from "@/lib/types";
import { useCart } from "@/lib/cart-context";
import QuantityStepper from "./QuantityStepper";

export default function AddToCartForm({ product }: { product: Product }) {
  const { addItem } = useCart();
  const router = useRouter();
  const [variantId, setVariantId] = useState(product.variants[0]?.id);
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  const variant = product.variants.find((v) => v.id === variantId);
  if (!variant) return null;

  const outOfStock = variant.stock === 0;

  return (
    <div className="space-y-6">
      <div>
        <span className="font-medium text-ink">₹{variant.price}</span>
        {product.mrp > variant.price && (
          <span className="ml-2 text-sm text-ink/40 line-through">
            ₹{product.mrp}
          </span>
        )}
      </div>

      {product.variants.length > 1 && (
        <div>
          <p className="mb-2 text-sm text-ink/60">Size</p>
          <div className="flex flex-wrap gap-2">
            {product.variants.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => {
                  setVariantId(v.id);
                  setQuantity(1);
                }}
                disabled={v.stock === 0}
                className={`border px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-40 ${
                  v.id === variantId
                    ? "border-ink bg-ink text-parchment"
                    : "border-ink/30 hover:bg-ink/5"
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-4">
        <QuantityStepper
          quantity={quantity}
          onChange={setQuantity}
          max={variant.stock}
        />
        {outOfStock ? (
          <span className="text-sm text-clay">Out of stock</span>
        ) : (
          <span className="text-sm text-ink/50">{variant.stock} in stock</span>
        )}
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          disabled={outOfStock}
          onClick={() => {
            addItem(product.id, variant.id, quantity);
            setJustAdded(true);
            setTimeout(() => setJustAdded(false), 1800);
          }}
          className="flex-1 bg-moss px-6 py-3 text-sm text-parchment transition-colors hover:bg-moss-dark disabled:cursor-not-allowed disabled:bg-ink/20"
        >
          {justAdded ? "Added" : "Add to cart"}
        </button>
        <button
          type="button"
          disabled={outOfStock}
          onClick={() => {
            addItem(product.id, variant.id, quantity);
            router.push("/cart");
          }}
          className="flex-1 border border-ink px-6 py-3 text-sm text-ink transition-colors hover:bg-ink hover:text-parchment disabled:cursor-not-allowed disabled:opacity-30"
        >
          Buy now
        </button>
      </div>
    </div>
  );
}

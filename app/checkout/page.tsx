"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { useCart } from "@/lib/cart-context";
import type { Product } from "@/lib/types";

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => {
      open: () => void;
    };
  }
}

const FREE_SHIPPING_THRESHOLD = 999;
const FLAT_SHIPPING = 49;

export default function CheckoutPage() {
  const { status } = useSession();
  const router = useRouter();
  const { lines, clearCart } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountAmount: number } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    pincode: "",
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?next=/checkout");
    }
  }, [status, router]);

  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then(setProducts);
  }, []);

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

  const subtotal = resolved.reduce((sum, r) => sum + r.variant.price * r.line.quantity, 0);
  const shippingCost = subtotal >= FREE_SHIPPING_THRESHOLD || subtotal === 0 ? 0 : FLAT_SHIPPING;
  const discountAmount = appliedCoupon?.discountAmount ?? 0;
  const total = subtotal - discountAmount + shippingCost;

  // A previously applied coupon may no longer be valid if the cart changed
  // (e.g. dropped below the minimum order value) — clear it rather than
  // silently keep charging a stale discount.
  useEffect(() => {
    setAppliedCoupon(null);
    setCouponError(null);
  }, [subtotal]);

  async function applyCoupon() {
    setApplyingCoupon(true);
    setCouponError(null);
    const res = await fetch("/api/checkout/apply-coupon", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: couponInput, subtotal }),
    });
    const data = await res.json();
    setApplyingCoupon(false);

    if (!res.ok) {
      setCouponError(data.error ?? "Couldn't apply that coupon.");
      setAppliedCoupon(null);
      return;
    }
    setAppliedCoupon({ code: data.code, discountAmount: data.discountAmount });
  }

  function updateField(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handlePay(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (resolved.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    setSubmitting(true);

    const res = await fetch("/api/checkout/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        shipping: form,
        lines: lines.map((l) => ({ variantId: l.variantId, quantity: l.quantity })),
        couponCode: appliedCoupon?.code,
      }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Something went wrong. Try again.");
      setSubmitting(false);
      return;
    }

    const razorpay = new window.Razorpay({
      key: data.keyId,
      amount: data.amount,
      currency: data.currency,
      name: "LEAFLIFE",
      description: `Order ${data.orderNumber}`,
      order_id: data.razorpayOrderId,
      prefill: {
        name: data.customerName,
        contact: form.phone,
      },
      theme: { color: "#35492E" },
      handler: async (response: {
        razorpay_order_id: string;
        razorpay_payment_id: string;
        razorpay_signature: string;
      }) => {
        const verifyRes = await fetch("/api/checkout/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId: data.orderId, ...response }),
        });
        const verifyData = await verifyRes.json();

        if (!verifyRes.ok) {
          setError("Payment succeeded but verification failed — contact support with your order number: " + data.orderNumber);
          setSubmitting(false);
          return;
        }

        clearCart();
        router.push(`/order-confirmation/${verifyData.orderNumber}`);
      },
      modal: {
        ondismiss: () => setSubmitting(false),
      },
    });

    razorpay.open();
  }

  if (status === "loading") return null;

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      <h1 className="font-display text-3xl text-ink">Checkout</h1>

      <div className="mt-8 grid gap-10 md:grid-cols-2">
        <form onSubmit={handlePay} className="space-y-4">
          <h2 className="font-display text-lg text-ink">Shipping details</h2>

          <input
            required
            placeholder="Full name"
            value={form.name}
            onChange={(e) => updateField("name", e.target.value)}
            className="w-full border border-ink/30 bg-parchment px-3 py-2"
          />
          <input
            required
            placeholder="Phone number"
            value={form.phone}
            onChange={(e) => updateField("phone", e.target.value)}
            className="w-full border border-ink/30 bg-parchment px-3 py-2"
          />
          <input
            required
            placeholder="Address line 1"
            value={form.line1}
            onChange={(e) => updateField("line1", e.target.value)}
            className="w-full border border-ink/30 bg-parchment px-3 py-2"
          />
          <input
            placeholder="Address line 2 (optional)"
            value={form.line2}
            onChange={(e) => updateField("line2", e.target.value)}
            className="w-full border border-ink/30 bg-parchment px-3 py-2"
          />
          <div className="grid grid-cols-2 gap-4">
            <input
              required
              placeholder="City"
              value={form.city}
              onChange={(e) => updateField("city", e.target.value)}
              className="border border-ink/30 bg-parchment px-3 py-2"
            />
            <input
              required
              placeholder="State"
              value={form.state}
              onChange={(e) => updateField("state", e.target.value)}
              className="border border-ink/30 bg-parchment px-3 py-2"
            />
          </div>
          <input
            required
            placeholder="Pincode"
            value={form.pincode}
            onChange={(e) => updateField("pincode", e.target.value)}
            className="w-full border border-ink/30 bg-parchment px-3 py-2"
          />

          {error && <p className="text-sm text-clay">{error}</p>}

          <button
            type="submit"
            disabled={submitting || resolved.length === 0}
            className="w-full bg-moss px-6 py-3 text-sm text-parchment hover:bg-moss-dark disabled:opacity-60"
          >
            {submitting ? "Opening payment…" : `Pay ₹${total}`}
          </button>
        </form>

        <div>
          <h2 className="font-display text-lg text-ink">Order summary</h2>
          <ul className="mt-4 divide-y divide-line text-sm">
            {resolved.map(({ product, variant, line }) => (
              <li key={variant.id} className="flex justify-between py-3">
                <span>
                  {product.name} ({variant.label}) × {line.quantity}
                </span>
                <span>₹{variant.price * line.quantity}</span>
              </li>
            ))}
          </ul>

          <div className="mt-4 border-t border-line pt-4">
            {appliedCoupon ? (
              <div className="flex items-center justify-between rounded bg-moss/10 px-3 py-2 text-sm">
                <span className="text-moss-dark">
                  &ldquo;{appliedCoupon.code}&rdquo; applied — ₹{appliedCoupon.discountAmount} off
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setAppliedCoupon(null);
                    setCouponInput("");
                  }}
                  className="text-xs text-ink/50 underline"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    placeholder="Coupon code"
                    className="flex-1 rounded border border-line px-3 py-2 text-sm uppercase"
                  />
                  <button
                    type="button"
                    onClick={applyCoupon}
                    disabled={applyingCoupon || !couponInput.trim()}
                    className="rounded border border-moss px-4 py-2 text-sm text-moss-dark disabled:opacity-50"
                  >
                    {applyingCoupon ? "Checking…" : "Apply"}
                  </button>
                </div>
                {couponError && <p className="mt-1 text-xs text-clay">{couponError}</p>}
              </div>
            )}
          </div>

          <div className="mt-4 space-y-1 border-t border-line pt-4 text-sm">
            <div className="flex justify-between text-ink/70">
              <span>Subtotal</span>
              <span>₹{subtotal}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-moss-dark">
                <span>Discount</span>
                <span>−₹{discountAmount}</span>
              </div>
            )}
            <div className="flex justify-between text-ink/70">
              <span>Shipping</span>
              <span>{shippingCost === 0 ? "Free" : `₹${shippingCost}`}</span>
            </div>
            <div className="flex justify-between font-medium text-ink">
              <span>Total</span>
              <span>₹{total}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

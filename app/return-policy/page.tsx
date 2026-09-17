export const metadata = {
  title: "Return & Refund Policy",
  description: "LEAFLIFE's return and refund policy.",
};

export default function ReturnPolicyPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-display text-3xl text-ink">Return &amp; Refund Policy</h1>

      <div className="mt-8 space-y-6 text-ink/80">
        <section>
          <h2 className="font-display text-xl text-ink">Returns</h2>
          <p className="mt-2">
            We accept returns within <strong>7 days</strong> of delivery for
            unopened, unused products in their original packaging. Because
            our products are personal care items, we're unable to accept
            returns on opened or used products for hygiene reasons, unless
            the product arrived damaged or defective.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl text-ink">Damaged or incorrect items</h2>
          <p className="mt-2">
            If your order arrives damaged, defective, or isn't what you
            ordered, contact us within 48 hours of delivery with a photo of
            the item and we'll arrange a replacement or full refund at no
            cost to you.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl text-ink">How to request a return</h2>
          <p className="mt-2">
            Email us at the address on our{" "}
            <a href="/contact" className="underline hover:text-moss">
              Contact page
            </a>{" "}
            with your order number and reason for return. We'll confirm
            eligibility and send you return instructions.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl text-ink">Refunds</h2>
          <p className="mt-2">
            Once we receive and inspect your return, refunds are processed
            to your original payment method within 5–7 business days.
            Shipping charges are non-refundable unless the return is due to
            our error.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl text-ink">Shipping costs for returns</h2>
          <p className="mt-2">
            For returns due to change of mind, return shipping is the
            customer's responsibility. For damaged, defective, or incorrect
            items, we cover return shipping.
          </p>
        </section>
      </div>

      <p className="mt-10 text-sm text-ink/50">
        Questions about a specific order?{" "}
        <a href="/contact" className="underline hover:text-moss">
          Get in touch
        </a>
        .
      </p>
    </div>
  );
}

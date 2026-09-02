import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-line bg-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-6 py-12 text-sm md:grid-cols-4">
        <div>
          <p className="font-display text-lg text-ink">leaflife</p>
          <p className="mt-2 max-w-[220px] text-ink/60">
            &ldquo;Born Natural, Stay Natural&rdquo; — skin, hair, and
            wellness essentials made the older way.
          </p>
        </div>

        <div>
          <p className="font-medium text-ink">Shop</p>
          <ul className="mt-3 space-y-2 text-ink/60">
            <li><Link href="/shop" className="hover:text-moss">All products</Link></li>
            <li><Link href="/shop?category=skin-care" className="hover:text-moss">Skin</Link></li>
            <li><Link href="/shop?category=hair-care" className="hover:text-moss">Hair</Link></li>
            <li><Link href="/shop?category=wellness" className="hover:text-moss">Wellness</Link></li>
          </ul>
        </div>

        <div>
          <p className="font-medium text-ink">Company</p>
          <ul className="mt-3 space-y-2 text-ink/60">
            <li><Link href="/about" className="hover:text-moss">About us</Link></li>
            <li><Link href="/contact" className="hover:text-moss">Contact us</Link></li>
          </ul>
        </div>

        <div>
          <p className="font-medium text-ink">Account</p>
          <ul className="mt-3 space-y-2 text-ink/60">
            <li><Link href="/account" className="hover:text-moss">My account</Link></li>
            <li><Link href="/cart" className="hover:text-moss">Cart</Link></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-line px-6 py-4 text-center text-xs text-ink/40">
        © {new Date().getFullYear()} LEAFLIFE. All rights reserved.
      </div>
    </footer>
  );
}

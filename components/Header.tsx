"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useCart } from "@/lib/cart-context";

export default function Header() {
  const { itemCount } = useCart();
  const { data: session, status } = useSession();

  return (
    <header className="border-b border-line">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <Link href="/" className="flex items-center">
          <Image
            src="/logo.jpeg"
            alt="LEAFLIFE — Born Natural, Stay Natural"
            width={160}
            height={113}
            priority
            className="h-14 w-auto object-contain md:h-16"
          />
        </Link>

        <nav className="hidden gap-8 text-sm md:flex">
          <Link href="/shop" className="hover:text-moss">
            Shop
          </Link>
          <Link href="/shop?category=skin-care" className="hover:text-moss">
            Skin
          </Link>
          <Link href="/shop?category=hair-care" className="hover:text-moss">
            Hair
          </Link>
          <Link href="/shop?category=wellness" className="hover:text-moss">
            Wellness
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          {status === "authenticated" ? (
            <Link href="/account" className="text-sm hover:text-moss">
              {session.user?.name?.split(" ")[0] ?? "Account"}
            </Link>
          ) : (
            <Link href="/login" className="text-sm hover:text-moss">
              Log in
            </Link>
          )}

          <Link
            href="/cart"
            className="flex items-center gap-2 rounded-full border border-ink px-4 py-1.5 text-sm hover:bg-ink hover:text-parchment transition-colors"
          >
            Cart
            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-moss px-1 text-xs text-parchment">
              {itemCount}
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
}

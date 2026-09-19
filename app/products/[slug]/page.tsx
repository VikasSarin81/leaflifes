import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getProductBySlug } from "@/lib/products";
import { getApprovedReviews, getReviewEligibility } from "@/lib/reviews";
import AddToCartForm from "@/components/AddToCartForm";
import ProductGallery from "@/components/ProductGallery";
import ReviewForm from "@/components/ReviewForm";

type Props = { params: { slug: string } };

// Dynamic per-product title/description instead of the site-wide default —
// this is what shows up as the actual clickable headline in Google search
// results, and what gets shown when a product link is shared on WhatsApp
// or social media.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getProductBySlug(params.slug);
  if (!product) return {};

  const description = product.shortDescription || product.description.replace(/<[^>]+>/g, "").slice(0, 160);

  return {
    title: product.name,
    description,
    openGraph: {
      title: product.name,
      description,
      images: product.images[0] ? [{ url: product.images[0] }] : undefined,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description,
      images: product.images[0] ? [product.images[0]] : undefined,
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const product = await getProductBySlug(params.slug);
  if (!product) notFound();

  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;

  const [reviews, eligibility] = await Promise.all([
    getApprovedReviews(product.id),
    getReviewEligibility(userId, product.id),
  ]);

  const inStock = product.variants.some((v) => v.stock > 0);
  const siteUrl = process.env.NEXTAUTH_URL!.replace(/\/$/, "");

  // Product structured data (Schema.org) — this is what lets Google show
  // price, star rating, and stock status directly in search results
  // instead of just a plain blue link.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.shortDescription || undefined,
    image: product.images,
    sku: product.variants[0]?.sku,
    brand: { "@type": "Brand", name: "LEAFLIFE" },
    offers: {
      "@type": "Offer",
      url: `${siteUrl}/products/${product.slug}`,
      priceCurrency: "INR",
      price: product.price,
      availability: inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    },
    ...(product.reviewCount > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: product.rating,
            reviewCount: product.reviewCount,
          },
        }
      : {}),
  };

  return (
    <>
    <div className="mx-auto grid max-w-6xl gap-12 px-6 py-12 md:grid-cols-2">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <ProductGallery images={product.images} productName={product.name} />


      <div>
        <h1 className="font-display text-3xl text-ink">{product.name}</h1>
        <div className="mt-2 flex items-center gap-2 text-sm text-ink/60">
          <span>★ {product.rating.toFixed(1)}</span>
          <span>·</span>
          <span>{product.reviewCount} reviews</span>
        </div>
        <div
          className="prose prose-sm mt-4 max-w-prose text-ink/70"
          dangerouslySetInnerHTML={{ __html: product.description }}
        />

        <div className="mt-8">
          <AddToCartForm product={product} />
        </div>
      </div>
    </div>

    <div className="mx-auto max-w-3xl px-6 pb-16">
      <h2 className="font-display text-2xl text-ink">
        Reviews {product.reviewCount > 0 && `(${product.reviewCount})`}
      </h2>

      <div className="mt-6 space-y-6">
        {reviews.map((r) => (
          <div key={r.id} className="border-b border-line pb-6">
            <div className="flex items-center gap-2">
              <span className="text-turmeric">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span>
              {r.title && <span className="font-medium text-ink">{r.title}</span>}
            </div>
            <p className="mt-2 text-sm text-ink/70">{r.comment}</p>
            <p className="mt-2 text-xs text-ink/40">
              {r.reviewerName} · Verified purchase · {r.createdAt.toLocaleDateString("en-IN")}
            </p>
          </div>
        ))}
        {reviews.length === 0 && (
          <p className="text-sm text-ink/50">No reviews yet — be the first.</p>
        )}
      </div>

      <div className="mt-8">
        {eligibility.canReview && <ReviewForm productId={product.id} />}
        {eligibility.reason === "not-logged-in" && (
          <p className="text-sm text-ink/50">
            <a href="/login" className="underline hover:text-moss">Log in</a> to review this product if you've purchased it.
          </p>
        )}
        {eligibility.reason === "already-reviewed" && (
          <p className="text-sm text-ink/50">You've already reviewed this product — thanks!</p>
        )}
        {/* "not-purchased" intentionally shows nothing — no need to
            advertise the verification rule to someone browsing who hasn't
            bought anything yet. */}
      </div>
    </div>
    </>
  );
}

import { notFound } from "next/navigation";
import { getProductBySlug } from "@/lib/products";
import AddToCartForm from "@/components/AddToCartForm";
import ProductGallery from "@/components/ProductGallery";

export default async function ProductPage({
  params,
}: {
  params: { slug: string };
}) {
  const product = await getProductBySlug(params.slug);
  if (!product) notFound();

  return (
    <div className="mx-auto grid max-w-6xl gap-12 px-6 py-12 md:grid-cols-2">
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
  );
}

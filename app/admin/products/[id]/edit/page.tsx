import { prisma } from "@/lib/prisma";
import ProductForm from "@/components/admin/ProductForm";
import { notFound } from "next/navigation";

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const [product, categories] = await Promise.all([
    prisma.product.findUnique({
      where: { id: params.id },
      include: { images: true, variants: true },
    }),
    prisma.category.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  if (!product) notFound();

  return (
    <div>
      <h1 className="font-display text-2xl text-moss-dark">Edit product</h1>
      <div className="mt-6">
        <ProductForm
          categories={categories}
          initial={{
            id: product.id,
            name: product.name,
            slug: product.slug,
            categoryId: product.categoryId,
            shortDescription: product.shortDescription,
            description: product.description,
            mrp: product.mrp.toString(),
            price: product.price.toString(),
            tags: product.tags.join(", "),
            status: product.status,
            isFeatured: product.isFeatured,
            isBestSeller: product.isBestSeller,
            isNewArrival: product.isNewArrival,
            images: product.images
              .sort((a, b) => a.position - b.position)
              .map((img) => ({ id: img.id, url: img.url, publicId: img.publicId ?? undefined, isPrimary: img.isPrimary })),
            variants: product.variants.map((v) => ({
              id: v.id,
              label: v.label,
              sku: v.sku,
              price: v.price.toString(),
              stock: v.stock.toString(),
            })),
          }}
        />
      </div>
    </div>
  );
}

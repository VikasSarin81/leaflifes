import { prisma } from "@/lib/prisma";
import ProductForm from "@/components/admin/ProductForm";

export default async function NewProductPage() {
  const categories = await prisma.category.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <h1 className="font-display text-2xl text-moss-dark">Add product</h1>
      <div className="mt-6">
        <ProductForm
          categories={categories}
          initial={{
            name: "",
            slug: "",
            categoryId: "",
            shortDescription: "",
            description: "",
            mrp: "",
            price: "",
            tags: "",
            status: "DRAFT",
            isFeatured: false,
            isBestSeller: false,
            isNewArrival: false,
            images: [],
            variants: [],
          }}
        />
      </div>
    </div>
  );
}

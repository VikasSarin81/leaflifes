import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-auth";
import { revalidatePath } from "next/cache";

async function createCategory(formData: FormData) {
  "use server";
  const session = await requireAdminApi();
  if (!session) return;

  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();
  if (!name || !slug) return;

  await prisma.category.create({ data: { name, slug } });
  revalidatePath("/admin/categories");
}

export default async function AdminCategoriesPage() {
  const categories = await prisma.category.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <h1 className="font-display text-2xl text-moss-dark">Categories</h1>

      <form action={createCategory} className="mt-6 flex max-w-lg gap-2">
        <input
          name="name"
          placeholder="Category name"
          className="flex-1 rounded border border-line px-3 py-2 text-sm"
        />
        <input
          name="slug"
          placeholder="slug"
          className="w-40 rounded border border-line px-3 py-2 text-sm"
        />
        <button className="rounded bg-moss px-4 py-2 text-sm text-parchment hover:bg-moss-dark">
          Add
        </button>
      </form>

      <div className="mt-6 divide-y divide-line rounded-lg border border-line bg-white">
        {categories.map((c) => (
          <div key={c.id} className="flex items-center justify-between p-3 text-sm">
            <div>
              <p className="font-medium">{c.name}</p>
              <p className="text-ink/50">/{c.slug}</p>
            </div>
            <p className="text-ink/50">{c._count.products} products</p>
          </div>
        ))}
        {categories.length === 0 && (
          <p className="p-6 text-center text-ink/50">No categories yet.</p>
        )}
      </div>
    </div>
  );
}

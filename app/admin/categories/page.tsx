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

async function updateCategory(formData: FormData) {
  "use server";
  const session = await requireAdminApi();
  if (!session) return;

  const id = String(formData.get("id"));
  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();
  if (!id || !name || !slug) return;

  await prisma.category.update({ where: { id }, data: { name, slug } });
  revalidatePath("/admin/categories");
}

async function deleteCategory(formData: FormData) {
  "use server";
  const session = await requireAdminApi();
  if (!session) return;

  const id = String(formData.get("id"));
  await prisma.category.delete({ where: { id } });
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
          <details key={c.id} className="group p-3 text-sm">
            <summary className="flex cursor-pointer items-center justify-between list-none">
              <div>
                <p className="font-medium">{c.name}</p>
                <p className="text-ink/50">/{c.slug}</p>
              </div>
              <div className="flex items-center gap-3">
                <p className="text-ink/50">{c._count.products} products</p>
                <span className="text-xs text-moss-dark underline group-open:hidden">Edit</span>
                <span className="hidden text-xs text-ink/50 underline group-open:inline">Close</span>
              </div>
            </summary>

            <div className="mt-3 border-t border-line pt-3">
              <form action={updateCategory} className="flex gap-2">
                <input type="hidden" name="id" value={c.id} />
                <input
                  name="name"
                  defaultValue={c.name}
                  className="flex-1 rounded border border-line px-3 py-2 text-sm"
                />
                <input
                  name="slug"
                  defaultValue={c.slug}
                  className="w-40 rounded border border-line px-3 py-2 text-sm"
                />
                <button className="rounded bg-moss px-4 py-2 text-sm text-parchment hover:bg-moss-dark">
                  Save
                </button>
              </form>

              <div className="mt-3">
                {c._count.products > 0 ? (
                  <p className="text-xs text-ink/50">
                    Can't delete — {c._count.products} product(s) are still in this
                    category. Move or delete those first, or just leave this category
                    in place and edit its name/slug above.
                  </p>
                ) : (
                  <form action={deleteCategory}>
                    <input type="hidden" name="id" value={c.id} />
                    <button className="text-xs text-clay underline">
                      Delete category
                    </button>
                  </form>
                )}
              </div>
            </div>
          </details>
        ))}
        {categories.length === 0 && (
          <p className="p-6 text-center text-ink/50">No categories yet.</p>
        )}
      </div>
    </div>
  );
}

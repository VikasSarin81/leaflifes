import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const q = searchParams.q ?? "";

  const products = await prisma.product.findMany({
    where: q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { slug: { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined,
    include: {
      category: { select: { name: true } },
      images: { where: { isPrimary: true }, take: 1 },
      variants: { select: { stock: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 50,
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl text-moss-dark">Products</h1>
        <Link
          href="/admin/products/new"
          className="rounded bg-moss px-4 py-2 text-sm text-parchment hover:bg-moss-dark"
        >
          Add product
        </Link>
      </div>

      <form className="mt-4">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Search by name or slug..."
          className="w-full max-w-sm rounded border border-line px-3 py-2 text-sm"
        />
      </form>

      <div className="mt-6 overflow-x-auto rounded-lg border border-line bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line text-ink/50">
            <tr>
              <th className="p-3">Product</th>
              <th className="p-3">Category</th>
              <th className="p-3">Price</th>
              <th className="p-3">Stock</th>
              <th className="p-3">Status</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => {
              const totalStock = p.variants.reduce((sum, v) => sum + v.stock, 0);
              return (
                <tr key={p.id} className="border-b border-line last:border-0">
                  <td className="flex items-center gap-3 p-3">
                    {p.images[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.images[0].url}
                        alt={p.name}
                        className="h-10 w-10 rounded object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded bg-parchment" />
                    )}
                    <span>{p.name}</span>
                  </td>
                  <td className="p-3">{p.category.name}</td>
                  <td className="p-3">₹{Number(p.price).toLocaleString("en-IN")}</td>
                  <td className="p-3">
                    <span className={totalStock === 0 ? "text-clay" : ""}>
                      {totalStock}
                    </span>
                  </td>
                  <td className="p-3">
                    <span
                      className={
                        p.status === "PUBLISHED"
                          ? "rounded bg-moss/10 px-2 py-0.5 text-xs text-moss-dark"
                          : "rounded bg-turmeric/10 px-2 py-0.5 text-xs text-turmeric"
                      }
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <Link
                      href={`/admin/products/${p.id}/edit`}
                      className="text-moss-dark underline"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              );
            })}
            {products.length === 0 && (
              <tr>
                <td colSpan={6} className="p-6 text-center text-ink/50">
                  No products found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

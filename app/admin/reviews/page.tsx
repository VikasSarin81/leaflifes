import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-auth";
import { revalidatePath } from "next/cache";

async function setStatus(formData: FormData) {
  "use server";
  const session = await requireAdminApi();
  if (!session) return;

  const id = String(formData.get("id"));
  const status = String(formData.get("status")) as "APPROVED" | "HIDDEN";
  await prisma.review.update({ where: { id }, data: { status } });
  revalidatePath("/admin/reviews");
}

async function deleteReview(formData: FormData) {
  "use server";
  const session = await requireAdminApi();
  if (!session) return;

  const id = String(formData.get("id"));
  await prisma.review.delete({ where: { id } });
  revalidatePath("/admin/reviews");
}

export default async function AdminReviewsPage() {
  const reviews = await prisma.review.findMany({
    orderBy: { createdAt: "desc" },
    include: { user: { select: { name: true, email: true } }, product: { select: { name: true, slug: true } } },
  });

  const statusStyle = {
    PENDING: "bg-turmeric/10 text-turmeric",
    APPROVED: "bg-moss/10 text-moss-dark",
    HIDDEN: "bg-clay/10 text-clay",
  };

  return (
    <div>
      <h1 className="font-display text-2xl text-moss-dark">Reviews</h1>
      <p className="mt-1 text-sm text-ink/50">
        Every review here comes from a verified purchase — approve it to show on the product page.
      </p>

      <div className="mt-6 divide-y divide-line rounded-lg border border-line bg-white">
        {reviews.map((r) => (
          <div key={r.id} className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-medium">
                  {r.product.name}{" "}
                  <span className={`ml-2 rounded px-2 py-0.5 text-xs ${statusStyle[r.status]}`}>
                    {r.status}
                  </span>
                </p>
                <p className="mt-1 text-sm text-turmeric">
                  {"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}
                </p>
                {r.title && <p className="mt-1 font-medium text-ink">{r.title}</p>}
                <p className="mt-1 text-sm text-ink/80">{r.comment}</p>
                <p className="mt-2 text-xs text-ink/40">
                  {r.user.name || r.user.email} · {r.createdAt.toLocaleDateString("en-IN")}
                </p>
              </div>

              <div className="flex shrink-0 flex-col gap-2">
                {r.status !== "APPROVED" && (
                  <form action={setStatus}>
                    <input type="hidden" name="id" value={r.id} />
                    <input type="hidden" name="status" value="APPROVED" />
                    <button className="rounded bg-moss px-3 py-1 text-xs text-parchment hover:bg-moss-dark">
                      Approve
                    </button>
                  </form>
                )}
                {r.status !== "HIDDEN" && (
                  <form action={setStatus}>
                    <input type="hidden" name="id" value={r.id} />
                    <input type="hidden" name="status" value="HIDDEN" />
                    <button className="rounded border border-line px-3 py-1 text-xs text-ink/60 hover:bg-parchment">
                      Hide
                    </button>
                  </form>
                )}
                <form action={deleteReview}>
                  <input type="hidden" name="id" value={r.id} />
                  <button className="text-xs text-clay underline">Delete</button>
                </form>
              </div>
            </div>
          </div>
        ))}
        {reviews.length === 0 && (
          <p className="p-6 text-center text-ink/50">No reviews yet.</p>
        )}
      </div>
    </div>
  );
}

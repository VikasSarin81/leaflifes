import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-auth";
import { revalidatePath } from "next/cache";

async function toggleResolved(formData: FormData) {
  "use server";
  const session = await requireAdminApi();
  if (!session) return;

  const id = String(formData.get("id"));
  const isResolved = String(formData.get("isResolved")) === "true";
  await prisma.contactEnquiry.update({ where: { id }, data: { isResolved: !isResolved } });
  revalidatePath("/admin/enquiries");
}

export default async function AdminEnquiriesPage() {
  const enquiries = await prisma.contactEnquiry.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="font-display text-2xl text-moss-dark">Enquiries</h1>

      <div className="mt-6 divide-y divide-line rounded-lg border border-line bg-white">
        {enquiries.map((e) => (
          <div key={e.id} className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-medium">
                  {e.name} <span className="font-normal text-ink/50">— {e.email}</span>
                  {e.phone && <span className="font-normal text-ink/50"> · {e.phone}</span>}
                </p>
                {e.subject && <p className="text-sm text-ink/60">{e.subject}</p>}
                <p className="mt-2 text-sm text-ink/80">{e.message}</p>
                <p className="mt-2 text-xs text-ink/40">{e.createdAt.toLocaleString("en-IN")}</p>
              </div>
              <form action={toggleResolved}>
                <input type="hidden" name="id" value={e.id} />
                <input type="hidden" name="isResolved" value={String(e.isResolved)} />
                <button
                  className={
                    e.isResolved
                      ? "rounded bg-moss/10 px-3 py-1 text-xs text-moss-dark"
                      : "rounded bg-turmeric/10 px-3 py-1 text-xs text-turmeric"
                  }
                >
                  {e.isResolved ? "Resolved" : "Mark resolved"}
                </button>
              </form>
            </div>
          </div>
        ))}
        {enquiries.length === 0 && (
          <p className="p-6 text-center text-ink/50">No enquiries yet.</p>
        )}
      </div>
    </div>
  );
}

import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-auth";
import { revalidatePath } from "next/cache";

async function createCoupon(formData: FormData) {
  "use server";
  const session = await requireAdminApi();
  if (!session) return;

  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  const discountType = String(formData.get("discountType") ?? "PERCENTAGE") as "PERCENTAGE" | "FIXED";
  const percentage = formData.get("percentage") ? Number(formData.get("percentage")) : null;
  const fixedAmount = formData.get("fixedAmount") ? Number(formData.get("fixedAmount")) : null;
  const minOrderValue = formData.get("minOrderValue") ? Number(formData.get("minOrderValue")) : null;
  const maxDiscount = formData.get("maxDiscount") ? Number(formData.get("maxDiscount")) : null;
  const usageLimit = formData.get("usageLimit") ? parseInt(String(formData.get("usageLimit")), 10) : null;
  const perCustomerLimit = formData.get("perCustomerLimit")
    ? parseInt(String(formData.get("perCustomerLimit")), 10)
    : null;
  const startDate = new Date(String(formData.get("startDate")));
  const expiryDate = new Date(String(formData.get("expiryDate")));

  if (!code || !startDate.getTime() || !expiryDate.getTime()) return;

  await prisma.coupon.create({
    data: {
      code,
      discountType,
      percentage,
      fixedAmount,
      minOrderValue,
      maxDiscount,
      usageLimit,
      perCustomerLimit,
      startDate,
      expiryDate,
    },
  });
  revalidatePath("/admin/coupons");
}

async function toggleActive(formData: FormData) {
  "use server";
  const session = await requireAdminApi();
  if (!session) return;

  const id = String(formData.get("id"));
  const isActive = String(formData.get("isActive")) === "true";
  await prisma.coupon.update({ where: { id }, data: { isActive: !isActive } });
  revalidatePath("/admin/coupons");
}

export default async function AdminCouponsPage() {
  const coupons = await prisma.coupon.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { usages: true } } },
  });

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div>
      <h1 className="font-display text-2xl text-moss-dark">Coupons</h1>

      <form action={createCoupon} className="mt-6 grid max-w-2xl gap-3 rounded-lg border border-line bg-white p-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-1">
            <label className="text-xs text-ink/60">Coupon code</label>
            <input name="code" placeholder="WELCOME10" className="rounded border border-line px-3 py-2 text-sm uppercase" required />
          </div>
          <div className="grid gap-1">
            <label className="text-xs text-ink/60">Discount type</label>
            <select name="discountType" className="rounded border border-line px-3 py-2 text-sm">
              <option value="PERCENTAGE">Percentage</option>
              <option value="FIXED">Fixed amount</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-1">
            <label className="text-xs text-ink/60">Percentage (%) — if percentage type</label>
            <input name="percentage" type="number" step="0.01" className="rounded border border-line px-3 py-2 text-sm" />
          </div>
          <div className="grid gap-1">
            <label className="text-xs text-ink/60">Fixed amount (₹) — if fixed type</label>
            <input name="fixedAmount" type="number" step="0.01" className="rounded border border-line px-3 py-2 text-sm" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-1">
            <label className="text-xs text-ink/60">Minimum order value (₹, optional)</label>
            <input name="minOrderValue" type="number" step="0.01" className="rounded border border-line px-3 py-2 text-sm" />
          </div>
          <div className="grid gap-1">
            <label className="text-xs text-ink/60">Max discount cap (₹, optional — for percentage)</label>
            <input name="maxDiscount" type="number" step="0.01" className="rounded border border-line px-3 py-2 text-sm" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-1">
            <label className="text-xs text-ink/60">Total usage limit (optional)</label>
            <input name="usageLimit" type="number" className="rounded border border-line px-3 py-2 text-sm" />
          </div>
          <div className="grid gap-1">
            <label className="text-xs text-ink/60">Per-customer limit (optional)</label>
            <input name="perCustomerLimit" type="number" className="rounded border border-line px-3 py-2 text-sm" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-1">
            <label className="text-xs text-ink/60">Start date</label>
            <input name="startDate" type="date" defaultValue={today} className="rounded border border-line px-3 py-2 text-sm" required />
          </div>
          <div className="grid gap-1">
            <label className="text-xs text-ink/60">Expiry date</label>
            <input name="expiryDate" type="date" className="rounded border border-line px-3 py-2 text-sm" required />
          </div>
        </div>

        <button className="mt-1 w-fit rounded bg-moss px-4 py-2 text-sm text-parchment hover:bg-moss-dark">
          Create coupon
        </button>
      </form>

      <div className="mt-6 overflow-x-auto rounded-lg border border-line bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line text-ink/50">
            <tr>
              <th className="p-3">Code</th>
              <th className="p-3">Discount</th>
              <th className="p-3">Valid until</th>
              <th className="p-3">Used</th>
              <th className="p-3">Status</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {coupons.map((c) => (
              <tr key={c.id} className="border-b border-line last:border-0">
                <td className="p-3 font-medium">{c.code}</td>
                <td className="p-3">
                  {c.discountType === "PERCENTAGE" ? `${c.percentage}%` : `₹${c.fixedAmount}`}
                  {c.maxDiscount ? ` (max ₹${c.maxDiscount})` : ""}
                </td>
                <td className="p-3">{c.expiryDate.toLocaleDateString("en-IN")}</td>
                <td className="p-3">
                  {c._count.usages}
                  {c.usageLimit ? ` / ${c.usageLimit}` : ""}
                </td>
                <td className="p-3">
                  <span
                    className={
                      c.isActive
                        ? "rounded bg-moss/10 px-2 py-0.5 text-xs text-moss-dark"
                        : "rounded bg-clay/10 px-2 py-0.5 text-xs text-clay"
                    }
                  >
                    {c.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="p-3 text-right">
                  <form action={toggleActive}>
                    <input type="hidden" name="id" value={c.id} />
                    <input type="hidden" name="isActive" value={String(c.isActive)} />
                    <button className="text-xs text-moss-dark underline">
                      {c.isActive ? "Deactivate" : "Activate"}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {coupons.length === 0 && (
              <tr>
                <td colSpan={6} className="p-6 text-center text-ink/50">
                  No coupons yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

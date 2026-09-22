import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function PromoPortalPage({
  params,
}: {
  params: { code: string };
}) {
  const code = params.code.toUpperCase();

  const coupon = await prisma.coupon.findUnique({
    where: { code },
    include: { usages: { orderBy: { usedAt: "desc" } } },
  });

  if (!coupon) notFound();

  // CouponUsage only stores a plain orderId, not a Prisma relation to
  // Order — fetch the matching orders separately rather than trying to
  // `include` a relation that doesn't exist in the schema.
  const orderIds = coupon.usages.map((u) => u.orderId);
  const orders = await prisma.order.findMany({
    where: { id: { in: orderIds } },
    select: { id: true, total: true },
  });
  const orderTotalById = new Map(orders.map((o) => [o.id, Number(o.total)]));

  const orderCount = coupon.usages.length;
  const totalRevenue = coupon.usages.reduce(
    (sum, u) => sum + (orderTotalById.get(u.orderId) ?? 0),
    0
  );
  const firstUsed = coupon.usages.at(-1)?.usedAt;
  const lastUsed = coupon.usages[0]?.usedAt;

  const now = new Date();
  const isLive = coupon.isActive && now >= coupon.startDate && now <= coupon.expiryDate;

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <p className="text-sm text-ink/50">Promo code performance</p>
      <h1 className="font-display text-4xl text-ink">{coupon.code}</h1>
      <p className="mt-2">
        <span
          className={`inline-block rounded px-2 py-0.5 text-xs ${
            isLive ? "bg-moss/10 text-moss-dark" : "bg-clay/10 text-clay"
          }`}
        >
          {isLive ? "Active" : "Not currently active"}
        </span>
      </p>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-line p-4">
          <p className="text-2xl font-display text-ink">{orderCount}</p>
          <p className="text-sm text-ink/50">Orders placed</p>
        </div>
        <div className="rounded-lg border border-line p-4">
          <p className="text-2xl font-display text-ink">₹{totalRevenue.toLocaleString("en-IN")}</p>
          <p className="text-sm text-ink/50">Revenue generated</p>
        </div>
        <div className="rounded-lg border border-line p-4">
          <p className="text-2xl font-display text-ink">
            {coupon.discountType === "PERCENTAGE" ? `${coupon.percentage}%` : `₹${coupon.fixedAmount}`}
          </p>
          <p className="text-sm text-ink/50">Discount offered</p>
        </div>
      </div>

      <div className="mt-8 space-y-2 text-sm text-ink/70">
        {firstUsed && <p>First order: {firstUsed.toLocaleDateString("en-IN")}</p>}
        {lastUsed && <p>Most recent order: {lastUsed.toLocaleDateString("en-IN")}</p>}
        <p>Valid until: {coupon.expiryDate.toLocaleDateString("en-IN")}</p>
      </div>

      <p className="mt-10 text-xs text-ink/40">
        This page shows aggregate order counts and revenue only — no customer names, contact
        details, or personal information are ever shown here.
      </p>
    </div>
  );
}

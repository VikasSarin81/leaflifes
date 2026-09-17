import { prisma } from "@/lib/prisma";

function inr(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}

export default async function AdminDashboard() {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [
    totalOrders,
    pendingOrders,
    confirmedOrders,
    totalCustomers,
    totalProducts,
    lowStockVariants,
    paidOrdersAllTime,
    paidOrdersToday,
    paidOrdersThisMonth,
    recentOrders,
  ] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { status: "PENDING" } }),
    prisma.order.count({ where: { status: "CONFIRMED" } }),
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.product.count(),
    prisma.productVariant.findMany({
      where: { stock: { lte: 5 } },
      include: { product: { select: { name: true } } },
      take: 10,
    }),
    prisma.order.aggregate({
      where: { paymentStatus: "PAID" },
      _sum: { total: true },
    }),
    prisma.order.aggregate({
      where: { paymentStatus: "PAID", createdAt: { gte: startOfToday } },
      _sum: { total: true },
    }),
    prisma.order.aggregate({
      where: { paymentStatus: "PAID", createdAt: { gte: startOfMonth } },
      _sum: { total: true },
    }),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { user: { select: { name: true, email: true } } },
    }),
  ]);

  const stats = [
    { label: "Total sales", value: inr(Number(paidOrdersAllTime._sum.total ?? 0)) },
    { label: "Today's sales", value: inr(Number(paidOrdersToday._sum.total ?? 0)) },
    { label: "This month", value: inr(Number(paidOrdersThisMonth._sum.total ?? 0)) },
    { label: "Total orders", value: totalOrders },
    { label: "Pending orders", value: pendingOrders },
    { label: "Confirmed orders", value: confirmedOrders },
    { label: "Customers", value: totalCustomers },
    { label: "Products", value: totalProducts },
  ];

  return (
    <div>
      <h1 className="font-display text-2xl text-moss-dark">Dashboard</h1>

      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-lg border border-line bg-white p-4">
            <p className="text-xs text-ink/50">{s.label}</p>
            <p className="mt-1 font-display text-xl text-ink">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 grid gap-8 md:grid-cols-2">
        <div>
          <h2 className="font-display text-lg text-moss-dark">Recent orders</h2>
          <div className="mt-3 divide-y divide-line rounded-lg border border-line bg-white">
            {recentOrders.length === 0 && (
              <p className="p-4 text-sm text-ink/50">No orders yet.</p>
            )}
            {recentOrders.map((o) => (
              <div key={o.id} className="flex items-center justify-between p-3 text-sm">
                <div>
                  <p className="font-medium">{o.orderNumber}</p>
                  <p className="text-ink/50">{o.user?.email}</p>
                </div>
                <div className="text-right">
                  <p>{inr(Number(o.total))}</p>
                  <p className="text-xs text-ink/50">{o.status} · {o.paymentStatus}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="font-display text-lg text-moss-dark">Low stock (≤5 units)</h2>
          <div className="mt-3 divide-y divide-line rounded-lg border border-line bg-white">
            {lowStockVariants.length === 0 && (
              <p className="p-4 text-sm text-ink/50">Nothing low on stock.</p>
            )}
            {lowStockVariants.map((v) => (
              <div key={v.id} className="flex items-center justify-between p-3 text-sm">
                <div>
                  <p className="font-medium">{v.product.name}</p>
                  <p className="text-ink/50">{v.label} · {v.sku}</p>
                </div>
                <p className={v.stock === 0 ? "text-clay" : "text-turmeric"}>
                  {v.stock} left
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

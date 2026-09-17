import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function AdminOrdersPage() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { user: { select: { name: true, email: true } } },
  });

  return (
    <div>
      <h1 className="font-display text-2xl text-moss-dark">Orders</h1>

      <div className="mt-6 overflow-x-auto rounded-lg border border-line bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line text-ink/50">
            <tr>
              <th className="p-3">Order</th>
              <th className="p-3">Customer</th>
              <th className="p-3">Date</th>
              <th className="p-3">Total</th>
              <th className="p-3">Payment</th>
              <th className="p-3">Status</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-b border-line last:border-0">
                <td className="p-3 font-medium">{o.orderNumber}</td>
                <td className="p-3">{o.user?.name ?? o.user?.email}</td>
                <td className="p-3">{o.createdAt.toLocaleDateString("en-IN")}</td>
                <td className="p-3">₹{Number(o.total).toLocaleString("en-IN")}</td>
                <td className="p-3">{o.paymentStatus}</td>
                <td className="p-3">{o.status}</td>
                <td className="p-3 text-right">
                  <Link href={`/admin/orders/${o.id}`} className="text-moss-dark underline">
                    View
                  </Link>
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={7} className="p-6 text-center text-ink/50">
                  No orders yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-auth";
import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";

async function updateStatus(formData: FormData) {
  "use server";
  const session = await requireAdminApi();
  if (!session) return;

  const orderId = String(formData.get("orderId"));
  const status = String(formData.get("status"));

  await prisma.order.update({
    where: { id: orderId },
    data: { status: status as "PENDING" | "CONFIRMED" | "CANCELLED" },
  });
  revalidatePath(`/admin/orders/${orderId}`);
}

export default async function AdminOrderDetailPage({ params }: { params: { id: string } }) {
  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: {
      user: { select: { name: true, email: true } },
      items: true,
    },
  });

  if (!order) notFound();

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-2xl text-moss-dark">{order.orderNumber}</h1>

      <div className="mt-4 rounded-lg border border-line bg-white p-4 text-sm">
        <p><strong>Customer:</strong> {order.user?.name} ({order.user?.email})</p>
        <p className="mt-1">
          <strong>Shipping:</strong> {order.shippingName}, {order.shippingLine1}
          {order.shippingLine2 ? `, ${order.shippingLine2}` : ""}, {order.shippingCity},{" "}
          {order.shippingState} {order.shippingPincode} · {order.shippingPhone}
        </p>
        <p className="mt-1"><strong>Payment:</strong> {order.paymentStatus} {order.razorpayPaymentId && `(${order.razorpayPaymentId})`}</p>
      </div>

      <div className="mt-4 divide-y divide-line rounded-lg border border-line bg-white">
        {order.items.map((item) => (
          <div key={item.id} className="flex justify-between p-3 text-sm">
            <span>{item.productName} — {item.variantLabel} × {item.quantity}</span>
            <span>₹{Number(item.price).toLocaleString("en-IN")}</span>
          </div>
        ))}
        <div className="flex justify-between p-3 text-sm font-medium">
          <span>Total</span>
          <span>₹{Number(order.total).toLocaleString("en-IN")}</span>
        </div>
      </div>

      <form action={updateStatus} className="mt-6 flex items-center gap-2">
        <input type="hidden" name="orderId" value={order.id} />
        <select name="status" defaultValue={order.status} className="rounded border border-line px-3 py-2 text-sm">
          <option value="PENDING">Pending</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        <button className="rounded bg-moss px-4 py-2 text-sm text-parchment hover:bg-moss-dark">
          Update status
        </button>
      </form>
    </div>
  );
}

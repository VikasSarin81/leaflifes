import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function OrderConfirmationPage({
  params,
}: {
  params: { orderNumber: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const order = await prisma.order.findUnique({
    where: { orderNumber: params.orderNumber },
    include: { items: true },
  });

  if (!order || order.userId !== (session.user as { id: string }).id) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      {order.paymentStatus === "PAID" ? (
        <>
          <h1 className="font-display text-3xl text-ink">Order confirmed</h1>
          <p className="mt-2 text-ink/60">
            Order {order.orderNumber} — thank you, it's on its way.
          </p>
        </>
      ) : (
        <>
          <h1 className="font-display text-3xl text-ink">Payment not completed</h1>
          <p className="mt-2 text-ink/60">
            Order {order.orderNumber} wasn't paid for. No charge was made.
          </p>
        </>
      )}

      <ul className="mt-8 divide-y divide-line text-sm">
        {order.items.map((item) => (
          <li key={item.id} className="flex justify-between py-3">
            <span>
              {item.productName} ({item.variantLabel}) × {item.quantity}
            </span>
            <span>₹{Number(item.price) * item.quantity}</span>
          </li>
        ))}
      </ul>

      <div className="mt-4 space-y-1 border-t border-line pt-4 text-sm">
        <div className="flex justify-between text-ink/70">
          <span>Subtotal</span>
          <span>₹{Number(order.subtotal)}</span>
        </div>
        <div className="flex justify-between text-ink/70">
          <span>Shipping</span>
          <span>{Number(order.shipping) === 0 ? "Free" : `₹${Number(order.shipping)}`}</span>
        </div>
        <div className="flex justify-between font-medium text-ink">
          <span>Total</span>
          <span>₹{Number(order.total)}</span>
        </div>
      </div>

      <div className="mt-8 space-y-1 text-sm text-ink/60">
        <p>{order.shippingName}</p>
        <p>{order.shippingLine1}</p>
        {order.shippingLine2 && <p>{order.shippingLine2}</p>}
        <p>
          {order.shippingCity}, {order.shippingState} {order.shippingPincode}
        </p>
        <p>{order.shippingPhone}</p>
      </div>

      <Link href="/shop" className="mt-10 inline-block text-sm underline hover:text-moss">
        Continue shopping
      </Link>
    </div>
  );
}

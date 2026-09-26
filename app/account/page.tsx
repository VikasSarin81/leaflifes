import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import SignOutButton from "@/components/SignOutButton";

const statusStyle: Record<string, string> = {
  PENDING: "bg-turmeric/10 text-turmeric",
  CONFIRMED: "bg-moss/10 text-moss-dark",
  CANCELLED: "bg-clay/10 text-clay",
};

export default async function AccountPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login");
  }
  const userId = (session.user as { id: string }).id;

  const orders = await prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="font-display text-2xl text-ink">
        Hi{session.user.name ? `, ${session.user.name}` : ""}
      </h1>
      <p className="mt-2 text-ink/60">{session.user.email}</p>

      <div className="mt-10 border-t border-line pt-8">
        <h2 className="font-display text-xl text-ink">Your orders</h2>

        {orders.length === 0 && (
          <p className="mt-4 text-sm text-ink/50">
            No orders yet —{" "}
            <Link href="/shop" className="underline hover:text-moss">
              start shopping
            </Link>
            .
          </p>
        )}

        <div className="mt-4 space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="rounded-lg border border-line p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-medium text-ink">{order.orderNumber}</p>
                  <p className="text-xs text-ink/50">
                    {order.createdAt.toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded px-2 py-0.5 text-xs ${statusStyle[order.status] ?? ""}`}>
                    {order.status}
                  </span>
                  <span className="text-sm font-medium text-ink">
                    ₹{Number(order.total).toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              <ul className="mt-3 space-y-1 border-t border-line pt-3 text-sm text-ink/70">
                {order.items.map((item) => (
                  <li key={item.id} className="flex justify-between">
                    <span>
                      {item.productName} — {item.variantLabel} × {item.quantity}
                    </span>
                    <span>₹{Number(item.price).toLocaleString("en-IN")}</span>
                  </li>
                ))}
              </ul>

              {order.paymentStatus === "PAID" && (
                <p className="mt-3 text-xs text-moss-dark">Payment received</p>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-10 border-t border-line pt-6">
        <SignOutButton />
      </div>
    </div>
  );
}

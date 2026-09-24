import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendAbandonedCartEmail, sendReviewRequestEmail } from "@/lib/mail";

export const dynamic = "force-dynamic";

// Called on a schedule by an external cron service (see README) — not
// meant to be triggered by a browser or a customer action. Protected by
// a shared secret so random requests can't spam your customers.
export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = Date.now();
  const oneHourAgo = new Date(now - 60 * 60 * 1000);
  const threeDaysAgo = new Date(now - 3 * 24 * 60 * 60 * 1000);
  const fiveDaysAgo = new Date(now - 5 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

  // ---- Abandoned cart reminders ----
  // A cart counts as "abandoned" once it's sat untouched for over an hour
  // (long enough that they've likely left, not just mid-browsing) but
  // we stop bothering after 3 days — a cart that old is realistically
  // never converting from a reminder at that point.
  const abandonedCarts = await prisma.cart.findMany({
    where: {
      reminderSentAt: null,
      updatedAt: { lte: oneHourAgo, gte: threeDaysAgo },
      items: { some: {} },
    },
    include: {
      user: { select: { email: true } },
      items: {
        include: {
          product: { select: { name: true } },
          variant: { select: { label: true } },
        },
      },
    },
  });

  let cartEmailsSent = 0;
  for (const cart of abandonedCarts) {
    try {
      await sendAbandonedCartEmail(
        cart.user.email,
        cart.items.map((i) => ({
          name: i.product.name,
          label: i.variant.label,
          quantity: i.quantity,
        }))
      );
      await prisma.cart.update({
        where: { id: cart.id },
        data: { reminderSentAt: new Date() },
      });
      cartEmailsSent++;
    } catch (err) {
      console.error("Abandoned cart email failed for cart", cart.id, err);
    }
  }

  // ---- Post-purchase review requests ----
  // Fires 5-30 days after a PAID order — long enough that delivery has
  // almost certainly happened, short enough that the purchase is still
  // fresh in their mind. The upper bound just avoids ever emailing about
  // ancient orders if this job were ever down for a while.
  const reviewableOrders = await prisma.order.findMany({
    where: {
      paymentStatus: "PAID",
      reviewRequestSentAt: null,
      createdAt: { lte: fiveDaysAgo, gte: thirtyDaysAgo },
    },
    include: {
      user: { select: { email: true } },
      items: { select: { productName: true, product: { select: { slug: true } } } },
    },
  });

  let reviewEmailsSent = 0;
  for (const order of reviewableOrders) {
    try {
      // De-dupe in case an order has the same product twice across variants.
      const uniqueProducts = Array.from(
        new Map(
          order.items.map((i) => [i.product.slug, { name: i.productName, slug: i.product.slug }])
        ).values()
      );

      await sendReviewRequestEmail(order.user.email, uniqueProducts);
      await prisma.order.update({
        where: { id: order.id },
        data: { reviewRequestSentAt: new Date() },
      });
      reviewEmailsSent++;
    } catch (err) {
      console.error("Review request email failed for order", order.id, err);
    }
  }

  return NextResponse.json({ cartEmailsSent, reviewEmailsSent });
}

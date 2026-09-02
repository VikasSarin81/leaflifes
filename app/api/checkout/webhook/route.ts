import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyWebhookSignature } from "@/lib/razorpay";

// Optional for now: this only matters once you add a webhook URL in the
// Razorpay dashboard (Settings > Webhooks) and set RAZORPAY_WEBHOOK_SECRET.
// It's a safety net for cases the browser-side flow in /checkout can miss —
// e.g. a customer closing the tab right after paying, before the app's own
// verify call fires.
export async function POST(req: Request) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-razorpay-signature") ?? "";

  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const event = JSON.parse(rawBody);

  if (event.event === "payment.captured") {
    const razorpayOrderId = event.payload?.payment?.entity?.order_id;
    const paymentId = event.payload?.payment?.entity?.id;
    if (razorpayOrderId) {
      const order = await prisma.order.findUnique({ where: { razorpayOrderId } });
      if (order && order.paymentStatus !== "PAID") {
        await prisma.$transaction([
          prisma.order.update({
            where: { id: order.id },
            data: { paymentStatus: "PAID", status: "CONFIRMED", razorpayPaymentId: paymentId },
          }),
          ...(order.couponId
            ? [
                prisma.couponUsage.create({
                  data: { couponId: order.couponId, userId: order.userId, orderId: order.id },
                }),
              ]
            : []),
        ]);
      }
    }
  }

  if (event.event === "payment.failed") {
    const razorpayOrderId = event.payload?.payment?.entity?.order_id;
    if (razorpayOrderId) {
      const order = await prisma.order.findUnique({ where: { razorpayOrderId } });
      if (order && order.paymentStatus === "PENDING") {
        await prisma.order.update({
          where: { id: order.id },
          data: { paymentStatus: "FAILED" },
        });
      }
    }
  }

  return NextResponse.json({ received: true });
}

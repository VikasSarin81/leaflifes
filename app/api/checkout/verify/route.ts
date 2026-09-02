import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { verifyPaymentSignature } from "@/lib/razorpay";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Not logged in." }, { status: 401 });
  }

  const {
    orderId,
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  } = await req.json();

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });

  if (!order || order.userId !== (session.user as { id: string }).id) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  // Prevents re-processing (e.g. the browser retrying the request) from
  // decrementing stock twice for the same order.
  if (order.paymentStatus === "PAID") {
    return NextResponse.json({ ok: true, orderNumber: order.orderNumber });
  }

  const isValid = verifyPaymentSignature({
    orderId: razorpay_order_id,
    paymentId: razorpay_payment_id,
    signature: razorpay_signature,
  });

  if (!isValid) {
    await prisma.order.update({
      where: { id: order.id },
      data: { paymentStatus: "FAILED" },
    });
    return NextResponse.json({ error: "Payment could not be verified." }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: "PAID",
        status: "CONFIRMED",
        razorpayPaymentId: razorpay_payment_id,
      },
    }),
    ...order.items.map((item) =>
      prisma.productVariant.update({
        where: { id: item.variantId },
        data: { stock: { decrement: item.quantity } },
      })
    ),
    ...(order.couponId
      ? [
          prisma.couponUsage.create({
            data: { couponId: order.couponId, userId: order.userId, orderId: order.id },
          }),
        ]
      : []),
  ]);

  return NextResponse.json({ ok: true, orderNumber: order.orderNumber });
}

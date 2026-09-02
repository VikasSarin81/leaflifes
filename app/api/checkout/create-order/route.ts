import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createRazorpayOrder, razorpayKeyId } from "@/lib/razorpay";
import { validateCoupon } from "@/lib/coupons";

const FREE_SHIPPING_THRESHOLD = 999;
const FLAT_SHIPPING = 49;

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Please log in to check out." }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;

  const body = await req.json();
  const { shipping, lines, couponCode } = body as {
    shipping: {
      name: string;
      phone: string;
      line1: string;
      line2?: string;
      city: string;
      state: string;
      pincode: string;
    };
    lines: { variantId: string; quantity: number }[];
    couponCode?: string;
  };

  if (!shipping?.name || !shipping?.phone || !shipping?.line1 || !shipping?.pincode) {
    return NextResponse.json({ error: "Please fill in your shipping details." }, { status: 400 });
  }
  if (!lines?.length) {
    return NextResponse.json({ error: "Your cart is empty." }, { status: 400 });
  }

  // Re-fetch every variant's real price and stock from the database —
  // never trust prices sent from the browser.
  const variants = await prisma.productVariant.findMany({
    where: { id: { in: lines.map((l) => l.variantId) } },
    include: { product: true },
  });

  const orderItemsData = [];
  let subtotal = 0;

  for (const line of lines) {
    const variant = variants.find((v) => v.id === line.variantId);
    if (!variant) {
      return NextResponse.json({ error: "One of the items in your cart no longer exists." }, { status: 400 });
    }
    if (variant.stock < line.quantity) {
      return NextResponse.json(
        { error: `Only ${variant.stock} left of ${variant.product.name} (${variant.label}).` },
        { status: 400 }
      );
    }
    const price = Number(variant.price);
    subtotal += price * line.quantity;
    orderItemsData.push({
      productId: variant.productId,
      variantId: variant.id,
      productName: variant.product.name,
      variantLabel: variant.label,
      price,
      quantity: line.quantity,
    });
  }

  const shippingCost = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : FLAT_SHIPPING;

  let discountAmount = 0;
  let couponId: string | null = null;
  let appliedCouponCode: string | null = null;

  if (couponCode) {
    const couponResult = await validateCoupon(couponCode, subtotal, userId);
    if (!couponResult.valid) {
      return NextResponse.json({ error: couponResult.error }, { status: 400 });
    }
    discountAmount = couponResult.discountAmount;
    couponId = couponResult.coupon.id;
    appliedCouponCode = couponResult.coupon.code;
  }

  const total = subtotal - discountAmount + shippingCost;

  const orderNumber = `LL${Date.now().toString(36).toUpperCase()}`;

  const order = await prisma.order.create({
    data: {
      orderNumber,
      userId,
      subtotal,
      discount: discountAmount,
      shipping: shippingCost,
      total,
      couponId,
      couponCode: appliedCouponCode,
      shippingName: shipping.name,
      shippingPhone: shipping.phone,
      shippingLine1: shipping.line1,
      shippingLine2: shipping.line2 || null,
      shippingCity: shipping.city,
      shippingState: shipping.state,
      shippingPincode: shipping.pincode,
      items: { create: orderItemsData },
    },
  });

  let razorpayOrder;
  try {
    razorpayOrder = await createRazorpayOrder({
      amountInRupees: total,
      receipt: orderNumber,
    });
  } catch (err) {
    // Roll back the order record if Razorpay couldn't be reached, so we
    // don't leave dangling PENDING orders with no payment attempt.
    await prisma.order.delete({ where: { id: order.id } });
    return NextResponse.json({ error: "Could not start payment. Try again." }, { status: 502 });
  }

  await prisma.order.update({
    where: { id: order.id },
    data: { razorpayOrderId: razorpayOrder.id },
  });

  return NextResponse.json({
    orderId: order.id,
    orderNumber: order.orderNumber,
    razorpayOrderId: razorpayOrder.id,
    amount: razorpayOrder.amount,
    currency: razorpayOrder.currency,
    keyId: razorpayKeyId,
    customerName: shipping.name,
  });
}

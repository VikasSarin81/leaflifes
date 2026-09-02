import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { validateCoupon } from "@/lib/coupons";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Please log in to apply a coupon." }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;

  const { code, subtotal } = await req.json();
  if (!code || typeof subtotal !== "number") {
    return NextResponse.json({ error: "Missing coupon code or subtotal." }, { status: 400 });
  }

  const result = await validateCoupon(code, subtotal, userId);
  if (!result.valid) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    code: result.coupon.code,
    discountAmount: result.discountAmount,
  });
}

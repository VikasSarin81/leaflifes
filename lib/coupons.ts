import { prisma } from "./prisma";

export type CouponValidationResult =
  | { valid: true; coupon: { id: string; code: string }; discountAmount: number }
  | { valid: false; error: string };

/**
 * Validates a coupon code against a cart subtotal and the current user.
 * This is called from both the checkout "preview" endpoint (so the customer
 * sees the discount before paying) and the actual order-creation endpoint
 * (so a coupon can't be tampered with client-side) — always re-run this
 * server-side right before charging, never trust a discount amount sent
 * from the browser.
 */
export async function validateCoupon(
  rawCode: string,
  subtotal: number,
  userId: string
): Promise<CouponValidationResult> {
  const code = rawCode.trim().toUpperCase();
  if (!code) return { valid: false, error: "Enter a coupon code." };

  const coupon = await prisma.coupon.findUnique({ where: { code } });
  if (!coupon || !coupon.isActive) {
    return { valid: false, error: "That coupon code isn't valid." };
  }

  const now = new Date();
  if (now < coupon.startDate) {
    return { valid: false, error: "This coupon isn't active yet." };
  }
  if (now > coupon.expiryDate) {
    return { valid: false, error: "This coupon has expired." };
  }

  const minOrder = coupon.minOrderValue ? Number(coupon.minOrderValue) : 0;
  if (subtotal < minOrder) {
    return {
      valid: false,
      error: `This coupon needs a minimum order of ₹${minOrder.toLocaleString("en-IN")}.`,
    };
  }

  if (coupon.usageLimit != null) {
    const totalUses = await prisma.couponUsage.count({ where: { couponId: coupon.id } });
    if (totalUses >= coupon.usageLimit) {
      return { valid: false, error: "This coupon has reached its usage limit." };
    }
  }

  if (coupon.perCustomerLimit != null) {
    const userUses = await prisma.couponUsage.count({
      where: { couponId: coupon.id, userId },
    });
    if (userUses >= coupon.perCustomerLimit) {
      return { valid: false, error: "You've already used this coupon the maximum number of times." };
    }
  }

  let discountAmount: number;
  if (coupon.discountType === "PERCENTAGE") {
    const pct = Number(coupon.percentage ?? 0);
    discountAmount = (subtotal * pct) / 100;
    if (coupon.maxDiscount != null) {
      discountAmount = Math.min(discountAmount, Number(coupon.maxDiscount));
    }
  } else {
    discountAmount = Number(coupon.fixedAmount ?? 0);
  }

  // Never let a coupon discount more than the order is worth.
  discountAmount = Math.min(discountAmount, subtotal);
  discountAmount = Math.round(discountAmount * 100) / 100;

  return {
    valid: true,
    coupon: { id: coupon.id, code: coupon.code },
    discountAmount,
  };
}

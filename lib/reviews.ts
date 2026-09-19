import { prisma } from "./prisma";

export async function getApprovedReviews(productId: string) {
  const reviews = await prisma.review.findMany({
    where: { productId, status: "APPROVED" },
    orderBy: { createdAt: "desc" },
    include: { user: { select: { name: true } } },
  });

  return reviews.map((r) => ({
    id: r.id,
    rating: r.rating,
    title: r.title,
    comment: r.comment,
    createdAt: r.createdAt,
    reviewerName: r.user.name || "Verified customer",
  }));
}

/**
 * Tells the product page whether to show a review form at all, and why
 * not if it shouldn't — separate from the API route's own check, which is
 * the real enforcement. This is just for UI: no point showing a form to
 * someone who can't submit it anyway.
 */
export async function getReviewEligibility(userId: string | undefined, productId: string) {
  if (!userId) return { canReview: false, reason: "not-logged-in" as const };

  const [qualifyingOrder, existingReview] = await Promise.all([
    prisma.order.findFirst({
      where: { userId, paymentStatus: "PAID", items: { some: { productId } } },
      select: { id: true },
    }),
    prisma.review.findUnique({
      where: { productId_userId: { productId, userId } },
    }),
  ]);

  if (existingReview) return { canReview: false, reason: "already-reviewed" as const };
  if (!qualifyingOrder) return { canReview: false, reason: "not-purchased" as const };
  return { canReview: true, reason: null };
}

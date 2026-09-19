import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Please log in to leave a review." }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;

  const { productId, rating, title, comment } = await req.json();

  if (!productId || !rating || !comment?.trim()) {
    return NextResponse.json(
      { error: "A rating and a comment are required." },
      { status: 400 }
    );
  }
  const ratingNum = Number(rating);
  if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
    return NextResponse.json({ error: "Rating must be 1-5." }, { status: 400 });
  }

  // The actual gate: find a PAID order, belonging to this user, that
  // contains this product. If none exists, they haven't bought it — no
  // review allowed, full stop. This is what makes every review here a
  // genuine verified purchase rather than something anyone could post.
  const qualifyingOrder = await prisma.order.findFirst({
    where: {
      userId,
      paymentStatus: "PAID",
      items: { some: { productId } },
    },
    select: { id: true },
  });

  if (!qualifyingOrder) {
    return NextResponse.json(
      { error: "You can only review products you've actually purchased and received." },
      { status: 403 }
    );
  }

  const existing = await prisma.review.findUnique({
    where: { productId_userId: { productId, userId } },
  });
  if (existing) {
    return NextResponse.json(
      { error: "You've already reviewed this product." },
      { status: 409 }
    );
  }

  await prisma.review.create({
    data: {
      productId,
      userId,
      orderId: qualifyingOrder.id,
      rating: ratingNum,
      title: title?.trim() || null,
      comment: comment.trim(),
      isVerified: true,
      status: "PENDING", // admin approves before it shows publicly
    },
  });

  return NextResponse.json({ ok: true });
}

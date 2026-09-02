import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-auth";

// Body: { updates: { variantId: string; stock: number }[] }
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await requireAdminApi();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { updates } = await req.json();
    if (!Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json({ error: "No stock updates provided." }, { status: 400 });
    }

    await prisma.$transaction(
      updates.map((u: { variantId: string; stock: number }) =>
        prisma.productVariant.update({
          where: { id: u.variantId, productId: params.id },
          data: { stock: Math.max(0, Math.floor(Number(u.stock) || 0)) },
        })
      )
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("admin/products stock update error", err);
    return NextResponse.json({ error: "Could not update stock." }, { status: 500 });
  }
}

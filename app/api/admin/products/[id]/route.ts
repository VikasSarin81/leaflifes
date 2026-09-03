import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-auth";
import { slugify } from "@/lib/slugify";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await requireAdminApi();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();

    // Replace images/variants wholesale for simplicity. Note: a variant that
    // already appears on a past order can't be deleted (OrderItem keeps a
    // foreign key to it for order history) — if that happens, tell the admin
    // clearly rather than failing silently.
    await prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id: params.id },
        data: {
          name: body.name,
          slug: slugify(body.slug),
          categoryId: body.categoryId,
          shortDescription: body.shortDescription ?? "",
          description: body.description ?? "",
          mrp: body.mrp || 0,
          price: body.price || 0,
          tags: (body.tags as string)
            .split(",")
            .map((t: string) => t.trim())
            .filter(Boolean),
          status: body.status ?? "DRAFT",
          isFeatured: !!body.isFeatured,
          isBestSeller: !!body.isBestSeller,
          isNewArrival: !!body.isNewArrival,
        },
      });

      await tx.productImage.deleteMany({ where: { productId: params.id } });
      await tx.productImage.createMany({
        data: (body.images ?? []).map((img: { url: string; publicId?: string; isPrimary: boolean }, i: number) => ({
          productId: params.id,
          url: img.url,
          publicId: img.publicId,
          isPrimary: img.isPrimary,
          position: i,
        })),
      });

      // Only touch variants that aren't referenced by past orders.
      const existingVariantIds = (
        await tx.productVariant.findMany({
          where: { productId: params.id },
          select: { id: true },
        })
      ).map((v) => v.id);

      const incomingIds = (body.variants ?? [])
        .map((v: { id?: string }) => v.id)
        .filter(Boolean);

      const toDelete = existingVariantIds.filter((id) => !incomingIds.includes(id));
      if (toDelete.length) {
        await tx.productVariant.deleteMany({
          where: { id: { in: toDelete }, orderItems: { none: {} } },
        });
      }

      for (const v of body.variants ?? []) {
        if (v.id) {
          await tx.productVariant.update({
            where: { id: v.id },
            data: { label: v.label, sku: v.sku, price: v.price || 0, stock: parseInt(v.stock || "0", 10) },
          });
        } else {
          await tx.productVariant.create({
            data: {
              productId: params.id,
              label: v.label,
              sku: v.sku,
              price: v.price || 0,
              stock: parseInt(v.stock || "0", 10),
            },
          });
        }
      }
    });

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message =
      typeof err === "object" && err && "code" in err && (err as { code: string }).code === "P2002"
        ? "A product with that slug or a variant SKU already exists."
        : "Could not update the product.";
    console.error("admin/products update error", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await requireAdminApi();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await prisma.product.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("admin/products delete error", err);
    return NextResponse.json(
      { error: "Couldn't delete — this product likely has past orders. Archive it instead." },
      { status: 409 }
    );
  }
}

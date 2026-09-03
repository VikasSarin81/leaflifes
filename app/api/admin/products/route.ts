import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-auth";
import { slugify } from "@/lib/slugify";

export async function POST(req: NextRequest) {
  const session = await requireAdminApi();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();

    if (!body.name || !body.slug || !body.categoryId) {
      return NextResponse.json(
        { error: "Name, slug, and category are required." },
        { status: 400 }
      );
    }

    // Never trust the raw slug from the form — always normalize it
    // server-side so a stray space or capital letter can't produce a
    // broken product URL, regardless of what the client sent.
    const cleanSlug = slugify(body.slug);
    if (!cleanSlug) {
      return NextResponse.json(
        { error: "That slug isn't usable — try a simpler one (letters, numbers, hyphens)." },
        { status: 400 }
      );
    }
    const product = await prisma.product.create({
      data: {
        name: body.name,
        slug: cleanSlug,
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
        images: {
          create: (body.images ?? []).map((img: { url: string; publicId?: string; isPrimary: boolean }, i: number) => ({
            url: img.url,
            publicId: img.publicId,
            isPrimary: img.isPrimary,
            position: i,
          })),
        },
        variants: {
          create: (body.variants ?? []).map((v: { label: string; sku: string; price: string; stock: string }) => ({
            label: v.label,
            sku: v.sku,
            price: v.price || 0,
            stock: parseInt(v.stock || "0", 10),
          })),
        },
      },
    });

    return NextResponse.json({ id: product.id });
  } catch (err: unknown) {
    const message =
      typeof err === "object" && err && "code" in err && (err as { code: string }).code === "P2002"
        ? "A product with that slug or a variant SKU already exists."
        : "Could not create the product.";
    console.error("admin/products create error", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

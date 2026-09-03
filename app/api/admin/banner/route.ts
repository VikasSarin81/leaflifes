import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-auth";

export async function PATCH(req: NextRequest) {
  const session = await requireAdminApi();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();

    if (!body.headline || !body.description || !body.buttonText || !body.buttonUrl) {
      return NextResponse.json(
        { error: "Headline, description, button text, and button link are all required." },
        { status: 400 }
      );
    }

    await prisma.banner.upsert({
      where: { id: "hero" },
      create: {
        id: "hero",
        imageUrl: body.imageUrl || null,
        imagePublicId: body.imagePublicId || null,
        headline: body.headline,
        description: body.description,
        buttonText: body.buttonText,
        buttonUrl: body.buttonUrl,
      },
      update: {
        imageUrl: body.imageUrl || null,
        imagePublicId: body.imagePublicId || null,
        headline: body.headline,
        description: body.description,
        buttonText: body.buttonText,
        buttonUrl: body.buttonUrl,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("admin/banner save error", err);
    return NextResponse.json({ error: "Couldn't save the banner." }, { status: 500 });
  }
}

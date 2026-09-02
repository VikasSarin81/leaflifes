import { NextResponse } from "next/server";
import { cloudinary } from "@/lib/cloudinary";
import { requireAdminApi } from "@/lib/admin-auth";

export async function POST() {
  const session = await requireAdminApi();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const timestamp = Math.round(Date.now() / 1000);
  const folder = "leaflife/products";

  // Only params included in the signature can be sent by the client later —
  // this is what stops someone from tampering with the upload (e.g. changing
  // the folder) after the fact.
  const signature = cloudinary.utils.api_sign_request(
    { timestamp, folder },
    process.env.CLOUDINARY_API_SECRET!
  );

  return NextResponse.json({
    timestamp,
    folder,
    signature,
    apiKey: process.env.CLOUDINARY_API_KEY,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
  });
}

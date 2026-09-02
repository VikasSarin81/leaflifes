import { NextResponse } from "next/server";
import { getProducts } from "@/lib/products";

// This route runs on the server, so it's safe for it to call Prisma.
// Client components (like the cart page) fetch this URL instead of
// importing lib/products.ts directly.
export async function GET() {
  const products = await getProducts();
  return NextResponse.json(products);
}

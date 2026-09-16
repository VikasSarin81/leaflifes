import { NextResponse } from "next/server";

export async function GET() {
  const siteUrl = process.env.NEXTAUTH_URL!.replace(/\/$/, "");

  const body = `User-Agent: *
Allow: /
Disallow: /admin
Disallow: /account
Disallow: /cart
Disallow: /checkout
Disallow: /api
Disallow: /order-confirmation

Sitemap: ${siteUrl}/sitemap.xml
`;

  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/plain",
    },
  });
}

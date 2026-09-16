import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// A plain Route Handler instead of Next.js's app/sitemap.ts convention —
// that convention wasn't reliably getting served with the correct
// application/xml Content-Type header on Netlify, which made Google's
// sitemap parser reject it even though the actual XML content was valid.
// Setting the header explicitly here removes any ambiguity.
export async function GET() {
  const siteUrl = process.env.NEXTAUTH_URL!.replace(/\/$/, "");

  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      where: { status: "PUBLISHED" },
      select: { slug: true, updatedAt: true },
    }),
    prisma.category.findMany({ select: { slug: true } }),
  ]);

  const staticEntries = [
    { loc: `${siteUrl}/`, changefreq: "daily", priority: "1.0" },
    { loc: `${siteUrl}/shop`, changefreq: "daily", priority: "0.9" },
    { loc: `${siteUrl}/about`, changefreq: "monthly", priority: "0.5" },
    { loc: `${siteUrl}/contact`, changefreq: "monthly", priority: "0.5" },
  ];

  const categoryEntries = categories.map((c) => ({
    loc: `${siteUrl}/shop?category=${c.slug}`,
    changefreq: "weekly",
    priority: "0.7",
  }));

  const productEntries = products.map((p) => ({
    loc: `${siteUrl}/products/${p.slug}`,
    lastmod: p.updatedAt.toISOString(),
    changefreq: "weekly",
    priority: "0.8",
  }));

  const allEntries = [...staticEntries, ...categoryEntries, ...productEntries];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allEntries
  .map(
    (e) => `<url>
<loc>${e.loc}</loc>
${"lastmod" in e ? `<lastmod>${e.lastmod}</lastmod>\n` : ""}<changefreq>${e.changefreq}</changefreq>
<priority>${e.priority}</priority>
</url>`
  )
  .join("\n")}
</urlset>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml",
    },
  });
}

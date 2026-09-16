import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

// Next.js auto-serves this at /sitemap.xml — nothing else to configure.
// It runs on the server at request time (not frozen at build), so it
// always reflects your current published products and categories.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = (process.env.NEXTAUTH_URL || "https://leaflifes.com").replace(/\/$/, "");

  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      where: { status: "PUBLISHED" },
      select: { slug: true, updatedAt: true },
    }),
    prisma.category.findMany({
      select: { slug: true },
    }),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${siteUrl}/`, changeFrequency: "daily", priority: 1 },
    { url: `${siteUrl}/shop`, changeFrequency: "daily", priority: 0.9 },
    { url: `${siteUrl}/about`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${siteUrl}/contact`, changeFrequency: "monthly", priority: 0.5 },
  ];

  const categoryRoutes: MetadataRoute.Sitemap = categories.map((c) => ({
    url: `${siteUrl}/shop?category=${c.slug}`,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const productRoutes: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${siteUrl}/products/${p.slug}`,
    lastModified: p.updatedAt,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...staticRoutes, ...categoryRoutes, ...productRoutes];
}

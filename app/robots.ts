import { MetadataRoute } from "next";

// Next.js auto-serves this at /robots.txt.
export default function robots(): MetadataRoute.Robots {
  const siteUrl = (process.env.NEXTAUTH_URL || "https://leaflifes.com").replace(/\/$/, "");

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/account", "/cart", "/checkout", "/api", "/order-confirmation"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}

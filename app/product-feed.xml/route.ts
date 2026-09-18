import { NextResponse } from "next/server";
import { getProducts } from "@/lib/products";

// Google Merchant Center reads this to populate free shopping listings.
// Different format from sitemap.xml on purpose — Merchant Center needs
// specific per-product commerce fields (price, availability, brand, GTIN)
// that a plain sitemap has no concept of.
export async function GET() {
  const siteUrl = process.env.NEXTAUTH_URL!.replace(/\/$/, "");
  const allProducts = await getProducts();

  // A product with no image or no price can never pass Google's review
  // anyway — rather than submit a broken entry (which can corrupt the XML
  // for that item and get flagged as "missing everything"), leave it out
  // of the feed entirely until it's actually complete in the admin panel.
  const products = allProducts.filter((p) => p.images.length > 0 && p.price > 0 && p.name);

  // Escaped everywhere a dynamic value is interpolated into the XML — not
  // just title/description. A single unescaped "&" in an image URL (some
  // Cloudinary/CDN URLs include query parameters) is enough to break the
  // XML for that entire <item> block, which is exactly what made 2 products
  // show every field as "missing" even though only one value was the issue.
  const escape = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  const items = products
    .map((p) => {
      const inStock = p.variants.some((v) => v.stock > 0);
      const description = p.shortDescription || p.description.replace(/<[^>]+>/g, "").slice(0, 500);
      const productUrl = escape(`${siteUrl}/products/${p.slug}`);
      const imageUrl = escape(p.images[0]);

      return `<item>
<g:id>${p.id}</g:id>
<title>${escape(p.name)}</title>
<description>${escape(description)}</description>
<link>${productUrl}</link>
<g:image_link>${imageUrl}</g:image_link>
<g:availability>${inStock ? "in_stock" : "out_of_stock"}</g:availability>
<g:price>${p.price.toFixed(2)} INR</g:price>
${p.mrp > p.price ? `<g:sale_price>${p.price.toFixed(2)} INR</g:sale_price>\n` : ""}<g:brand>LEAFLIFE</g:brand>
<g:condition>new</g:condition>
<g:identifier_exists>no</g:identifier_exists>
</item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
<channel>
<title>LEAFLIFE Product Feed</title>
<link>${siteUrl}</link>
<description>LEAFLIFE product catalog for Google Merchant Center</description>
${items}
</channel>
</rss>`;

  return new NextResponse(xml, {
    headers: { "Content-Type": "application/xml" },
  });
}

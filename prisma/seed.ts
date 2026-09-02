import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminPasswordHash = await bcrypt.hash("ChangeMe123!", 10);
  await prisma.user.upsert({
    where: { email: "admin@leaflife.com" },
    update: {},
    create: {
      name: "LEAFLIFE Admin",
      email: "admin@leaflife.com",
      passwordHash: adminPasswordHash,
      role: "ADMIN",
    },
  });

  const categories = await Promise.all(
    [
      { name: "Skin Care", slug: "skin-care" },
      { name: "Hair Care", slug: "hair-care" },
      { name: "Wellness", slug: "wellness" },
      { name: "Home", slug: "home" },
    ].map((c) =>
      prisma.category.upsert({
        where: { slug: c.slug },
        update: {},
        create: c,
      })
    )
  );

  const bySlug = Object.fromEntries(categories.map((c) => [c.slug, c.id]));

  const products = [
    {
      slug: "cold-pressed-neem-face-oil",
      name: "Cold-Pressed Neem Face Oil",
      shortDescription: "Lightweight, non-comedogenic oil for blemish-prone skin.",
      description:
        "Extracted without heat to preserve every active compound, this neem oil is blended with jojoba to sit lightly on the skin. Use three drops at night on cleansed skin.",
      categorySlug: "skin-care",
      mrp: 799,
      price: 649,
      tags: ["face oil", "neem", "cold-pressed"],
      isBestSeller: true,
      images: [
        "https://picsum.photos/seed/neem-face-oil-1/800/800",
        "https://picsum.photos/seed/neem-face-oil-2/800/800",
      ],
      variants: [
        { label: "30ml", sku: "NFO-030", price: 649, stock: 42 },
        { label: "60ml", sku: "NFO-060", price: 1099, stock: 19 },
      ],
    },
    {
      slug: "reetha-shikakai-hair-wash-powder",
      name: "Reetha-Shikakai Hair Wash Powder",
      shortDescription: "Sulfate-free cleansing powder for scalp and length.",
      description:
        "A traditional blend of reetha, shikakai, and amla dried and stone-ground. Mix with water into a paste, work through the scalp, rinse.",
      categorySlug: "hair-care",
      mrp: 449,
      price: 399,
      tags: ["hair wash", "powder", "sulfate-free"],
      isNewArrival: true,
      images: ["https://picsum.photos/seed/reetha-shikakai/800/800"],
      variants: [
        { label: "200g", sku: "RSP-200", price: 399, stock: 58 },
        { label: "500g", sku: "RSP-500", price: 849, stock: 23 },
      ],
    },
    {
      slug: "tulsi-ashwagandha-wellness-tea",
      name: "Tulsi-Ashwagandha Wellness Tea",
      shortDescription: "Caffeine-free evening blend for winding down.",
      description:
        "Whole-leaf tulsi and ashwagandha root, hand-sorted and packed within a week of harvest. Steep 4-5 minutes in water just off the boil.",
      categorySlug: "wellness",
      mrp: 349,
      price: 299,
      tags: ["tea", "ashwagandha", "caffeine-free"],
      isBestSeller: true,
      images: ["https://picsum.photos/seed/tulsi-tea/800/800"],
      variants: [
        { label: "20 bags", sku: "TAT-020", price: 299, stock: 91 },
        { label: "50 bags", sku: "TAT-050", price: 649, stock: 34 },
      ],
    },
    {
      slug: "khadi-cotton-bath-towel",
      name: "Khadi Cotton Bath Towel",
      shortDescription: "Handloom-woven, undyed cotton — softens with every wash.",
      description:
        "Woven on a handloom from undyed cotton, left free of the chemical brighteners used in most mass-produced towels.",
      categorySlug: "home",
      mrp: 599,
      price: 549,
      tags: ["towel", "handloom", "cotton"],
      images: ["https://picsum.photos/seed/khadi-towel/800/800"],
      variants: [
        { label: "Single", sku: "KCT-001", price: 549, stock: 27 },
        { label: "Set of 2", sku: "KCT-002", price: 999, stock: 15 },
      ],
    },
    {
      slug: "activated-charcoal-soap-bar",
      name: "Activated Charcoal Soap Bar",
      shortDescription: "Cold-processed bar for oily and combination skin.",
      description:
        "Cold-processed over four weeks so the glycerin stays in the bar. Activated charcoal and tea tree oil for oily and combination skin types.",
      categorySlug: "skin-care",
      mrp: 249,
      price: 199,
      tags: ["soap", "charcoal", "cold-processed"],
      isNewArrival: true,
      images: ["https://picsum.photos/seed/charcoal-soap/800/800"],
      variants: [
        { label: "100g bar", sku: "ACS-100", price: 199, stock: 120 },
        { label: "Pack of 3", sku: "ACS-300", price: 549, stock: 40 },
      ],
    },
    {
      slug: "moringa-multivitamin-capsules",
      name: "Moringa Multivitamin Capsules",
      shortDescription: "Whole-leaf moringa, no synthetic binders.",
      description:
        "Shade-dried moringa leaf, milled and capsuled without synthetic binders or anti-caking agents. Two capsules with breakfast is the usual starting dose.",
      categorySlug: "wellness",
      mrp: 599,
      price: 529,
      tags: ["supplement", "moringa", "capsules"],
      images: ["https://picsum.photos/seed/moringa-caps/800/800"],
      variants: [{ label: "60 capsules", sku: "MMC-060", price: 529, stock: 33 }],
    },
  ];

  for (const p of products) {
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: {},
      create: {
        slug: p.slug,
        name: p.name,
        shortDescription: p.shortDescription,
        description: p.description,
        mrp: p.mrp,
        price: p.price,
        tags: p.tags,
        isNewArrival: p.isNewArrival ?? false,
        isBestSeller: p.isBestSeller ?? false,
        status: "PUBLISHED",
        categoryId: bySlug[p.categorySlug],
        images: {
          create: p.images.map((url, i) => ({
            url,
            position: i,
            isPrimary: i === 0,
          })),
        },
        variants: { create: p.variants },
      },
    });
  }

  console.log(`Seeded ${categories.length} categories and ${products.length} products.`);
  console.log("Admin login: admin@leaflife.com / ChangeMe123! — change this after first login.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { prisma } from "@/lib/prisma";
import BannerForm from "@/components/admin/BannerForm";

export default async function AdminBannerPage() {
  const [hero, story] = await Promise.all([
    prisma.banner.findUnique({ where: { id: "hero" } }),
    prisma.banner.findUnique({ where: { id: "story" } }),
  ]);

  return (
    <div>
      <h1 className="font-display text-2xl text-moss-dark">Homepage content</h1>
      <p className="mt-1 text-sm text-ink/50">
        Controls both sections on your homepage, in the order they appear to visitors.
      </p>

      <div className="mt-8">
        <h2 className="font-display text-lg text-ink">1. Top banner</h2>
        <p className="text-sm text-ink/50">The big image and headline at the very top.</p>
        <div className="mt-4">
          <BannerForm
            sectionId="hero"
            initial={{
              imageUrl: hero?.imageUrl ?? "",
              imagePublicId: hero?.imagePublicId ?? "",
              headline: hero?.headline ?? "Fewer ingredients.\nOnes you can pronounce.",
              description:
                hero?.description ??
                `LEAFLIFE makes skin, hair, and wellness essentials the way they were made before "natural" needed a marketing department behind it — cold-pressed, hand-blended, and priced like the middleman was cut, because it was.`,
              buttonText: hero?.buttonText ?? "Shop the range",
              buttonUrl: hero?.buttonUrl ?? "/shop",
            }}
          />
        </div>
      </div>

      <div className="mt-12">
        <h2 className="font-display text-lg text-ink">2. Our story</h2>
        <p className="text-sm text-ink/50">
          Shown right below the top banner, before any products — your chance to tell visitors who
          you are before they start browsing. Leave the headline blank to hide this section entirely.
        </p>
        <div className="mt-4">
          <BannerForm
            sectionId="story"
            initial={{
              imageUrl: story?.imageUrl ?? "",
              imagePublicId: story?.imagePublicId ?? "",
              headline: story?.headline ?? "",
              description: story?.description ?? "",
              buttonText: story?.buttonText ?? "About us",
              buttonUrl: story?.buttonUrl ?? "/about",
            }}
          />
        </div>
      </div>
    </div>
  );
}

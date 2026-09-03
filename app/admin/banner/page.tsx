import { prisma } from "@/lib/prisma";
import BannerForm from "@/components/admin/BannerForm";

export default async function AdminBannerPage() {
  const banner = await prisma.banner.findUnique({ where: { id: "hero" } });

  return (
    <div>
      <h1 className="font-display text-2xl text-moss-dark">Homepage banner</h1>
      <p className="mt-1 text-sm text-ink/50">
        Controls the big image and headline at the top of your homepage.
      </p>

      <div className="mt-6">
        <BannerForm
          initial={{
            imageUrl: banner?.imageUrl ?? "",
            imagePublicId: banner?.imagePublicId ?? "",
            headline: banner?.headline ?? "Fewer ingredients.\nOnes you can pronounce.",
            description:
              banner?.description ??
              `LEAFLIFE makes skin, hair, and wellness essentials the way they were made before "natural" needed a marketing department behind it — cold-pressed, hand-blended, and priced like the middleman was cut, because it was.`,
            buttonText: banner?.buttonText ?? "Shop the range",
            buttonUrl: banner?.buttonUrl ?? "/shop",
          }}
        />
      </div>
    </div>
  );
}

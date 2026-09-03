-- CreateTable
CREATE TABLE "Banner" (
    "id" TEXT NOT NULL DEFAULT 'hero',
    "imageUrl" TEXT,
    "imagePublicId" TEXT,
    "headline" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "buttonText" TEXT NOT NULL,
    "buttonUrl" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Banner_pkey" PRIMARY KEY ("id")
);

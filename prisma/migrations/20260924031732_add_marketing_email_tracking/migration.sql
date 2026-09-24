-- AlterTable
ALTER TABLE "Cart" ADD COLUMN     "reminderSentAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "reviewRequestSentAt" TIMESTAMP(3);

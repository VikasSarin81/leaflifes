-- CreateEnum
CREATE TYPE "VerificationPurpose" AS ENUM ('EMAIL_VERIFY', 'PASSWORD_RESET');

-- AlterTable
ALTER TABLE "VerificationToken" ADD COLUMN     "purpose" "VerificationPurpose" NOT NULL DEFAULT 'EMAIL_VERIFY';

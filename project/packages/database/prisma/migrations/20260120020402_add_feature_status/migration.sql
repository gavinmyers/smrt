-- CreateEnum
CREATE TYPE "FeatureStatus" AS ENUM ('OPEN', 'LOCKED', 'CLOSED');

-- AlterTable
ALTER TABLE "Feature" ADD COLUMN     "status" "FeatureStatus" NOT NULL DEFAULT 'OPEN';

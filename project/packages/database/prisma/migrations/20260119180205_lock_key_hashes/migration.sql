/*
  Warnings:

  - You are about to drop the column `keyHash` on the `Key` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Key_keyHash_key";

-- AlterTable
ALTER TABLE "Key" DROP COLUMN "keyHash";

-- CreateTable
CREATE TABLE "KeyHash" (
    "id" TEXT NOT NULL,
    "keyId" TEXT NOT NULL,
    "hash" TEXT NOT NULL,

    CONSTRAINT "KeyHash_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "KeyHash_keyId_key" ON "KeyHash"("keyId");

-- AddForeignKey
ALTER TABLE "KeyHash" ADD CONSTRAINT "KeyHash_keyId_fkey" FOREIGN KEY ("keyId") REFERENCES "Key"("id") ON DELETE CASCADE ON UPDATE CASCADE;

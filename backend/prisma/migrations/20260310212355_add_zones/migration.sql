/*
  Warnings:

  - You are about to drop the column `claimedAt` on the `Zone` table. All the data in the column will be lost.
  - You are about to drop the column `claimedBy` on the `Zone` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Zone` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `Address` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Zone` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Zone" DROP CONSTRAINT "Zone_claimedBy_fkey";

-- AlterTable
ALTER TABLE "Address" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "zoneId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Zone" DROP COLUMN "claimedAt",
DROP COLUMN "claimedBy",
DROP COLUMN "status",
ADD COLUMN     "east" DOUBLE PRECISION,
ADD COLUMN     "north" DOUBLE PRECISION,
ADD COLUMN     "south" DOUBLE PRECISION,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "west" DOUBLE PRECISION,
ALTER COLUMN "color" SET DEFAULT '#3b82f6';

-- DropEnum
DROP TYPE "ZoneStatus";

-- AddForeignKey
ALTER TABLE "Address" ADD CONSTRAINT "Address_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "Zone"("id") ON DELETE SET NULL ON UPDATE CASCADE;

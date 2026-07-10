/*
  Warnings:

  - You are about to drop the column `refId` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `resCode` on the `Transaction` table. All the data in the column will be lost.
  - Added the required column `amount` to the `Transaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `bankNumber` to the `Transaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Transaction` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TxStatus" AS ENUM ('PENDING', 'PAID', 'REJECTED');

-- AlterTable
ALTER TABLE "Transaction" DROP COLUMN "refId",
DROP COLUMN "resCode",
ADD COLUMN     "amount" BIGINT NOT NULL,
ADD COLUMN     "bankNumber" TEXT NOT NULL,
ADD COLUMN     "receiptUrl" TEXT,
ADD COLUMN     "status" "TxStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "Tx" (
    "id" SERIAL NOT NULL,
    "orderId" INTEGER NOT NULL,
    "amount" BIGINT NOT NULL,
    "bankNumber" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "refId" TEXT,

    CONSTRAINT "Tx_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tx_orderId_key" ON "Tx"("orderId");

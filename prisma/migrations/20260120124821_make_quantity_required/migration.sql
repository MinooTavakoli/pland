/*
  Warnings:

  - Made the column `quantity` on table `OrderItem` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "deliveryDate" TIMESTAMP(3),
ADD COLUMN     "deliveryTime" TEXT;

-- AlterTable
ALTER TABLE "OrderItem" ALTER COLUMN "quantity" SET NOT NULL;

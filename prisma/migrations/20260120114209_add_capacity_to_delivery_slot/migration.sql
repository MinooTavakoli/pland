/*
  Warnings:

  - Added the required column `capacity` to the `DeliverySlot` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "DeliverySlot" ADD COLUMN     "capacity" INTEGER NOT NULL;

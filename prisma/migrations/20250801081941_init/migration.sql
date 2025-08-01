/*
  Warnings:

  - Made the column `type` on table `accounts` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "public"."accounts" ALTER COLUMN "type" SET NOT NULL;

/*
  Warnings:

  - The primary key for the `DocumentVector` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `embedding` on the `DocumentVector` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "DocumentVector" DROP CONSTRAINT "DocumentVector_pkey",
DROP COLUMN "embedding",
ADD COLUMN     "vector" vector,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "DocumentVector_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "DocumentVector_id_seq";

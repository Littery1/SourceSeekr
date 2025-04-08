/*
  Warnings:

  - You are about to drop the column `description` on the `saved_repositories` table. All the data in the column will be lost.
  - You are about to drop the column `forks` on the `saved_repositories` table. All the data in the column will be lost.
  - You are about to drop the column `full_name` on the `saved_repositories` table. All the data in the column will be lost.
  - You are about to drop the column `issues` on the `saved_repositories` table. All the data in the column will be lost.
  - You are about to drop the column `language` on the `saved_repositories` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `saved_repositories` table. All the data in the column will be lost.
  - You are about to drop the column `owner` on the `saved_repositories` table. All the data in the column will be lost.
  - You are about to drop the column `owner_avatar` on the `saved_repositories` table. All the data in the column will be lost.
  - You are about to drop the column `stars` on the `saved_repositories` table. All the data in the column will be lost.
  - You are about to drop the column `url` on the `saved_repositories` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[user_id,repository_id]` on the table `saved_repositories` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `repository_id` to the `saved_repositories` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "saved_repositories_user_id_full_name_key";

-- AlterTable
ALTER TABLE "saved_repositories" DROP COLUMN "description",
DROP COLUMN "forks",
DROP COLUMN "full_name",
DROP COLUMN "issues",
DROP COLUMN "language",
DROP COLUMN "name",
DROP COLUMN "owner",
DROP COLUMN "owner_avatar",
DROP COLUMN "stars",
DROP COLUMN "url",
ADD COLUMN     "repository_id" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "repositories" (
    "id" TEXT NOT NULL,
    "repo_id" INTEGER NOT NULL,
    "owner" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "description" TEXT,
    "language" TEXT,
    "stars" INTEGER NOT NULL DEFAULT 0,
    "forks" INTEGER NOT NULL DEFAULT 0,
    "issues" INTEGER NOT NULL DEFAULT 0,
    "owner_avatar" TEXT,
    "topics" TEXT[],
    "size" INTEGER NOT NULL DEFAULT 0,
    "url" TEXT NOT NULL,
    "homepage" TEXT,
    "license" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "last_fetched_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "repositories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "repositories_repo_id_key" ON "repositories"("repo_id");

-- CreateIndex
CREATE UNIQUE INDEX "repositories_full_name_key" ON "repositories"("full_name");

-- CreateIndex
CREATE INDEX "repositories_language_idx" ON "repositories"("language");

-- CreateIndex
CREATE INDEX "repositories_stars_idx" ON "repositories"("stars");

-- CreateIndex
CREATE UNIQUE INDEX "saved_repositories_user_id_repository_id_key" ON "saved_repositories"("user_id", "repository_id");

-- AddForeignKey
ALTER TABLE "saved_repositories" ADD CONSTRAINT "saved_repositories_repository_id_fkey" FOREIGN KEY ("repository_id") REFERENCES "repositories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

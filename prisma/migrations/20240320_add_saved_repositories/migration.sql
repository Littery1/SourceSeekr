-- CreateTable
CREATE TABLE "saved_repositories" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "description" TEXT,
    "language" TEXT,
    "stars" INTEGER NOT NULL DEFAULT 0,
    "forks" INTEGER NOT NULL DEFAULT 0,
    "issues" INTEGER NOT NULL DEFAULT 0,
    "owner_avatar" TEXT,
    "url" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saved_repositories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "saved_repositories_user_id_full_name_key" ON "saved_repositories"("user_id", "full_name");

-- CreateIndex
CREATE INDEX "saved_repositories_user_id_idx" ON "saved_repositories"("user_id");

-- AddForeignKey
ALTER TABLE "saved_repositories" ADD CONSTRAINT "saved_repositories_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
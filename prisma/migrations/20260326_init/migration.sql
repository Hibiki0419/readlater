CREATE TABLE "articles" (
    "id" SERIAL NOT NULL,
    "url" TEXT NOT NULL,
    "title" TEXT,
    "domain" TEXT,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "is_favorite" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "read_at" TIMESTAMP(3),

    CONSTRAINT "articles_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "articles_is_read_idx" ON "articles"("is_read");
CREATE INDEX "articles_is_favorite_idx" ON "articles"("is_favorite");
CREATE INDEX "articles_created_at_idx" ON "articles"("created_at");

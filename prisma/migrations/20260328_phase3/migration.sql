-- Create keywords table
CREATE TABLE "keywords" (
    "id" SERIAL NOT NULL,
    "word" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "keywords_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "keywords_word_key" ON "keywords"("word");

-- Create feeds table
CREATE TABLE "feeds" (
    "id" SERIAL NOT NULL,
    "url" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "feeds_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "feeds_url_key" ON "feeds"("url");

-- Add index on article URL for duplicate checking
CREATE INDEX "articles_url_idx" ON "articles"("url");

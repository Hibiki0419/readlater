-- Add content and excerpt to articles
ALTER TABLE "articles" ADD COLUMN "content" TEXT;
ALTER TABLE "articles" ADD COLUMN "excerpt" TEXT;

-- Create tags table
CREATE TABLE "tags" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#6366f1',
    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- Create article_tags junction table
CREATE TABLE "article_tags" (
    "article_id" INTEGER NOT NULL,
    "tag_id" INTEGER NOT NULL,
    CONSTRAINT "article_tags_pkey" PRIMARY KEY ("article_id","tag_id")
);

-- Create unique index on tag name
CREATE UNIQUE INDEX "tags_name_key" ON "tags"("name");

-- Add foreign keys
ALTER TABLE "article_tags" ADD CONSTRAINT "article_tags_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "article_tags" ADD CONSTRAINT "article_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

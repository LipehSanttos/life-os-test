-- ==============================================================================
-- LIFE OS - MIGRAÇÃO PARA LEITOR DE EBOOKS (PDF & EPUB)
-- Adiciona suporte a armazenamento de arquivos e estado de leitura digital
-- ==============================================================================

DO $$ BEGIN
  ALTER TABLE "Book" ADD COLUMN IF NOT EXISTS "fileUrl" TEXT;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "Book" ADD COLUMN IF NOT EXISTS "fileFormat" TEXT;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "Book" ADD COLUMN IF NOT EXISTS "fileSize" BIGINT;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "Book" ADD COLUMN IF NOT EXISTS "currentLocation" TEXT;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "Book" ADD COLUMN IF NOT EXISTS "readingSettings" JSONB DEFAULT '{
    "theme": "dark",
    "fontSize": 18,
    "fontFamily": "serif",
    "lineHeight": 1.6
  }'::jsonb;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- Migration: 20260914210000_add_user_id_to_activity_log.sql
-- Descrição: Adiciona a coluna userId e índices necessários na tabela ActivityLog para suportar exclusões de categorias isoladas por usuário.

-- 1. Adiciona a coluna userId na tabela ActivityLog caso ainda não exista
ALTER TABLE IF EXISTS public."ActivityLog" 
ADD COLUMN IF NOT EXISTS "userId" TEXT;

-- 2. Cria o índice para buscas por usuário na tabela ActivityLog
CREATE INDEX IF NOT EXISTS "ActivityLog_userId_idx" 
ON public."ActivityLog"("userId");

-- 3. Vincula a foreign key com a tabela User garantindo exclusão em cascata (SET NULL)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ActivityLog_userId_fkey'
  ) THEN
    ALTER TABLE public."ActivityLog" 
    ADD CONSTRAINT "ActivityLog_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES public."User"("id") 
    ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

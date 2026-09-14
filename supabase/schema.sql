-- ==============================================================================
-- LIFE OS - SCHEMA SQL COMPLETO E UNIFICADO PARA SUPABASE (POSTGRESQL)
-- ==============================================================================
-- Copie e cole este script diretamente no SQL Editor do Supabase para criar
-- todas as 12 tabelas, relacionamentos, índices, políticas de segurança RLS,
-- gatilhos de sincronização de autenticação e categorias padrão do sistema.
-- ==============================================================================

-- 1. Criação das Tabelas
CREATE TABLE IF NOT EXISTS public."User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL DEFAULT 'managed_by_supabase_auth',
    "avatarUrl" TEXT,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS public."UserSettings" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "email" TEXT NOT NULL DEFAULT '',
    "theme" TEXT NOT NULL DEFAULT 'dark',
    "autoConfirmAiActions" BOOLEAN NOT NULL DEFAULT false,
    "notificationsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "geminiApiKey" TEXT,
    "groqApiKey" TEXT,
    "aiProvider" TEXT NOT NULL DEFAULT 'HYBRID',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserSettings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS public."Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#6366f1',
    "icon" TEXT NOT NULL DEFAULT 'Folder',
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS public."Project" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT DEFAULT '#3b82f6',
    "icon" TEXT DEFAULT 'Briefcase',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "startDate" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3),
    "progress" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "links" TEXT,
    "userId" TEXT,
    "categoryId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS public."Course" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "institution" TEXT,
    "description" TEXT,
    "color" TEXT DEFAULT '#8b5cf6',
    "icon" TEXT DEFAULT 'GraduationCap',
    "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "currentModule" TEXT,
    "totalModules" TEXT,
    "schedule" TEXT,
    "platformUrl" TEXT,
    "certificateUrl" TEXT,
    "notes" TEXT,
    "userId" TEXT,
    "categoryId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS public."Book" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "author" TEXT,
    "isbn" TEXT,
    "coverUrl" TEXT,
    "totalPages" INTEGER,
    "currentPage" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'WANT_TO_READ',
    "rating" INTEGER,
    "notes" TEXT,
    "userId" TEXT,
    "categoryId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Book_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS public."FinancialReminder" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "amount" DOUBLE PRECISION,
    "type" TEXT NOT NULL DEFAULT 'EXPENSE',
    "dueDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "recurrenceRule" TEXT,
    "recurrenceDay" INTEGER,
    "recipient" TEXT,
    "proofUrl" TEXT,
    "notes" TEXT,
    "userId" TEXT,
    "categoryId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FinancialReminder_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS public."Task" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "notes" TEXT,
    "dueDate" TIMESTAMP(3),
    "dueTime" TEXT,
    "isAllDay" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'INBOX',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "tags" TEXT,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "recurrenceRule" TEXT,
    "lastCompletedAt" TIMESTAMP(3),
    "isBirthday" BOOLEAN NOT NULL DEFAULT false,
    "birthdayPerson" TEXT,
    "userId" TEXT,
    "categoryId" TEXT,
    "projectId" TEXT,
    "courseId" TEXT,
    "bookId" TEXT,
    "financialReminderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS public."Subtask" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Subtask_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS public."ActivityLog" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "details" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS public."ChatSession" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'Nova Conversa',
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ChatSession_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS public."ChatMessage" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "toolCalls" TEXT,
    "toolResults" TEXT,
    "pendingAction" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

-- 2. Restrições e Índices Únicos
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON public."User"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "Category_slug_key" ON public."Category"("slug");

DO $$ BEGIN
  ALTER TABLE public."User" ADD CONSTRAINT "User_role_check" CHECK ("role" IN ('USER', 'ADMIN'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3. Chaves Estrangeiras Seguras
DO $$ BEGIN
  ALTER TABLE public."Project" ADD CONSTRAINT "Project_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public."Project" ADD CONSTRAINT "Project_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public."Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public."Course" ADD CONSTRAINT "Course_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public."Course" ADD CONSTRAINT "Course_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public."Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public."Book" ADD CONSTRAINT "Book_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public."Book" ADD CONSTRAINT "Book_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public."Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public."FinancialReminder" ADD CONSTRAINT "FinancialReminder_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public."FinancialReminder" ADD CONSTRAINT "FinancialReminder_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public."Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public."Task" ADD CONSTRAINT "Task_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public."Task" ADD CONSTRAINT "Task_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public."Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public."Task" ADD CONSTRAINT "Task_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES public."Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public."Task" ADD CONSTRAINT "Task_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES public."Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public."Task" ADD CONSTRAINT "Task_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES public."Book"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public."Task" ADD CONSTRAINT "Task_financialReminderId_fkey" FOREIGN KEY ("financialReminderId") REFERENCES public."FinancialReminder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public."Subtask" ADD CONSTRAINT "Subtask_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES public."Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public."ActivityLog" ADD CONSTRAINT "ActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public."ChatSession" ADD CONSTRAINT "ChatSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public."ChatMessage" ADD CONSTRAINT "ChatMessage_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES public."ChatSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 4. Índices de Performance e Consulta
CREATE INDEX IF NOT EXISTS "Task_userId_idx" ON public."Task"("userId");
CREATE INDEX IF NOT EXISTS "Task_status_idx" ON public."Task"("status");
CREATE INDEX IF NOT EXISTS "Task_dueDate_idx" ON public."Task"("dueDate");
CREATE INDEX IF NOT EXISTS "Task_categoryId_idx" ON public."Task"("categoryId");

CREATE INDEX IF NOT EXISTS "FinancialReminder_userId_idx" ON public."FinancialReminder"("userId");
CREATE INDEX IF NOT EXISTS "FinancialReminder_dueDate_idx" ON public."FinancialReminder"("dueDate");
CREATE INDEX IF NOT EXISTS "FinancialReminder_status_idx" ON public."FinancialReminder"("status");

CREATE INDEX IF NOT EXISTS "Project_userId_idx" ON public."Project"("userId");
CREATE INDEX IF NOT EXISTS "Course_userId_idx" ON public."Course"("userId");
CREATE INDEX IF NOT EXISTS "Book_userId_idx" ON public."Book"("userId");

CREATE INDEX IF NOT EXISTS "ChatSession_userId_idx" ON public."ChatSession"("userId");
CREATE INDEX IF NOT EXISTS "ChatMessage_sessionId_idx" ON public."ChatMessage"("sessionId");
CREATE INDEX IF NOT EXISTS "Subtask_taskId_idx" ON public."Subtask"("taskId");

CREATE INDEX IF NOT EXISTS "ActivityLog_userId_idx" ON public."ActivityLog"("userId");
CREATE INDEX IF NOT EXISTS "ActivityLog_entityId_idx" ON public."ActivityLog"("entityId");

-- 5. Isolamento e Segurança (Row Level Security - RLS)
ALTER TABLE public."User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."UserSettings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Task" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Subtask" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Project" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Course" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Book" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."FinancialReminder" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ChatSession" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ChatMessage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ActivityLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Category" ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para acesso autenticado (service_role sempre tem acesso total no backend)
DO $$ BEGIN
  CREATE POLICY "Category_select_authenticated" ON public."Category" FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "User_select_own" ON public."User" FOR SELECT TO authenticated USING (id = auth.uid()::text);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "UserSettings_select_own" ON public."UserSettings" FOR SELECT TO authenticated USING (id = auth.uid()::text);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Task_select_own" ON public."Task" FOR SELECT TO authenticated USING ("userId" = auth.uid()::text);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Subtask_select_own" ON public."Subtask" FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public."Task" t WHERE t.id = "taskId" AND t."userId" = auth.uid()::text)
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Project_select_own" ON public."Project" FOR SELECT TO authenticated USING ("userId" = auth.uid()::text);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Course_select_own" ON public."Course" FOR SELECT TO authenticated USING ("userId" = auth.uid()::text);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Book_select_own" ON public."Book" FOR SELECT TO authenticated USING ("userId" = auth.uid()::text);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "FinancialReminder_select_own" ON public."FinancialReminder" FOR SELECT TO authenticated USING ("userId" = auth.uid()::text);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "ChatSession_select_own" ON public."ChatSession" FOR SELECT TO authenticated USING ("userId" = auth.uid()::text);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "ChatMessage_select_own" ON public."ChatMessage" FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public."ChatSession" s WHERE s.id = "sessionId" AND s."userId" = auth.uid()::text)
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "ActivityLog_select_own" ON public."ActivityLog" FOR SELECT TO authenticated USING ("userId" = auth.uid()::text);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 6. Trigger de Sincronização Automática com Supabase Auth (auth.users -> public.User)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public."User" (id, email, name, role, "createdAt", "updatedAt")
  VALUES (
    NEW.id::text,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'USER'),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    "updatedAt" = NOW();

  INSERT INTO public."UserSettings" (id, name, email, theme, "createdAt", "updatedAt")
  VALUES (
    NEW.id::text,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    'dark',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. Seed Inicial de Categorias Padrão
INSERT INTO public."Category" (id, name, slug, color, icon, "isSystem", "sortOrder", "updatedAt")
VALUES
  ('cat_estudos', 'Estudos', 'estudos', '#8b5cf6', 'GraduationCap', true, 1, NOW()),
  ('cat_faculdade', 'Faculdade', 'faculdade', '#ec4899', 'BookOpenCheck', true, 2, NOW()),
  ('cat_cursos', 'Cursos', 'cursos', '#3b82f6', 'Laptop', true, 3, NOW()),
  ('cat_trabalho', 'Trabalho', 'trabalho', '#0ea5e9', 'Briefcase', true, 4, NOW()),
  ('cat_freelance', 'Freelance', 'freelance', '#10b981', 'DollarSign', true, 5, NOW()),
  ('cat_pessoal', 'Pessoal', 'pessoal', '#f59e0b', 'User', true, 6, NOW()),
  ('cat_saude', 'Saúde', 'saude', '#ef4444', 'HeartPulse', true, 7, NOW()),
  ('cat_financas', 'Finanças', 'financas', '#14b8a6', 'Wallet', true, 8, NOW()),
  ('cat_casa', 'Casa', 'casa', '#d946ef', 'Home', true, 9, NOW()),
  ('cat_compras', 'Compras', 'compras', '#64748b', 'ShoppingCart', true, 10, NOW()),
  ('cat_projetos', 'Projetos', 'projetos', '#6366f1', 'FolderKanban', true, 11, NOW()),
  ('cat_leitura', 'Leitura', 'leitura', '#84cc16', 'BookOpen', true, 12, NOW()),
  ('cat_aniversarios', 'Aniversários', 'aniversarios', '#f43f5e', 'Cake', true, 13, NOW()),
  ('cat_outros', 'Outros', 'outros', '#94a3b8', 'Folder', true, 14, NOW())
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  color = EXCLUDED.color,
  icon = EXCLUDED.icon,
  "sortOrder" = EXCLUDED."sortOrder",
  "updatedAt" = NOW();

---
name: supabase-migrations
description: Guia e padroniza a criação de migrations seguras e políticas de Row Level Security (RLS) no Supabase para o Life OS. Ative sempre que o usuário solicitar criação de novas tabelas, alteração de colunas, índices ou configuração de políticas de segurança no banco de dados.
---

# Padrões de Migrations e RLS (Supabase)

Diretrizes para arquitetura e criação de esquemas seguros no banco de dados PostgreSQL / Supabase do Life OS.

## 1. Localização e Nomenclatura dos Arquivos
- Arquivos de migração devem ser criados no diretório supabase/migrations/.
- Padrão de nome: <TIMESTAMP>_<descricao_em_snake_case>.sql (ex: 20260907180000_adicionar_tabela_metas.sql).

## 2. Regras Mandatórias de RLS (Row Level Security)
Toda e qualquer nova tabela criada DEVE seguir estes passos sem exceção:

1. **Chave Estrangeira do Usuário**:
   - Incluir a coluna user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL DEFAULT auth.uid().
2. **Habilitar RLS Imediatamente**:
   `sql
   ALTER TABLE nome_da_tabela ENABLE ROW LEVEL SECURITY;
   `
3. **Políticas de Acesso Granulares**:
   - Criar políticas para SELECT, INSERT, UPDATE e DELETE garantindo o isolamento multi-tenant:
   `sql
   -- Leitura: usuário só lê os próprios registros
   CREATE POLICY Usuarios podem visualizar seus proprios registros
     ON nome_da_tabela FOR SELECT
     USING (auth.uid() = user_id);

   -- Inserção: usuário só insere registros com o seu próprio ID
   CREATE POLICY Usuarios podem inserir seus proprios registros
     ON nome_da_tabela FOR INSERT
     WITH CHECK (auth.uid() = user_id);

   -- Atualização: usuário só altera seus próprios registros
   CREATE POLICY Usuarios podem atualizar seus proprios registros
     ON nome_da_tabela FOR UPDATE
     USING (auth.uid() = user_id)
     WITH CHECK (auth.uid() = user_id);

   -- Exclusão: usuário só deleta seus próprios registros
   CREATE POLICY Usuarios podem deletar seus proprios registros
     ON nome_da_tabela FOR DELETE
     USING (auth.uid() = user_id);
   `

## 3. Performance e Índices
- Sempre criar índice na coluna user_id:
  `sql
  CREATE INDEX IF NOT EXISTS idx_nome_tabela_user_id ON nome_da_tabela(user_id);
  `
- Para tabelas temporais ou com filtros frequentes, indexar colunas de busca (ex: created_at, status).

## 4. Idioma Obrigatório
- Todos os comentários SQL dentro das migrations DEVEM estar escritos em **Português (pt-BR)**.
- Exemplo: -- Tabela para armazenar as transações financeiras do usuário.

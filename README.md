# 🌟 Life OS - Sistema Operacional de Produtividade & Gestão Pessoal

<div align="center">

![Life OS Banner](./public/life-os-banner.jpg)

**Plataforma completa, inteligente e minimalista para centralizar sua rotina pessoal, acadêmica, profissional e financeira.**

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18-blue?style=for-the-badge&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![Google Gemini](https://img.shields.io/badge/Google%20Gemini-AI-8E75B2?style=for-the-badge&logo=google)](https://ai.google.dev/)
[![Groq](https://img.shields.io/badge/Groq-LLaMA%203.3-F55036?style=for-the-badge&logo=groq)](https://groq.com/)

</div>

---

## 📑 Sumário

- [Visão Geral](#-visão-geral)
- [Principais Funcionalidades](#-principais-funcionalidades)
  - [1. Dashboard Central & Métricas em Tempo Real](#1-dashboard-central--métricas-em-tempo-real)
  - [2. Gestão de Tarefas Avançada (Inbox GTD, Hoje, Próximos)](#2-gestão-de-tarefas-avançada-inbox-gtd-hoje-próximos)
  - [3. Módulo de Aniversários & Lembretes Festivos](#3-módulo-de-aniversários--lembretes-festivos)
  - [4. IA Híbrida (Google Gemini + Groq LLaMA 3.3 + Motor NLP Local)](#4-ia-híbrida-google-gemini--groq-llama-33--motor-nlp-local)
  - [5. Sincronização em 1 Clique com Google Agenda](#5-sincronização-em-1-clique-com-google-agenda)
  - [6. Biblioteca & Rastreamento de Leitura (ISBN & Capas)](#6-biblioteca--rastreamento-de-leitura-isbn--capas)
  - [7. Projetos & Gestão de Metas com Progresso Automático](#7-projetos--gestão-de-metas-com-progresso-automático)
  - [8. Estudos & Acompanhamento Acadêmico](#8-estudos--acompanhamento-acadêmico)
  - [9. Controle Financeiro & Contas a Pagar](#9-controle-financeiro--contas-a-pagar)
  - [10. Busca Global Inteligente (`Ctrl + K`)](#10-busca-global-inteligente-ctrl--k)
  - [11. Central de Notificações](#11-central-de-notificações)
  - [12. Gestão Multi-usuário & Painel Administrativo](#12-gestão-multi-usuário--painel-administrativo)
  - [13. Design Moderno (Dark Space, Glow Borders, Geist Font)](#13-design-moderno-dark-space-glow-borders-geist-font)
- [Arquitetura de Segurança & Isolamento](#-arquitetura-de-segurança--isolamento)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Instalação & Configuração Local](#-instalação--configuração-local)
- [Variáveis de Ambiente](#-variáveis-de-ambiente)
- [Build & Deploy](#-build--deploy)
- [Licença](#-licença)

---

## 🧭 Visão Geral

O **Life OS** centraliza todas as esferas da produtividade diária em uma única interface elegante, rápida e livre de distrações. 

Construído com **Next.js (App Router)**, TypeScript e persistência direta em **PostgreSQL (Supabase)** via HTTPS REST API, o sistema conta com um orquestrador de **Inteligência Artificial Híbrida** capaz de transformar instruções informais em linguagem natural em ações estruturadas no sistema — tarefas agendadas, contas registradas, livros atualizados e eventos criados.

---

## ✨ Principais Funcionalidades

### 1. Dashboard Central & Métricas em Tempo Real
- **Saudação Contextual:** Resumo do dia adaptado ao horário e perfil do usuário.
- **Métricas Chave:** Contadores instantâneos de tarefas para hoje, pendências atrasadas, prioridades urgentes, projetos ativos e cursos em andamento.
- **Acesso Rápido:** Atalho para criação instantânea de tarefas e pesquisa universal.

### 2. Gestão de Tarefas Avançada (Inbox GTD, Hoje, Próximos)
- **Inbox:** Caixa de captura rápida para descarregar pensamentos sem interrupções.
- **Visualização "Hoje":** Foco exclusivo nas obrigações com prazo para a data atual.
- **Visualização "Próximos":** Linha do tempo de 3, 7 ou 30 dias para planejamento antecipado.
- **Subtarefas Reordenáveis:** Divisão de grandes objetivos em etapas menores com checklist.
- **Recorrência Inteligente:** Repetição configurável (`DIÁRIA`, `SEMANAL`, `MENSAL`, `ANUAL`) com avanço automático da próxima data ao concluir a tarefa.
- **Prioridades & Tags:** Níveis `BAIXA`, `MÉDIA`, `ALTA` e `URGENTE`, com suporte a etiquetas e notas.

### 3. Módulo de Aniversários & Lembretes Festivos
- Categoria e visão especial para datas de aniversário com recorrência anual contínua.
- **Notificações Próximas:** Alertas visuais destacados para aniversários ocorrendo "Hoje! 🎉", "Amanhã! 🎁" ou dentro da janela de 15 dias.

### 4. IA Híbrida (Google Gemini + Groq LLaMA 3.3 + Motor NLP Local)
- **Roteamento Inteligente & Failover:** Suporte configurável aos modelos Google Gemini (2.5 Flash / 2.0 Flash) e Groq Cloud (LLaMA 3.3 70B), com tolerância a falhas.
- **Motor NLP Determinístico Offline:** Processamento de linguagem natural nativo em JavaScript caso as APIs externas estejam offline ou sem chave configurada.
- **Sanitização Semântica Estrita:** A IA limpa saudações e pedidos, extrai o título direto da ação, isola valores monetários e calcula datas/horários relativos sem alucinar valores numéricos.
- **Cartões de Confirmação Interativos:** Ações sugeridas pela IA exigem aprovação explícita do usuário antes de qualquer alteração no banco de dados.

### 5. Sincronização em 1 Clique com Google Agenda
- Todas as tarefas com data ou horário geram links RFC 5545 compatíveis para abertura imediata no **Google Calendar**, preenchendo título, horários e notas automaticamente.

### 6. Biblioteca & Rastreamento de Leitura (ISBN & Capas)
- **Consulta Automática por ISBN:** Integração combinada com Google Books API e Open Library API para preenchimento de título, autor, total de páginas e capa oficial em alta definição.
- **Upload Seguro de Capas:** Envio direto de imagens locais com validação estrita de tipos MIME (`PNG`, `JPG`, `WEBP`, `GIF`, `AVIF`).
- **Avanço de Leitura:** Rastreamento de página atual, cálculo de porcentagem lida e botões de atalho rápido (+5 págs, +20 págs).

### 7. Projetos & Gestão de Metas com Progresso Automático
- Criação de iniciativas com vínculos a tarefas, prazos e categorias.
- **Cálculo Automático de Progresso:** A barra de conclusão do projeto reflete em tempo real o status das tarefas vinculadas.

### 8. Estudos & Acompanhamento Acadêmico
- Gestão de cursos, graduações e certificações por instituição.
- Controle modular de progresso (ex: "Módulo 4 de 10") e notas de estudo.

### 9. Controle Financeiro & Contas a Pagar
- Controle de receitas, despesas, boletos e faturas.
- Métricas consolidadas em tempo real com **Total Pendente** e **Total Pago**.
- Suporte a contas recorrentes e comprovantes anexados.

### 10. Busca Global Inteligente (`Ctrl + K`)
- Modal de busca instantânea com pesquisa federada em tarefas, projetos, cursos, livros e finanças, com isolamento estrito por usuário.

### 11. Central de Notificações
- Painel unificado com contadores para contas a vencer nos próximos dias, tarefas em atraso e aniversários do período.

### 12. Gestão Multi-usuário & Painel Administrativo
- **Controle de Acesso Baseado em Papéis (RBAC):** Perfis `ADMIN` e `USER`.
- **Painel Administrativo (`/admin/users`):** Usuários administradores podem provisionar novos membros, alterar perfis, redefinir senhas e gerenciar acessos.
- **Configurações Individuais (`/settings`):** Preferências de tema, notificações e IA individualizadas por usuário.

### 13. Design Moderno (Dark Space, Glow Borders, Geist Font)
- Interface inspirada nas melhores práticas de design de ferramentas de alta performance (AuthKit, Vercel).
- Tipografia com a família de fontes **Geist**, micro-interações fluidas, efeitos de foco em campos e suporte completo a temas.

---

## 🔒 Arquitetura de Segurança & Isolamento

A segurança do Life OS foi projetada seguindo as diretrizes do **OWASP Top 10**:

1. **Autenticação Segura com Tokens HMAC:**
   - Sessões gerenciadas por tokens assinados criptograficamente via HMAC-SHA256 armazenados em cookies `httpOnly`, `sameSite: lax` e flag `secure` em produção.
   - Em produção, a chave `AUTH_SECRET` é estritamente obrigatória (mínimo de 16 caracteres).
2. **Defesa Ativa contra Brute Force (Rate Limiting):**
   - Rota `/api/auth/login` protegida por limitador de taxa deslizante em memória (máximo de 5 tentativas com bloqueio temporário e cabeçalho `Retry-After`).
3. **Isolamento Estrito de Recursos (Multi-Tenancy & Prevenção de IDOR):**
   - Todas as operações em endpoints REST, busca global e execução de ferramentas de IA validam obrigatoriamente a sessão e filtram pelo `userId` do solicitante.
4. **Armazenamento Seguro de Senhas:**
   - Hashing com sal criptográfico de 16 bytes via **PBKDF2 com 100.000 iterações (SHA-512)** e comparação em tempo constante (`crypto.timingSafeEqual`) contra timing attacks.
5. **Upload Blindado contra Stored XSS:**
   - Extensões geradas no servidor determinadas estritamente a partir do tipo MIME validado.
   - Formatos perigosos executáveis e arquivos SVG com scripts bloqueados na validação.
6. **Cabeçalhos HTTP de Proteção Avançada:**
   - `Content-Security-Policy` (CSP)
   - `Strict-Transport-Security` (HSTS)
   - `X-Frame-Options: DENY` (Anti-Clickjacking)
   - `X-Content-Type-Options: nosniff` (Anti-MIME Sniffing)
   - `Permissions-Policy` (Restrição de acesso a sensores/periféricos)

---

## 📁 Estrutura do Projeto

```text
life-os/
├── public/                 # Favicon, imagens e assets públicos estáticos
├── src/
│   ├── app/                # Next.js App Router
│   │   ├── admin/users/    # Painel administrativo de gestão de usuários
│   │   ├── api/            # Endpoints REST autenticados
│   │   │   ├── admin/      # Gestão de usuários (restrito a ADMIN)
│   │   │   ├── auth/       # Login, Logout, Me, Alteração de Senha
│   │   │   ├── books/      # Integração de busca ISBN
│   │   │   ├── categories/ # Gestão de categorias
│   │   │   ├── chat/       # Mensagens de IA e confirmação de ações
│   │   │   ├── finance/    # Lembretes financeiros e contas
│   │   │   ├── notifications/# Alertas consolidados (aniversários, atrasos, contas)
│   │   │   ├── projects/   # Projetos e metas
│   │   │   ├── reading/    # Livros e biblioteca pessoal
│   │   │   ├── search/     # Busca federada global autenticada
│   │   │   ├── settings/   # Configurações do usuário e IA
│   │   │   ├── stats/      # Métricas e contadores
│   │   │   ├── studies/    # Cursos e estudos
│   │   │   ├── tasks/      # CRUD de tarefas, subtarefas e filtros temporais
│   │   │   └── upload/     # Upload protegido de capas
│   │   ├── calendar/       # Calendário mensal/semanal
│   │   ├── chat/           # Interface interativa de conversação com IA
│   │   ├── dashboard/      # Painel central de visão geral
│   │   ├── finance/        # Gestão financeira
│   │   ├── inbox/          # Caixa de entrada GTD
│   │   ├── login/          # Autenticação de usuários
│   │   ├── projects/       # Visão de projetos e progresso
│   │   ├── reading/        # Estante virtual de leituras
│   │   ├── settings/       # Painel de preferências do usuário
│   │   ├── studies/        # Gestão acadêmica e de cursos
│   │   ├── today/          # Tarefas de hoje
│   │   └── upcoming/       # Tarefas futuras
│   ├── components/         # Componentes React de UI, modais, cartões e layout
│   ├── lib/                # Bibliotecas utilitárias e conectores
│   │   ├── ai/             # Orquestrador de IA (Gemini, Groq, NLP fallback, Tools)
│   │   ├── supabase/       # Conectores Supabase SDK (Admin e Client)
│   │   ├── auth.ts         # Tokens de sessão, hashes PBKDF2 e autenticação
│   │   ├── db.ts           # Driver universal de banco de dados via HTTPS REST
│   │   └── utils.ts        # Formatadores de data, moeda e helpers
│   └── middleware.ts       # Proteção de rotas privadas na borda
├── supabase/               # Esquemas SQL e migrações do banco
├── next.config.mjs         # Configurações do Next.js e cabeçalhos de segurança
└── package.json            # Dependências e scripts do projeto
```

---

## ⚙️ Instalação & Configuração Local

### Pré-requisitos
- [Node.js](https://nodejs.org/) versão 20 ou superior
- Gerenciador de pacotes `npm`

### 1. Clonar o Repositório
```bash
git clone https://github.com/LipehSanttos/life-os.git
cd life-os/life-os
```

### 2. Instalar Dependências
```bash
npm install
```

### 3. Configurar as Variáveis de Ambiente
Copie o arquivo de exemplo e defina suas credenciais:
```bash
cp .env.example .env
```
*(Veja a seção [Variáveis de Ambiente](#-variáveis-de-ambiente) abaixo para detalhes dos campos).*

### 4. Inicializar o Banco de Dados
Execute os scripts contidos em `supabase/schema.sql` no SQL Editor do seu projeto Supabase (ou banco PostgreSQL equivalente) para criar a estrutura das tabelas, relacionamentos e categorias padrão.

### 5. Iniciar o Servidor de Desenvolvimento
```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) no seu navegador.

---

## 🔐 Variáveis de Ambiente

Crie o arquivo `.env` na raiz do projeto com a seguinte estrutura:

```env
# ==============================================================================
# 1. BANCO DE DADOS & SUPABASE
# ==============================================================================
NEXT_PUBLIC_SUPABASE_URL="https://seu-projeto.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="sua-chave-anon-publica"
SUPABASE_SERVICE_ROLE_KEY="sua-chave-service-role-privada"

# URLs de Conexão PostgreSQL (Opcional caso utilize o SDK HTTPS do Supabase)
DATABASE_URL="postgresql://postgres.[REF]:[SENHA]@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[REF]:[SENHA]@aws-0-sa-east-1.pooler.supabase.com:5432/postgres"

# ==============================================================================
# 2. AUTENTICAÇÃO & SEGURANÇA
# ==============================================================================
# Chave secreta de alta entropia para assinatura dos tokens de sessão (mínimo 16 caracteres)
AUTH_SECRET="chave-secreta-longa-e-aleatoria-para-sua-aplicacao"

# ==============================================================================
# 3. MOTORES DE INTELIGÊNCIA ARTIFICIAL (Opcional - Sistema possui NLP local)
# ==============================================================================
# Google Gemini API Key: https://aistudio.google.com/
GEMINI_API_KEY="sua-chave-gemini-aqui"

# Groq Cloud API Key: https://console.groq.com/keys
GROQ_API_KEY="gsk_sua-chave-groq-aqui"
```

---

## 🚀 Build & Deploy

### Produção Padrão (Node.js / Vercel / Cloud Provider)
```bash
# Gerar build otimizado
npm run build

# Iniciar servidor de produção
npm start
```

### Cloudflare Workers (via OpenNext)
O projeto conta com suporte integrado ao runtime edge do Cloudflare Workers:
```bash
# Build para Cloudflare Worker
npm run build:worker

# Pré-visualização local do worker
npm run preview

# Deploy direto no Cloudflare
npm run deploy
```

---

## 📄 Licença

Este projeto é disponibilizado sob a licença MIT. Consulte o arquivo [LICENSE](./LICENSE) para mais detalhes.

<div align="center">

Desenvolvido para máxima clareza mental, foco e execução. 🚀

</div>

<div align="center">

# 🌌 Life OS

### O Sistema Operacional Pessoal Definitivo: Produtividade, Finanças, Estudos & IA Híbrida

[![Next.js](https://img.shields.io/badge/Next.js-16.3-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18-087ea4?style=for-the-badge&logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178c6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ecf8e?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Google Gemini](https://img.shields.io/badge/Google%20Gemini-Flash-8e75b2?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)
[![Groq Cloud](https://img.shields.io/badge/Groq-LLaMA%203.3-f55036?style=for-the-badge&logo=groq&logoColor=white)](https://groq.com/)
[![Cloudflare](https://img.shields.io/badge/Cloudflare-OpenNext-f38020?style=for-the-badge&logo=cloudflare&logoColor=white)](https://cloudflare.com/)

<br />

<p align="center">
  <img src="./public/life-os-banner.jpg" alt="Life OS Banner" width="100%" style="border-radius: 12px; box-shadow: 0 20px 40px rgba(0,0,0,0.5);" />
</p>

<p align="center">
  <b>Minimalista. Rápido. Inteligente.</b><br />
  Centralize rotinas, finanças, hábitos, metas acadêmicas e leitura em uma plataforma com design Dark Space, micrinterações fluidas e um assistente de IA com confirmação interativa de ações.
</p>

[Começar Agora](#-guia-de-início-rápido) • [Funcionalidades](#-módulos-e-recursos) • [Banco de Dados](#-estrutura-e-banco-de-dados) • [Deploy](#-deploy--produção)

---

</div>

## 💡 Por que o Life OS?

Muitos aplicativos fragmentam sua vida: um app para tarefas, uma planilha para finanças, outro para leitura e calendários desorganizados. O **Life OS** reúne essas esferas em uma experiência unificada:

- **⚡ Arquitetura Edge-Ready:** Construído sobre Next.js 16 (Turbopack) com persistência no Supabase (PostgreSQL) via HTTPS REST SDK, dispensando conexões lentas de pooler e pronto para rodar na Cloudflare Workers ou Vercel.
- **🤖 Inteligência Artificial Híbrida:** Integração nativa com Google Gemini e Groq (LLaMA 3.3 70B), somada a um motor NLP determinístico local que processa comandos mesmo offline.
- **🛡️ Segurança de Ponta:** Isolamento de dados com Row Level Security (RLS), senhas criptografadas via PBKDF2 com 100.000 iterações (SHA-512) e tokens de sessão HMAC assinado.
- **🎨 Design Dark Space:** Tipografia Geist, estética moderna, efeito glow em bordas, atalhos rápidos de teclado (`Ctrl + K`) e animações com foco em produtividade.

---

## 🚀 Módulos e Recursos

### 1. 📋 Gestão de Tarefas & Metodologia GTD
- **Inbox Central:** Caixa de captura rápida para descarregar ideias sem interrupções.
- **Visão "Hoje" e "Próximos":** Filtros automáticos com linhas do tempo de 3, 7 e 30 dias.
- **Checklist & Subtarefas:** Decomposição de tarefas complexas com reordenação e checklist.
- **Recorrência Inteligente:** Repetições diárias, semanais, mensais ou anuais com cálculo automático da próxima data.
- **Prioridades Visuais:** Níveis Urgente, Alta, Média e Baixa com badges e indicadores pontuais.

### 2. 🎂 Módulo de Aniversários & Celebrações
- Seção exclusiva para datas comemorativas com ciclo anual automático.
- Notificações visuais e contagem regressiva para eventos de "Hoje", "Amanhã" ou nos próximos 15 dias.

### 3. 🧠 Orquestrador de IA & Function Calling
- **Processamento em Linguagem Natural:** Crie tarefas, contas, projetos ou registros de leitura conversando normalmente (ex: *"Lembrar de pagar o condomínio de R$ 450 dia 10"*).
- **Cartões de Confirmação Interativos:** Nenhuma alteração é gravada no banco sem a sua aprovação explícita em tela.
- **Failover Automático:** Alternância transparente entre Gemini, Groq e motor NLP local caso as conexões externas estejam indisponíveis.

### 4. 📅 Integração em 1 Clique com Google Agenda
- Todas as tarefas com prazo contam com geração imediata de link compatível com o padrão **RFC 5545** para abertura direta no Google Calendar com horários e notas já preenchidos.

### 5. 📚 Biblioteca & Hábitos de Leitura
- **Busca por ISBN:** Preenchimento automático de capa em alta definição, autor, editora e total de páginas via Open Library e Google Books.
- **Acompanhamento de Páginas:** Controle de leitura atual, barra percentual e atalhos rápidos de progresso (+5 págs, +20 págs).

### 6. 💼 Projetos, Metas & Estudos
- **Projetos com Progresso Automático:** O percentual de conclusão do projeto é calculado dinamicamente de acordo com o status das tarefas vinculadas.
- **Acompanhamento Acadêmico:** Gestão de cursos, graduações e módulos concluídos com links para plataformas de ensino.

### 7. 💳 Controle Financeiro
- Gerenciamento de despesas, receitas e contas a pagar com acompanhamento em tempo real do total pendente e quitado.
- Suporte a comprovantes anexados e recorrências financeiras.

### 8. 🔍 Busca Universal (`Ctrl + K`) & Notificações
- Localizador global para navegação instantânea entre tarefas, livros, cursos, categorias e finanças.
- Central de notificações web integradas ao navegador.

---

## 🛠️ Stack Tecnológica

| Camada | Tecnologias Utilizadas |
| :--- | :--- |
| **Frontend & SSR** | Next.js 16 (App Router), React 18, Geist Font, Lucide Icons |
| **Estilização** | Tailwind CSS 3.4, Efeitos Glow & Glassmorphism |
| **Banco de Dados** | Supabase (PostgreSQL), Row Level Security (RLS) |
| **Inteligência Artificial** | Google Gemini API (`@google/generative-ai`), Groq Cloud SDK, Motor NLP Local |
| **Autenticação & Segurança** | HMAC SHA-256 JWT, Criptografia PBKDF2 (NIST), Cookies HttpOnly |
| **Infraestrutura & Deploy** | Cloudflare Workers / Pages (via `@opennextjs/cloudflare` e `wrangler`) ou Vercel |

---

## ⚡ Guia de Início Rápido

### Pré-requisitos
- **Node.js:** Versão `>= 20.9.0`
- **NPM** ou gerenciador de pacotes compatível
- Uma conta gratuita no [Supabase](https://supabase.com)

---

### 1. Clonar e Instalar Dependências

```bash
# Clone o repositório
git clone https://github.com/LipehSanttos/life-os-test.git life-os
cd life-os

# Instale as dependências
npm install
```

---

### 2. Configurar o Banco de Dados (Supabase)

1. No painel do [Supabase](https://supabase.com/dashboard), crie um novo projeto.
2. Abra o **SQL Editor** do projeto recém-criado.
3. Copie todo o conteúdo do arquivo [`supabase/schema.sql`](./supabase/schema.sql) e cole no editor.
4. Execute o script (`Ctrl + Enter`).
   > Esse script cria todas as tabelas, relacionamentos, índices de performance, políticas de segurança RLS, trigger de sincronização de login e o catálogo inicial de categorias.

---

### 3. Configurar as Variáveis de Ambiente

Crie o seu arquivo `.env` na raiz do projeto:

```bash
cp .env.example .env
```

Abra o arquivo `.env` e preencha com as chaves do seu projeto:

```env
# Conexão com o Supabase (Painel > Project Settings > API)
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon-publica
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role-privada

# Segredo de assinatura de tokens de sessão (mínimo 16 caracteres aleatórios)
AUTH_SECRET=sua-chave-secreta-aleatoria-com-mais-de-16-caracteres

# Chaves de IA (Opcionais - podem ser adicionadas depois no painel de configurações)
GEMINI_API_KEY=
GROQ_API_KEY=
```

> **Dica para o AUTH_SECRET:** Gere uma chave aleatória segura rodando no terminal:
> ```bash
> node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
> ```

---

### 4. Criar o Primeiro Usuário e Iniciar

1. No painel do Supabase, vá em **Authentication** > **Users** > **Add User** > **Create User**.
2. Digite seu e-mail, senha e marque **Auto Confirm User**.
3. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```
4. Acesse no navegador: [http://localhost:3000/login](http://localhost:3000/login)

---

## 📜 Scripts Disponíveis

| Comando | Descrição |
| :--- | :--- |
| `npm run dev` | Inicia o servidor de desenvolvimento local na porta 3000 |
| `npm run build` | Compila o projeto para produção com validação estrita de tipos |
| `npm run start` | Executa o build de produção localmente |
| `npm run lint` | Executa o linter do Next.js |
| `npm run build:worker` | Gera os artefatos de build otimizados para a Cloudflare (OpenNext) |
| `npm run preview` | Testa a aplicação localmente simulando o ambiente da Cloudflare |
| `npm run deploy` | Realiza o deploy automático para a Cloudflare Workers via Wrangler |

---

## 🌐 Deploy & Produção

### Opção 1: Cloudflare Pages / Workers (OpenNext)
O projeto já conta com [open-next.config.ts](./open-next.config.ts) e [wrangler.jsonc](./wrangler.jsonc) configurados:
```bash
# Autentique no Cloudflare Wrangler
npx wrangler login

# Compile e envie para a Cloudflare
npm run deploy
```
> Configure as mesmas variáveis de ambiente (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` e `AUTH_SECRET`) no painel da Cloudflare em **Settings > Variables and Secrets**.

### Opção 2: Vercel
1. Importe o repositório na [Vercel](https://vercel.com).
2. Adicione as variáveis de ambiente do `.env`.
3. O build padrão (`npm run build`) será executado automaticamente.

---

## 🔒 Arquitetura de Segurança & Isolamento

- **Proteção contra IDOR:** Todas as rotas de API validam a sessão autenticada contra o identificador do recurso solicitado.
- **Row Level Security Ativo:** Mesmo em caso de falha de camada lógica, o banco PostgreSQL rejeita leituras ou gravações que não pertençam ao usuário autenticado via token JWT.
- **Validação Estrita de Arquivos:** O endpoint de upload bloqueia tipos não autorizados, prevenindo vulnerabilidades de Stored XSS e execução remota de arquivos.
- **Rate Limiting Nativo:** O endpoint de login conta com proteção integrada em memória contra ataques de força bruta.

---

## 📄 Licença

Este projeto é disponibilizado sob a licença [MIT](./LICENSE). Sinta-se à vontade para utilizar, modificar e contribuir.

<div align="center">
  <sub>Construído com foco em excelência e produtividade diária.</sub>
</div>

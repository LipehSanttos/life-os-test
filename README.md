<div align="center">

# 🌌 Life OS

### O Sistema Operacional Pessoal Definitivo: Produtividade, Finanças, Estudos, Leitor de eBooks & IA Híbrida

[![Next.js](https://img.shields.io/badge/Next.js-16.3-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18.3-087ea4?style=for-the-badge&logo=react&logoColor=white)](https://react.dev/)
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
  <b>Minimalista. Ultraveloz. Inteligente. Resiliente.</b><br />
  Centralize tarefas GTD, finanças, estudos acadêmicos, projetos e um leitor digital nativo de eBooks (PDF e EPUB) em uma interface Dark Space fluida com assistente de IA integrado.
</p>

[Começar Agora](#-guia-de-início-rápido) • [Módulos do Sistema](#-módulos-e-funcionalidades) • [Arquitetura & Segurança](#-arquitetura--segurança) • [Banco de Dados](#-estrutura-do-banco-de-dados) • [Deploy em Produção](#-deploy--produção)

---

</div>

## 💡 Sobre o Life OS

O **Life OS** foi idealizado para resolver a dispersão do dia a dia: em vez de alternar constantemente entre aplicativos de tarefas, planilhas financeiras, leitores avulsos de documentos e calendários desarticulados, o sistema reúne todas as esferas em uma experiência integrada e focada.

### Diferenciais de Engenharia:
- **⚡ Arquitetura Edge-Ready:** Construído sobre **Next.js 16 (Turbopack)**, adaptável para execução nativa em **Cloudflare Workers / Pages** (via `@opennextjs/cloudflare`) ou **Vercel**, com driver HTTPS REST direto ao **Supabase (PostgreSQL)** que elimina conexões lentas de pooler (portas 6543/5432).
- **📖 Leitor Digital Nativo com Dropzone & Fallback Resiliente:** Suporte completo para visualização de arquivos **PDF** e **EPUB** com modo zen, ajuste fino de tipografia, temas customizáveis e persistência multi-camada (Supabase Storage -> Disco local -> IndexedDB no navegador), garantindo funcionamento ininterrupto mesmo em ambientes serverless.
- **🤖 Inteligência Artificial Híbrida com Function Calling:** Orquestração dinâmica entre **Google Gemini** e **Groq (LLaMA 3.3 70B)**, amparada por um motor local determinístico (NLP) para contingência offline e cartões de confirmação interativos que garantem controle total ao usuário.
- **📱 Experiência Mobile Otimizada (FAB):** Botão de Ação Flutuante (*Floating Action Button*) no canto inferior com suporte a *Safe Area* para adicionar tarefas instantaneamente em qualquer tela móvel.
- **🛡️ Segurança Criptográfica Rigorosa:** Isolamento estrito por usuário através de **Row Level Security (RLS)**, derivação de senhas com **PBKDF2 (100.000 iterações SHA-512)** conforme diretrizes NIST SP 800-132 e sessões autenticadas via **HMAC-SHA256 JWT** em cookies protegidos (`HttpOnly`, `SameSite=Lax`).

---

## 🚀 Módulos e Funcionalidades

### 1. 📋 Gestão de Tarefas & Metodologia GTD
* **Inbox Central (`/inbox`):** Caixa de entrada para captura ágil de pensamentos, ideias e obrigações sem fricção.
* **Painel "Hoje" (`/today`):** Foco no que deve ser executado no dia, com destaque visual de pendências atrasadas e comemoração animada de confetes (`canvas-confetti`) ao zerar a lista.
* **Painel "Próximos" (`/upcoming`):** Linha do tempo visual com filtros dinâmicos de 3, 7 e 30 dias.
* **Subtarefas & Checklists:** Estruturação de tarefas complexas em etapas checáveis e ordenáveis.
* **Regras de Recorrência:** Agendamento diário, semanal, mensal ou anual com cálculo automático da próxima ocorrência após a conclusão.
* **Níveis de Prioridade & Metadados:** Classificação em Urgente, Alta, Média e Baixa, com estimativa de tempo, cliente/valor financeiro vinculado e matérias acadêmicas associadas.
* **Botão Flutuante Mobile (FAB):** Botão fixo `[+ Nova Tarefa]` no canto inferior direito para celulares e tablets (`md:hidden`), ocultado inteligentemente no leitor para não obstruir o conteúdo.
* **Sincronização com Google Agenda:** Exportação imediata em 1 clique no padrão RFC 5545, permitindo abrir o evento pronto no Google Calendar.

---

### 2. 📖 Leitor de eBooks & Biblioteca Digital (`/reading`)
* **Aba Dedicada "Leitor de eBooks" com Dropzone:**
  * Área de arrastar e soltar arquivos `.pdf` e `.epub` de até 50MB.
  * Criação automática do registro na biblioteca e início da leitura com 1 clique.
* **Visualizador Digital Zen Mode (`/reading/[id]/read`):**
  * **Modo Imersivo:** Topbar retrátil que se recolhe durante a leitura e reaparece ao passar o mouse ou tocar no topo.
  * **Painel de Tipografia `[Aa]`:** 4 paletas de cores (Claro, Sépia, Escuro e OLED/Preto Absoluto), controle de tamanho de fonte (`A-` e `A+`), famílias tipográficas (Serifada, Sem Serifa e Monospaçada) e espaçamento entre linhas.
  * **Navegação & Sumário:** Índice interativo de capítulos com salto direto e indicador de página atual / total.
  * **Atalhos Rápidos de Teclado:** Setas direcionais / Barra de espaço (virar página), `F` (tela cheia), `T` (alternar temas) e `Esc` (mostrar/ocultar barras).
* **Persistência Resiliente Multi-Camada:**
  1. *Supabase Storage:* Gravação na nuvem no bucket `ebooks`.
  2. *Sistema de Arquivos Local:* Fallback automático em disco (`public/uploads/ebooks/`).
  3. *IndexedDB do Navegador:* Armazenamento do arquivo no cliente via `ebookStorage.ts`, garantindo que a leitura funcione mesmo se o ambiente serverless for somente leitura (sem erros 500).
* **Aba "Todos os Livros / Estante Geral":**
  * Busca inteligente por ISBN integrada à Open Library e Google Books, importando capa em alta resolução, sinopse, autores e número de páginas.
  * Controle de leitura para livros físicos e digitais com botões de progresso rápido (+1 pág, +5 págs, etc.).

---

### 3. 📅 Calendário Mensal Integrado (`/calendar`)
* Visualização completa do mês com navegação fluida entre períodos.
* Cruzamento simultâneo entre **tarefas agendadas** e **contas a pagar/receber** na mesma data.
* Indicadores visuais de status, prioridade e valores financeiros do dia.

---

### 4. 💼 Projetos & Metas (`/projects`)
* Organização de iniciativas com paleta de cores customizável e prazos finais.
* **Progresso Automático em Tempo Real:** A porcentagem de conclusão do projeto é calculada automaticamente conforme as tarefas vinculadas são finalizadas.
* Central de anotações, links e documentações do projeto.

---

### 5. 🎓 Estudos & Acompanhamento Acadêmico (`/studies`)
* Gestão de graduações, cursos livres, especializações e certificações.
* Monitoramento de módulos concluídos versus módulos totais com barra percentual.
* Vinculação de tarefas de estudo e links diretos para plataformas EAD.

---

### 6. 💳 Controle Financeiro Pessoal (`/finance`)
* Registro detalhado de contas a pagar (despesas) e a receber (receitas).
* Painel de controle financeiro com cálculos automáticos: **Saldo Previsto**, **Total Quitado** e **Total Pendente**.
* Suporte a despesas recorrentes mensais, favorecidos e anexação de comprovantes de pagamento.

---

### 7. 🤖 Assistente de IA Híbrido & Function Calling (`/chat`)
* **Provedores Suportados:**
  * **Google Gemini API:** Utilizando modelos de alta velocidade (*Flash*).
  * **Groq Cloud:** Inferência de altíssimo desempenho com **LLaMA 3.3 70B Versatile**.
  * **Motor NLP Local:** Parser determinístico em português para contingência offline.
* **Ações Executáveis por Linguagem Natural (*Function Calling*):**
  * Criação e agendamento de tarefas com categorização inteligente.
  * Lançamento de contas e despesas no financeiro.
  * Atualização de progresso de leitura em livros da biblioteca.
  * Criação e estruturação de novos projetos.
* **Cartões de Confirmação Interativos:** Nenhuma ação modifica o banco de dados sem a prévia revisão e autorização explícita do usuário em tela (com opção de auto-confirmação configurável).

---

### 8. 👥 Painel Administrativo & Gestão de Usuários (`/admin/users`)
* Controle de acesso baseado em papéis (**RBAC**): `ADMIN` e `USER`.
* Criação de novos usuários com definição de perfis e senhas iniciais.
* Edição cadastral, redefinição de senhas e exclusão de contas.
* Proteção estrita por middleware e verificação de privilégios em todas as rotas da API.

---

### 9. 🔍 Produtividade, Busca & Notificações
* **Busca Global Instantânea (`Ctrl + K` / `Cmd + K`):** Localizador universal que varre tarefas, livros, cursos, categorias, projetos e finanças em milissegundos.
* **Atalho Rápido `N`:** Abre o modal de criação de tarefas a partir de qualquer página.
* **Notificações Web & PWA:** Suporte nativo à *Web Notifications API* e *Service Worker* (`notifications.ts`) para lembretes de tarefas e prazos no Desktop e Android.

---

## 🛠️ Stack Tecnológica

| Camada | Ferramenta / Biblioteca | Finalidade |
| :--- | :--- | :--- |
| **Framework Fullstack** | Next.js 16 (App Router, Turbopack) | Renderização híbrida, rotas de API e otimização de borda |
| **Interface do Usuário** | React 18, Geist Sans/Mono, Lucide Icons | Componentes declarativos e iconografia moderna |
| **Estilização & Design** | Tailwind CSS 3.4, Efeitos Glow & Glassmorphism | Design responsivo com estética Dark Space |
| **Leitor de Documentos** | `react-pdf` (PDF.js) e `epubjs` | Renderização nativa de livros em formato PDF e EPUB |
| **Armazenamento Offline** | IndexedDB via API nativa | Persistência resiliente de eBooks no cliente |
| **Banco de Dados** | Supabase (PostgreSQL 15+) | Banco relacional com políticas RLS |
| **Camada de Dados** | `@supabase/supabase-js` (REST HTTPS) | Driver de comunicação sem dependência de conexões pooler |
| **Inteligência Artificial** | `@google/generative-ai`, `groq-sdk`, NLP local | Processamento de linguagem natural e automação |
| **Autenticação** | PBKDF2 (100k rounds SHA-512) + HMAC-SHA256 JWT | Criptografia de senhas e tokens de sessão seguros |
| **Deploy & Infraestrutura** | Cloudflare Workers (OpenNext) / Vercel | Hospedagem de alta performance e baixa latência |

---

## ⚡ Guia de Início Rápido

### Pré-requisitos
* **Node.js:** Versão `>= 20.9.0` (recomendado Node 22+)
* **NPM** ou gerenciador de pacotes equivalente
* Uma conta ativa no [Supabase](https://supabase.com) (nível gratuito é suficiente)

---

### 1. Clonar o Repositório e Instalar Dependências

```bash
# Clone o repositório
git clone https://github.com/LipehSanttos/life-os-test.git life-os
cd life-os

# Instale as dependências
npm install
```

---

### 2. Configurar o Banco de Dados (Supabase)

1. Acesse o painel do [Supabase](https://supabase.com/dashboard) e crie um novo projeto.
2. No menu lateral, acesse o **SQL Editor**.
3. Execute o script principal contido em [`supabase/schema.sql`](./supabase/schema.sql).
   > Esse script cria todas as tabelas (`users`, `tasks`, `projects`, `courses`, `books`, `financial_reminders`, `categories`), índices, relacionamentos e regras de RLS.
4. Em seguida, execute a migração de suporte ao leitor digital contida em [`supabase/migrations/20260915_add_ebook_reader_fields.sql`](./supabase/migrations/20260915_add_ebook_reader_fields.sql).
5. *(Opcional)* Crie um bucket público chamado `ebooks` em **Storage** caso deseje armazenamento em nuvem para arquivos de leitura.

---

### 3. Configurar as Variáveis de Ambiente

Copie o modelo de variáveis de ambiente:

```bash
cp .env.example .env
```

Edite o arquivo `.env` com as configurações do seu projeto:

```env
# Conexão com o Supabase (Painel > Project Settings > API)
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon-publica
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role-privada

# Segredo para assinatura de tokens de sessão (gerar string aleatória com +32 caracteres)
AUTH_SECRET=sua-chave-secreta-aleatoria-super-segura

# Chaves de Provedores de IA (Opcionais - podem ser inseridas depois em Configurações)
GEMINI_API_KEY=
GROQ_API_KEY=
```

> **Dica para o AUTH_SECRET:** Gere uma chave aleatória e segura executando no terminal:
> ```bash
> node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
> ```

---

### 4. Criar o Primeiro Usuário Administrador

1. No painel do Supabase, vá em **Authentication** > **Users** > **Add User** > **Create User**.
2. Cadastre seu e-mail e senha, marcando a opção **Auto Confirm User**.
3. No **Table Editor**, localize a tabela `users` e certifique-se de que o campo `role` do seu usuário esteja definido como `ADMIN`.
4. Inicie o ambiente de desenvolvimento:
   ```bash
   npm run dev
   ```
5. Acesse no navegador: [http://localhost:3000/login](http://localhost:3000/login).

---

## 📜 Scripts Disponíveis

| Comando | Descrição |
| :--- | :--- |
| `npm run dev` | Inicia o servidor de desenvolvimento local na porta 3000 |
| `npm run build` | Compila o projeto com validação estrita de tipos TypeScript |
| `npm run start` | Inicia o servidor com o build de produção local |
| `npm run lint` | Executa a verificação de código e padronização com ESLint |
| `npm run build:worker` | Gera o pacote otimizado para o Cloudflare Workers via OpenNext |
| `npm run preview` | Executa a simulação local idêntica ao ambiente da Cloudflare |
| `npm run deploy` | Realiza o deploy automático para a Cloudflare via Wrangler |

---

## 🔒 Arquitetura & Segurança

O **Life OS** foi desenvolvido seguindo boas práticas de isolamento e proteção de dados:

1. **Row Level Security (RLS) no PostgreSQL:** Mesmo que uma requisição contorne a camada da aplicação, as políticas RLS garantem que um usuário só possa ler ou modificar registros associados ao seu próprio `userId`.
2. **Criptografia de Senhas (PBKDF2):** As credenciais de acesso são protegidas usando `crypto.pbkdf2` com algoritmo SHA-512, sal aleatório de 32 bytes e 100.000 iterações, prevenindo ataques de dicionário e tabelas rainbow.
3. **Sessões Autenticadas e Protegidas:** Tokens JWT assinados com HMAC-SHA256 trafegam exclusivamente via cookies `HttpOnly`, inacessíveis por scripts maliciosos de terceiros no navegador (mitigação contra XSS).
4. **Proteção contra IDOR e Injeções:** Todos os endpoints validam a sessão ativa contra o proprietário do registro antes de qualquer mutação.
5. **Mitigação de Força Bruta:** Rate limiting integrado em memória no endpoint de autenticação para mitigar tentativas repetitivas de adivinhação de senhas.

---

## 🌐 Deploy em Produção

### Opção 1: Cloudflare Pages / Workers (OpenNext)
O repositório já inclui [`open-next.config.ts`](./open-next.config.ts) e [`wrangler.jsonc`](./wrangler.jsonc) pré-configurados:

```bash
# Faça login na sua conta Cloudflare
npx wrangler login

# Compile os workers e execute o deploy
npm run deploy
```

> **Atenção:** Cadastre as mesmas variáveis de ambiente (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` e `AUTH_SECRET`) no painel da Cloudflare em **Settings > Variables and Secrets**.

### Opção 2: Vercel
1. Conecte o repositório na [Vercel](https://vercel.com).
2. Adicione as variáveis de ambiente necessárias no painel do projeto.
3. O build (`npm run build`) será executado automaticamente a cada novo commit na branch `main`.

---

## 📁 Estrutura de Diretórios

```text
life-os/
├── public/                     # Imagens, ícones, fontes e assets estáticos
├── src/
│   ├── app/                    # Rotas da aplicação (App Router Next.js 16)
│   │   ├── admin/              # Painel administrativo de usuários
│   │   ├── api/                # Endpoints REST (auth, tasks, reading, finance, chat, etc.)
│   │   ├── calendar/           # Visualização mensal integrada
│   │   ├── categories/         # Gerenciamento de categorias
│   │   ├── chat/               # Assistente de IA com confirmação interativa
│   │   ├── dashboard/          # Painel principal e métricas
│   │   ├── finance/            # Gestão financeira de receitas e despesas
│   │   ├── inbox/              # Caixa de captura rápida de tarefas
│   │   ├── login/              # Tela de autenticação com segurança reforçada
│   │   ├── projects/           # Projetos e metas com progresso dinâmico
│   │   ├── reading/            # Biblioteca e leitor de eBooks (PDF/EPUB)
│   │   ├── settings/           # Configurações de perfil e chaves de IA
│   │   ├── studies/            # Acompanhamento acadêmico e cursos
│   │   ├── today/              # Visão do dia atual com GTD
│   │   └── upcoming/           # Planejamento futuro (3, 7 e 30 dias)
│   ├── components/             # Componentes React modulares
│   │   ├── chat/               # Interface de chat e cartões de confirmação
│   │   ├── dashboard/          # Saudações dinâmicas e cards de métricas
│   │   ├── finance/            # Modais e tabelas de lançamentos
│   │   ├── layout/             # AppShell, Sidebar, Topbar e FAB mobile
│   │   ├── projects/           # Modais e cartões de projetos
│   │   ├── providers/          # Tema, notificações e toasts
│   │   ├── reading/            # Leitores de PDF e EPUB com modo zen
│   │   ├── search/             # Modal de busca global (Ctrl + K)
│   │   ├── studies/            # Modais de cursos acadêmicos
│   │   └── tasks/              # Modais, formulários e listas de tarefas
│   ├── lib/                    # Camada de serviços, banco e utilitários
│   │   ├── ai/                 # Gemini, Groq, NLP local e Function Calling
│   │   ├── supabase/           # Clientes admin e público do Supabase
│   │   ├── auth.ts             # Lógica de senhas PBKDF2 e tokens de sessão
│   │   ├── db.ts               # Driver direto HTTPS REST do Supabase
│   │   ├── ebookStorage.ts     # Fallback resiliente no IndexedDB do navegador
│   │   ├── googleCalendar.ts   # Utilitário de links padrão RFC 5545
│   │   ├── notifications.ts    # Web Notifications e Service Worker
│   │   └── utils.ts            # Formatação de datas, moedas e estilos
│   └── types/                  # Interfaces e tipos TypeScript de todo o domínio
├── supabase/                   # Scripts SQL, esquemas e migrações
│   ├── migrations/             # Migrações incrementais do banco de dados
│   └── schema.sql              # Esquema relacional completo do PostgreSQL
├── open-next.config.ts         # Configuração de build para Cloudflare Workers
├── wrangler.jsonc              # Definição de recursos para deploy na Cloudflare
└── package.json                # Dependências e scripts do projeto
```

---

## 📄 Licença

Este projeto é distribuído sob a licença [MIT](./LICENSE). Você é livre para utilizar, estudar, modificar e distribuir o código conforme necessário.

<div align="center">
  <sub>Desenvolvido com foco em excelência, estabilidade e máxima produtividade.</sub>
</div>

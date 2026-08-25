# Controle de Insumos

App de controle de estoque de insumos pra restaurantes/lojas com operação de
delivery. Next.js (App Router) + Postgres no Railway + Auth.js (Google) —
mesmo esquema de infra do [DeliHub](../DeliHub).

## Stack

- **Next.js 16** (App Router, Server Actions)
- **Postgres no Railway** + **Prisma** (mesma dupla ORM/migração do DeliHub)
- **Auth.js (NextAuth v5)** com provider Google, sessão em JWT, adapter
  Prisma pra persistir usuários
- **Sem storage externo**: logo do estabelecimento e foto de insumo ficam
  direto no Postgres (colunas `bytea`), servidas por rotas de API própria.
  Antes de subir, a imagem é redimensionada/comprimida no browser
  (`lib/image/resizeImage.ts`, via `<canvas>`, máx. 800px / qualidade
  ~0.7), então o volume no banco fica pequeno — mas vale ter em mente que
  isso soma ao tamanho do banco (e aos backups dele), diferente de um
  bucket de storage separado. Se o app crescer muito em volume de fotos,
  vale reconsiderar.
- Sem RLS (Postgres puro, não é Supabase): toda checagem de "isso é seu?"
  é feita nas Server Actions (`lib/auth/estabelecimento.ts`), sempre
  resolvendo o `estabelecimento_id` a partir da sessão antes de qualquer
  query — nunca aceitando um id vindo do client sem validar antes.

## Setup

1. **Banco**: crie um addon Postgres no Railway, pegue a `DATABASE_URL`
   (Connect → Postgres Connection URL) e aplique as migrations:

   ```bash
   npx prisma migrate deploy
   ```

   (`prisma/migrations/` já vem com o schema pronto — não precisa rodar
   `prisma migrate dev` pra gerar nada, só aplicar.)

2. **Auth Google**: crie um OAuth Client (tipo "Web application") no
   [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
   Authorized redirect URI:
   - dev: `http://localhost:3000/api/auth/callback/google`
   - produção: `https://SEU_DOMINIO/api/auth/callback/google`

   Gere o `AUTH_SECRET` com `npx auth secret` (ou `openssl rand -base64 32`).

3. **Variáveis de ambiente**: copie `.env.local.example` pra `.env.local`
   e preencha `DATABASE_URL`, `AUTH_SECRET`, `AUTH_GOOGLE_ID`,
   `AUTH_GOOGLE_SECRET`.

4. **Instale e rode**:

   ```bash
   npm install
   npm run dev
   ```

   App em `http://localhost:3000`.

   Os scripts `prisma:migrate`/`prisma:deploy`/`prisma:studio` já carregam
   `.env.local` via `dotenv-cli` (o Prisma CLI sozinho só lê `.env`).

## Deploy (Railway)

Mesmo esquema do DeliHub: conecta o repo no Railway, ele builda com
`npm run build` (o `postinstall` já roda `prisma generate`) e sobe com
`npm start`. Antes do primeiro deploy rodar sem erro, aplica a migration
uma vez com `npx prisma migrate deploy` (pode rodar via `railway run` ou
como parte do start command, ex: `prisma migrate deploy && next start`).

## Fluxo

1. Login com Google (`/login`).
2. Primeiro acesso → `/onboarding`: nome do estabelecimento + logo. No
   browser, a imagem é redimensionada/comprimida
   (`lib/image/resizeImage.ts`) e, a partir dela, a cor primária/secundária
   é extraída (`lib/theme/extractPalette.ts`, também via `<canvas>`, sem
   serviço externo). Tudo — nome, cores e os bytes do logo — vai numa
   Server Action que grava direto no Postgres.
3. `/insumos`: tela principal de controle de estoque, com o tema (cores)
   do estabelecimento já aplicado. As fotos de logo/insumo aparecem via
   `/api/estabelecimentos/[id]/logo` e `/api/insumos/[id]/foto`, que leem
   o `bytea` do banco e devolvem a imagem com `Content-Type`/cache certos.

## Estrutura

- `app/` — rotas (App Router): login, onboarding e a área logada
  `(app)/insumos`. `app/api/auth/[...nextauth]/route.ts` é o endpoint do
  Auth.js; `app/api/estabelecimentos/[id]/logo` e `app/api/insumos/[id]/foto`
  servem as imagens guardadas no Postgres.
- `components/` — UI, separada por domínio (`insumos/`, `onboarding/`).
- `lib/prisma.ts` — client Prisma (singleton).
- `lib/auth/estabelecimento.ts` — resolve o `estabelecimento_id` do
  usuário logado; é aqui que mora a checagem de posse que substitui a RLS.
- `lib/image/resizeImage.ts` — redimensiona/comprime imagem no browser
  antes do upload.
- `lib/theme/` — extração de paleta do logo e aplicação como CSS vars.
- `auth.ts` / `auth.config.ts` — config do Auth.js (separada em duas
  porque o Proxy roda num runtime mais restrito e não pode importar o
  Prisma Client).
- `proxy.ts` — Proxy (era `middleware.ts` até o Next 15) que redireciona
  pra `/login` quem não tem sessão.
- `prisma/schema.prisma` + `prisma/migrations/` — schema e migrations.

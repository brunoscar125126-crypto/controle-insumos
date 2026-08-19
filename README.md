# Controle de Insumos

App de controle de estoque de insumos pra restaurantes/lojas com operação de
delivery. Next.js (App Router) + Postgres no Railway + Auth.js (Google) +
Cloudflare R2 — mesmo esquema de infra do [DeliHub](../DeliHub).

## Stack

- **Next.js 16** (App Router, Server Actions)
- **Postgres no Railway** + **Prisma** (mesma dupla ORM/migração do DeliHub)
- **Auth.js (NextAuth v5)** com provider Google, sessão em JWT, adapter
  Prisma pra persistir usuários
- **Cloudflare R2** (S3-compatible) pra logo e fotos de insumo
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

   (`prisma/migrations/` já vem com o schema inicial pronto — não precisa
   rodar `prisma migrate dev` pra gerar nada, só aplicar.)

2. **Auth Google**: crie um OAuth Client (tipo "Web application") no
   [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
   Authorized redirect URI:
   - dev: `http://localhost:3000/api/auth/callback/google`
   - produção: `https://SEU_DOMINIO/api/auth/callback/google`

   Gere o `AUTH_SECRET` com `npx auth secret` (ou `openssl rand -base64 32`).

3. **Cloudflare R2**: crie um bucket (`establishment-assets`), ative a
   "Public Development URL" dele (Settings → Public Access) e crie um API
   Token (R2 → Manage API Tokens) com permissão de leitura/escrita nesse
   bucket.

4. **Variáveis de ambiente**: copie `.env.local.example` pra `.env.local`
   e preencha tudo (`DATABASE_URL`, `AUTH_SECRET`, `AUTH_GOOGLE_ID`,
   `AUTH_GOOGLE_SECRET`, `R2_*`).

5. **Instale e rode**:

   ```bash
   npm install
   npm run dev
   ```

   App em `http://localhost:3000`.

## Deploy (Railway)

Mesmo esquema do DeliHub: conecta o repo no Railway, ele builda com
`npm run build` (o `postinstall` já roda `prisma generate`) e sobe com
`npm start`. Antes do primeiro deploy rodar sem erro, aplica a migration
uma vez com `npx prisma migrate deploy` (pode rodar via `railway run` ou
como parte do start command, ex: `prisma migrate deploy && next start`).

## Fluxo

1. Login com Google (`/login`).
2. Primeiro acesso → `/onboarding`: nome do estabelecimento + logo. A cor
   primária/secundária é extraída do logo no browser
   (`lib/theme/extractPalette.ts`, via `<canvas>`, sem serviço externo) e
   enviada junto com o arquivo pra uma Server Action, que sobe o logo pro
   R2 e salva tudo no Postgres.
3. `/insumos`: tela principal de controle de estoque, com o tema (cores)
   do estabelecimento já aplicado.

## Estrutura

- `app/` — rotas (App Router): login, onboarding e a área logada
  `(app)/insumos`. `app/api/auth/[...nextauth]/route.ts` é o endpoint do
  Auth.js.
- `components/` — UI, separada por domínio (`insumos/`, `onboarding/`).
- `lib/prisma.ts` — client Prisma (singleton).
- `lib/auth/estabelecimento.ts` — resolve o `estabelecimento_id` do
  usuário logado; é aqui que mora a checagem de posse que substitui a RLS.
- `lib/storage/r2.ts` — upload/remoção de arquivos no R2.
- `lib/theme/` — extração de paleta do logo e aplicação como CSS vars.
- `auth.ts` / `auth.config.ts` — config do Auth.js (separada em duas
  porque o Proxy roda num runtime mais restrito e não pode importar o
  Prisma Client).
- `proxy.ts` — Proxy (era `middleware.ts` até o Next 15) que redireciona
  pra `/login` quem não tem sessão.
- `prisma/schema.prisma` + `prisma/migrations/` — schema e migrations.

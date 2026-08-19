-- ================================================================
-- Controle de Insumos — migração inicial (Railway Postgres)
-- Equivalente ao schema original de quando o projeto rodava no Supabase,
-- sem RLS (a checagem de "só vê os próprios dados" agora vive nas Server
-- Actions, sempre filtrando por estabelecimento_id da sessão).
-- ================================================================

-- ------------------------------------------------------------
-- Tabelas do Auth.js (@auth/prisma-adapter)
-- ------------------------------------------------------------
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "email_verified" TIMESTAMP(3),
    "image" TEXT,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_account_id" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "accounts_provider_provider_account_id_key" ON "accounts"("provider", "provider_account_id");

CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "session_token" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "sessions_session_token_key" ON "sessions"("session_token");

CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");

CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");

ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ------------------------------------------------------------
-- Domínio: estabelecimentos / categorias / insumos
-- ------------------------------------------------------------
CREATE TABLE "estabelecimentos" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "logo_url" TEXT,
    "cor_primaria" TEXT,
    "cor_secundaria" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "estabelecimentos_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "estabelecimentos_user_id_key" ON "estabelecimentos"("user_id");

CREATE TABLE "categorias" (
    "id" TEXT NOT NULL,
    "estabelecimento_id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "categorias_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "categorias_estabelecimento_id_nome_key" ON "categorias"("estabelecimento_id", "nome");

CREATE TABLE "insumos" (
    "id" TEXT NOT NULL,
    "estabelecimento_id" TEXT NOT NULL,
    "categoria_id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "quantidade" DECIMAL(12,3) NOT NULL DEFAULT 0,
    "unidade" TEXT NOT NULL,
    "foto_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "insumos_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "insumos_estabelecimento_id_idx" ON "insumos"("estabelecimento_id");

CREATE INDEX "insumos_categoria_id_idx" ON "insumos"("categoria_id");

ALTER TABLE "estabelecimentos" ADD CONSTRAINT "estabelecimentos_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "categorias" ADD CONSTRAINT "categorias_estabelecimento_id_fkey"
    FOREIGN KEY ("estabelecimento_id") REFERENCES "estabelecimentos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "insumos" ADD CONSTRAINT "insumos_estabelecimento_id_fkey"
    FOREIGN KEY ("estabelecimento_id") REFERENCES "estabelecimentos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "insumos" ADD CONSTRAINT "insumos_categoria_id_fkey"
    FOREIGN KEY ("categoria_id") REFERENCES "categorias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ------------------------------------------------------------
-- Constraints que o schema.prisma não expressa declarativamente
-- (Prisma não gerencia CHECK constraints; ficam só na migração —
-- rodar `prisma migrate dev` de novo no futuro não vai tentar
-- removê-las, só não vai "conhecer" essas regras no schema).
-- ------------------------------------------------------------
ALTER TABLE "insumos" ADD CONSTRAINT "insumos_quantidade_check"
    CHECK ("quantidade" >= 0);

ALTER TABLE "insumos" ADD CONSTRAINT "insumos_unidade_check"
    CHECK ("unidade" IN ('un','kg','g','l','ml','pacote','caixa'));

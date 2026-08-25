-- ================================================================
-- Troca storage externo (R2) por bytea direto no Postgres pra fotos de
-- insumo e logo de estabelecimento. As tabelas ainda não tinham dados
-- reais (onboarding nunca foi concluído com o R2), então é seguro só
-- trocar as colunas em vez de migrar dados existentes.
-- ================================================================

ALTER TABLE "estabelecimentos" DROP COLUMN "logo_url";
ALTER TABLE "estabelecimentos" ADD COLUMN "logo" BYTEA;
ALTER TABLE "estabelecimentos" ADD COLUMN "logo_content_type" TEXT;

ALTER TABLE "insumos" DROP COLUMN "foto_url";
ALTER TABLE "insumos" ADD COLUMN "foto" BYTEA;
ALTER TABLE "insumos" ADD COLUMN "foto_content_type" TEXT;

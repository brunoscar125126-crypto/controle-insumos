-- ================================================================
-- Ordem manual dos insumos (drag-and-drop) + listas de compras.
-- ================================================================

-- ------------------------------------------------------------
-- Insumo.ordem — backfill com a ordem atual de exibição
-- (created_at desc, por estabelecimento) pra não bagunçar a lista de
-- quem já tem insumos cadastrados.
-- ------------------------------------------------------------
ALTER TABLE "insumos" ADD COLUMN "ordem" INTEGER NOT NULL DEFAULT 0;

WITH numerados AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY estabelecimento_id ORDER BY created_at DESC) AS rn
  FROM "insumos"
)
UPDATE "insumos"
SET "ordem" = numerados.rn
FROM numerados
WHERE "insumos".id = numerados.id;

-- ------------------------------------------------------------
-- Listas de compras
-- ------------------------------------------------------------
CREATE TABLE "listas_compras" (
    "id" TEXT NOT NULL,
    "estabelecimento_id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "data" DATE NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "listas_compras_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "listas_compras_estabelecimento_id_idx" ON "listas_compras"("estabelecimento_id");

CREATE TABLE "lista_compras_itens" (
    "id" TEXT NOT NULL,
    "lista_compras_id" TEXT NOT NULL,
    "insumo_id" TEXT NOT NULL,
    "quantidade" DECIMAL(12,3) NOT NULL,

    CONSTRAINT "lista_compras_itens_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "lista_compras_itens_lista_compras_id_insumo_id_key" ON "lista_compras_itens"("lista_compras_id", "insumo_id");

CREATE INDEX "lista_compras_itens_lista_compras_id_idx" ON "lista_compras_itens"("lista_compras_id");

ALTER TABLE "listas_compras" ADD CONSTRAINT "listas_compras_estabelecimento_id_fkey"
    FOREIGN KEY ("estabelecimento_id") REFERENCES "estabelecimentos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "lista_compras_itens" ADD CONSTRAINT "lista_compras_itens_lista_compras_id_fkey"
    FOREIGN KEY ("lista_compras_id") REFERENCES "listas_compras"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "lista_compras_itens" ADD CONSTRAINT "lista_compras_itens_insumo_id_fkey"
    FOREIGN KEY ("insumo_id") REFERENCES "insumos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "lista_compras_itens" ADD CONSTRAINT "lista_compras_itens_quantidade_check"
    CHECK ("quantidade" > 0);

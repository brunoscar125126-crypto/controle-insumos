"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { subirArquivo, removerArquivo, caminhoDaUrl } from "@/lib/storage/r2";
import { getEstabelecimentoIdOuFalha } from "@/lib/auth/estabelecimento";
import type { Unidade } from "@/lib/types";

/**
 * Resolve a categoria a partir do id (validando que pertence a esse
 * estabelecimento — nunca confia num categoriaId vindo do client sem
 * checar) ou cria uma nova (find-or-create pelo nome).
 */
async function resolverCategoria(
  estabelecimentoId: string,
  categoriaId: string | null,
  novaCategoriaNome: string | null
) {
  if (categoriaId) {
    const categoria = await prisma.categoria.findFirst({
      where: { id: categoriaId, estabelecimentoId },
      select: { id: true },
    });
    if (!categoria) throw new Error("Categoria inválida.");
    return categoria.id;
  }

  const nome = (novaCategoriaNome ?? "").trim();
  if (!nome) throw new Error("Escolha ou crie uma categoria.");

  const categoria = await prisma.categoria.upsert({
    where: { estabelecimentoId_nome: { estabelecimentoId, nome } },
    update: {},
    create: { estabelecimentoId, nome },
    select: { id: true },
  });
  return categoria.id;
}

export async function criarInsumo(formData: FormData) {
  const estabelecimentoId = await getEstabelecimentoIdOuFalha();

  const nome = String(formData.get("nome") ?? "").trim();
  const quantidade = Number(formData.get("quantidade"));
  const unidade = String(formData.get("unidade") ?? "") as Unidade;
  const categoriaId = (formData.get("categoriaId") as string) || null;
  const novaCategoriaNome = (formData.get("novaCategoriaNome") as string) || null;
  const foto = formData.get("foto") as File | null;

  if (!nome) throw new Error("Digite o nome do insumo.");
  if (Number.isNaN(quantidade) || quantidade < 0) throw new Error("Informe uma quantidade válida.");

  const categoriaIdFinal = await resolverCategoria(estabelecimentoId, categoriaId, novaCategoriaNome);

  let fotoUrl: string | null = null;
  if (foto && foto.size > 0) {
    const extensao = foto.name.split(".").pop() || "jpg";
    const caminho = `insumos/${estabelecimentoId}/${randomUUID()}.${extensao}`;
    fotoUrl = await subirArquivo(caminho, foto);
  }

  await prisma.insumo.create({
    data: {
      estabelecimentoId,
      categoriaId: categoriaIdFinal,
      nome,
      quantidade,
      unidade,
      fotoUrl,
    },
  });

  revalidatePath("/insumos");
}

export async function alterarQuantidade(insumoId: string, delta: number) {
  const estabelecimentoId = await getEstabelecimentoIdOuFalha();

  // Update atômico (GREATEST evita corrida deixando a quantidade negativa)
  // e a condição estabelecimento_id = ... é a checagem de posse que antes
  // era feita pela RLS — se não bater, 0 linhas são afetadas.
  const resultado = await prisma.$queryRaw<{ id: string }[]>(Prisma.sql`
    UPDATE insumos
    SET quantidade = GREATEST(0, quantidade + ${delta}), updated_at = now()
    WHERE id = ${insumoId} AND estabelecimento_id = ${estabelecimentoId}
    RETURNING id
  `);
  if (resultado.length === 0) throw new Error("Insumo não encontrado.");

  revalidatePath("/insumos");
}

export async function removerInsumo(insumoId: string) {
  const estabelecimentoId = await getEstabelecimentoIdOuFalha();

  const insumo = await prisma.insumo.findFirst({
    where: { id: insumoId, estabelecimentoId },
    select: { id: true, fotoUrl: true },
  });
  if (!insumo) throw new Error("Insumo não encontrado.");

  await prisma.insumo.delete({ where: { id: insumo.id } });

  if (insumo.fotoUrl) {
    // best-effort: se a foto não sumir do R2, não é motivo pra falhar a exclusão
    await removerArquivo(caminhoDaUrl(insumo.fotoUrl)).catch(() => {});
  }

  revalidatePath("/insumos");
}

"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
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

  // O client já manda a foto redimensionada/comprimida (lib/image/resizeImage.ts).
  let fotoBuffer: Buffer | null = null;
  let fotoContentType: string | null = null;
  if (foto && foto.size > 0) {
    fotoBuffer = Buffer.from(await foto.arrayBuffer());
    fotoContentType = foto.type || "image/jpeg";
  }

  await prisma.insumo.create({
    data: {
      estabelecimentoId,
      categoriaId: categoriaIdFinal,
      nome,
      quantidade,
      unidade,
      foto: fotoBuffer,
      fotoContentType,
    },
  });

  revalidatePath("/insumos");
}

export async function atualizarInsumo(insumoId: string, formData: FormData) {
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

  // "Unchecked" pq estamos setando categoriaId como escalar direto (é
  // assim que o resto do arquivo já trabalha), não via relation connect.
  const data: Prisma.InsumoUncheckedUpdateManyInput = {
    nome,
    quantidade,
    unidade,
    categoriaId: categoriaIdFinal,
  };

  // Só troca a foto se uma nova foi enviada — sem isso, mantém a atual.
  if (foto && foto.size > 0) {
    data.foto = Buffer.from(await foto.arrayBuffer());
    data.fotoContentType = foto.type || "image/jpeg";
  }

  // updateMany (não update por id) pra embutir a checagem de posse na
  // própria query, igual removerInsumo — nunca mexe num insumo de outro
  // estabelecimento mesmo que o id venha adulterado do client.
  const resultado = await prisma.insumo.updateMany({
    where: { id: insumoId, estabelecimentoId },
    data,
  });
  if (resultado.count === 0) throw new Error("Insumo não encontrado.");

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

  // A foto vive na própria linha (bytea) — apagar o insumo já leva ela
  // junto, sem precisar de uma limpeza separada num storage externo.
  const resultado = await prisma.insumo.deleteMany({
    where: { id: insumoId, estabelecimentoId },
  });
  if (resultado.count === 0) throw new Error("Insumo não encontrado.");

  revalidatePath("/insumos");
}

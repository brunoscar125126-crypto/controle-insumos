"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getEstabelecimentoIdOuFalha } from "@/lib/auth/estabelecimento";
import type { Unidade } from "@/lib/types";

interface ItemBruto {
  insumoId: string;
  quantidade: number;
}

export async function criarListaCompras(formData: FormData) {
  const estabelecimentoId = await getEstabelecimentoIdOuFalha();

  const nome = String(formData.get("nome") ?? "").trim();
  const dataStr = String(formData.get("data") ?? "");
  const itensJson = String(formData.get("itens") ?? "[]");

  if (!nome) throw new Error("Digite um nome pra lista.");
  if (!dataStr) throw new Error("Escolha uma data pra lista.");

  // meio-dia UTC evita a data "voltar" um dia por causa de fuso horário
  const data = new Date(`${dataStr}T12:00:00Z`);
  if (Number.isNaN(data.getTime())) throw new Error("Data inválida.");

  let itensBrutos: ItemBruto[];
  try {
    itensBrutos = JSON.parse(itensJson);
  } catch {
    throw new Error("Itens inválidos.");
  }
  if (!Array.isArray(itensBrutos) || itensBrutos.length === 0) {
    throw new Error("Selecione ao menos um item pra lista.");
  }

  // Só aceita insumo_id que realmente pertence a esse estabelecimento —
  // nunca confia no que vier do client sem checar.
  const insumoIds = itensBrutos.map((i) => i.insumoId);
  const insumosValidos = await prisma.insumo.findMany({
    where: { id: { in: insumoIds }, estabelecimentoId },
    select: { id: true },
  });
  const idsValidos = new Set(insumosValidos.map((i) => i.id));

  const itens = itensBrutos
    .filter((i) => idsValidos.has(i.insumoId) && Number(i.quantidade) > 0)
    .map((i) => ({ insumoId: i.insumoId, quantidade: Number(i.quantidade) }));

  if (itens.length === 0) throw new Error("Selecione ao menos um item válido pra lista.");

  const criada = await prisma.listaCompras.create({
    data: {
      estabelecimentoId,
      nome,
      data,
      itens: { create: itens },
    },
    select: {
      id: true,
      nome: true,
      data: true,
      itens: {
        select: {
          id: true,
          insumoId: true,
          quantidade: true,
          insumo: { select: { nome: true, unidade: true } },
        },
      },
    },
  });

  revalidatePath("/insumos");

  // Devolve a lista já no formato que o client usa — o componente atualiza
  // o state local direto com isso, sem precisar de router.refresh() (que,
  // rodando ao mesmo tempo em que o modal muda de modo "nova" -> "lista",
  // disparava um aviso do React de setState cruzado entre componentes).
  return {
    id: criada.id,
    nome: criada.nome,
    data: criada.data.toISOString().slice(0, 10),
    itens: criada.itens.map((item) => ({
      id: item.id,
      insumoId: item.insumoId,
      insumoNome: item.insumo.nome,
      unidade: item.insumo.unidade as Unidade,
      quantidade: item.quantidade.toNumber(),
    })),
  };
}

export async function removerListaCompras(listaId: string) {
  const estabelecimentoId = await getEstabelecimentoIdOuFalha();

  const resultado = await prisma.listaCompras.deleteMany({
    where: { id: listaId, estabelecimentoId },
  });
  if (resultado.count === 0) throw new Error("Lista não encontrada.");

  revalidatePath("/insumos");
}

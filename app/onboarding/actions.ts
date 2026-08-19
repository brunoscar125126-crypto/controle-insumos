"use server";

import { prisma } from "@/lib/prisma";
import { subirArquivo } from "@/lib/storage/r2";
import { getUserIdOuRedireciona } from "@/lib/auth/estabelecimento";

export async function criarEstabelecimento(formData: FormData) {
  const userId = await getUserIdOuRedireciona();

  const nome = String(formData.get("nome") ?? "").trim();
  const logo = formData.get("logo") as File | null;
  const corPrimaria = (formData.get("corPrimaria") as string) || null;
  const corSecundaria = (formData.get("corSecundaria") as string) || null;

  if (!nome) throw new Error("Digite o nome do estabelecimento.");
  if (!logo || logo.size === 0) throw new Error("Envie o logo do estabelecimento.");

  // Cria o estabelecimento + categoria padrão "Outros" numa transação —
  // isso substitui o trigger `criar_categoria_padrao` que existia no
  // Postgres do Supabase.
  const estabelecimento = await prisma.$transaction(async (tx) => {
    const criado = await tx.estabelecimento.create({
      data: { userId, nome },
    });
    await tx.categoria.create({
      data: { estabelecimentoId: criado.id, nome: "Outros" },
    });
    return criado;
  });

  try {
    const extensao = logo.name.split(".").pop() || "png";
    const caminho = `logos/${estabelecimento.id}/logo.${extensao}`;
    const logoUrl = await subirArquivo(caminho, logo);

    await prisma.estabelecimento.update({
      where: { id: estabelecimento.id },
      data: { logoUrl, corPrimaria, corSecundaria },
    });
  } catch (e) {
    // Upload do logo falhou: desfaz o estabelecimento (cascade leva a
    // categoria "Outros" junto) pra não deixar um cadastro pela metade.
    await prisma.estabelecimento.delete({ where: { id: estabelecimento.id } });
    throw e;
  }
}

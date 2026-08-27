"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getEstabelecimentoIdOuFalha, getUserIdOuRedireciona } from "@/lib/auth/estabelecimento";

const HEX_REGEX = /^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/;

/** Normaliza pra sempre #rrggbb minúsculo (expande #abc -> #aabbcc). */
function normalizarHex(valor: string): string {
  const v = valor.trim();
  if (!HEX_REGEX.test(v)) throw new Error("Cor inválida. Use um hex tipo #047857.");
  if (v.length === 4) {
    const [, r, g, b] = v;
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  return v.toLowerCase();
}

/** Atualiza manualmente cor_primaria/cor_secundaria do estabelecimento (sobrescreve a paleta extraída do logo no onboarding). */
export async function atualizarCores(formData: FormData) {
  const estabelecimentoId = await getEstabelecimentoIdOuFalha();

  const corPrimaria = normalizarHex(String(formData.get("corPrimaria") ?? ""));
  const corSecundaria = normalizarHex(String(formData.get("corSecundaria") ?? ""));

  await prisma.estabelecimento.update({
    where: { id: estabelecimentoId },
    data: { corPrimaria, corSecundaria },
  });

  revalidatePath("/insumos");
}

/**
 * Exclui uma categoria. A categoria "Outros" nunca pode ser excluída —
 * é o destino padrão pra onde os insumos de qualquer outra categoria
 * excluída são movidos (criada de novo aqui se por acaso não existir
 * mais), então perder ela quebraria essa rede de segurança.
 */
export async function removerCategoria(categoriaId: string) {
  const estabelecimentoId = await getEstabelecimentoIdOuFalha();

  const categoria = await prisma.categoria.findFirst({
    where: { id: categoriaId, estabelecimentoId },
    select: { id: true, nome: true },
  });
  if (!categoria) throw new Error("Categoria não encontrada.");
  if (categoria.nome.trim().toLowerCase() === "outros") {
    throw new Error('A categoria "Outros" não pode ser excluída — é o destino padrão dos insumos.');
  }

  await prisma.$transaction(async (tx) => {
    const totalNaCategoria = await tx.insumo.count({ where: { categoriaId: categoria.id } });

    if (totalNaCategoria > 0) {
      const outros = await tx.categoria.upsert({
        where: { estabelecimentoId_nome: { estabelecimentoId, nome: "Outros" } },
        update: {},
        create: { estabelecimentoId, nome: "Outros" },
        select: { id: true },
      });
      await tx.insumo.updateMany({
        where: { categoriaId: categoria.id },
        data: { categoriaId: outros.id },
      });
    }

    await tx.categoria.delete({ where: { id: categoria.id } });
  });

  revalidatePath("/insumos");
}

/**
 * Define/troca a senha da conta JÁ LOGADA — é assim (e só assim) que uma
 * conta criada via Google passa a aceitar login por e-mail/senha também.
 * Não existe um "vincular pelo e-mail" sem estar logado: isso seria dar
 * pra qualquer um a chance de sequestrar a conta (e a loja) de outra
 * pessoa só sabendo o e-mail dela. Aqui a sessão já prova quem é o dono.
 */
export async function definirSenha(formData: FormData) {
  const userId = await getUserIdOuRedireciona();

  const senha = String(formData.get("senha") ?? "");
  if (senha.length < 8) throw new Error("A senha precisa ter pelo menos 8 caracteres.");

  const hash = await bcrypt.hash(senha, 10);
  await prisma.user.update({ where: { id: userId }, data: { password: hash } });

  revalidatePath("/insumos");
}

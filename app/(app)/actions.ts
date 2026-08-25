"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getEstabelecimentoIdOuFalha } from "@/lib/auth/estabelecimento";

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

"use server";

import { prisma } from "@/lib/prisma";
import { getUserIdOuRedireciona } from "@/lib/auth/estabelecimento";

export async function criarEstabelecimento(formData: FormData) {
  const userId = await getUserIdOuRedireciona();

  const nome = String(formData.get("nome") ?? "").trim();
  const logo = formData.get("logo") as File | null;
  const corPrimaria = (formData.get("corPrimaria") as string) || null;
  const corSecundaria = (formData.get("corSecundaria") as string) || null;

  if (!nome) throw new Error("Digite o nome do estabelecimento.");
  if (!logo || logo.size === 0) throw new Error("Envie o logo do estabelecimento.");

  // O client já manda a imagem redimensionada/comprimida (lib/image/resizeImage.ts).
  const logoBuffer = Buffer.from(await logo.arrayBuffer());
  const logoContentType = logo.type || "image/jpeg";

  // Cria o estabelecimento + logo + categoria padrão "Outros" numa única
  // transação — sem storage externo, tudo é uma escrita no Postgres, então
  // não precisa mais do try/catch com rollback manual de antes (upload
  // falhando no meio do caminho não existe mais como cenário).
  await prisma.$transaction(async (tx) => {
    const criado = await tx.estabelecimento.create({
      data: { userId, nome, logo: logoBuffer, logoContentType, corPrimaria, corSecundaria },
    });
    await tx.categoria.create({
      data: { estabelecimentoId: criado.id, nome: "Outros" },
    });
  });
}

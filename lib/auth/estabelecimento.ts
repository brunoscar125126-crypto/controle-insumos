import "server-only";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/**
 * Toda checagem de "isso é seu?" que antes era feita pelas policies de RLS
 * do Supabase agora passa por aqui: nunca confiamos num estabelecimentoId
 * vindo do client, sempre resolvemos o dono a partir da sessão primeiro.
 */

export async function getUserIdOuRedireciona(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  return session.user.id;
}

/** Estabelecimento do usuário logado, ou `null` se ainda não passou pelo onboarding. */
export async function getEstabelecimentoAtual() {
  const userId = await getUserIdOuRedireciona();
  return prisma.estabelecimento.findUnique({ where: { userId } });
}

/**
 * Usado nas Server Actions da tela de insumos: garante que existe um
 * estabelecimento pra esse usuário e devolve só o id, já validado contra
 * a sessão (nunca aceito por parâmetro vindo do client).
 */
export async function getEstabelecimentoIdOuFalha(): Promise<string> {
  const userId = await getUserIdOuRedireciona();
  const estabelecimento = await prisma.estabelecimento.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!estabelecimento) throw new Error("Estabelecimento não encontrado.");
  return estabelecimento.id;
}

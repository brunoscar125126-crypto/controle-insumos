import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import TelaControleInsumos from "@/components/insumos/TelaControleInsumos";
import type { Unidade } from "@/lib/types";

export default async function InsumosPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const estabelecimento = await prisma.estabelecimento.findUnique({
    where: { userId: session.user.id },
    select: { id: true, nome: true, logoUrl: true },
  });
  if (!estabelecimento) redirect("/onboarding");

  const [categorias, insumos] = await Promise.all([
    prisma.categoria.findMany({
      where: { estabelecimentoId: estabelecimento.id },
      orderBy: { nome: "asc" },
      select: { id: true, estabelecimentoId: true, nome: true },
    }),
    prisma.insumo.findMany({
      where: { estabelecimentoId: estabelecimento.id },
      orderBy: { createdAt: "desc" },
      include: { categoria: { select: { nome: true } } },
    }),
  ]);

  // Decimal do Prisma não serializa direto pra Client Component — converte pra number aqui.
  const insumosComCategoria = insumos.map((i) => ({
    id: i.id,
    estabelecimentoId: i.estabelecimentoId,
    categoriaId: i.categoriaId,
    nome: i.nome,
    quantidade: i.quantidade.toNumber(),
    unidade: i.unidade as Unidade,
    fotoUrl: i.fotoUrl,
    categoriaNome: i.categoria.nome,
  }));

  return (
    <TelaControleInsumos
      estabelecimento={estabelecimento}
      categoriasIniciais={categorias}
      insumosIniciais={insumosComCategoria}
    />
  );
}

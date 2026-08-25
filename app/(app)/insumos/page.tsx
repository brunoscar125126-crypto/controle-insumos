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
    // Nunca seleciona a coluna `logo` (bytea) aqui — só o content-type,
    // que já basta pra saber se existe logo e montar a URL da rota de imagem.
    select: { id: true, nome: true, logoContentType: true, corPrimaria: true, corSecundaria: true },
  });
  if (!estabelecimento) redirect("/onboarding");

  const [categorias, insumos, listasCompras] = await Promise.all([
    prisma.categoria.findMany({
      where: { estabelecimentoId: estabelecimento.id },
      orderBy: { nome: "asc" },
      select: { id: true, estabelecimentoId: true, nome: true },
    }),
    prisma.insumo.findMany({
      where: { estabelecimentoId: estabelecimento.id },
      orderBy: { ordem: "asc" },
      // Idem: nunca traz a coluna `foto` (bytea) na listagem.
      select: {
        id: true,
        estabelecimentoId: true,
        categoriaId: true,
        nome: true,
        quantidade: true,
        unidade: true,
        fotoContentType: true,
        categoria: { select: { nome: true } },
      },
    }),
    prisma.listaCompras.findMany({
      where: { estabelecimentoId: estabelecimento.id },
      orderBy: { data: "desc" },
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
    fotoUrl: i.fotoContentType ? `/api/insumos/${i.id}/foto` : null,
    categoriaNome: i.categoria.nome,
  }));

  const listasComprasFormatadas = listasCompras.map((l) => ({
    id: l.id,
    nome: l.nome,
    data: l.data.toISOString().slice(0, 10),
    itens: l.itens.map((item) => ({
      id: item.id,
      insumoId: item.insumoId,
      insumoNome: item.insumo.nome,
      unidade: item.insumo.unidade as Unidade,
      quantidade: item.quantidade.toNumber(),
    })),
  }));

  return (
    <TelaControleInsumos
      estabelecimento={{
        id: estabelecimento.id,
        nome: estabelecimento.nome,
        logoUrl: estabelecimento.logoContentType ? `/api/estabelecimentos/${estabelecimento.id}/logo` : null,
        corPrimaria: estabelecimento.corPrimaria,
        corSecundaria: estabelecimento.corSecundaria,
      }}
      categoriasIniciais={categorias}
      insumosIniciais={insumosComCategoria}
      listasComprasIniciais={listasComprasFormatadas}
    />
  );
}

import { prisma } from "@/lib/prisma";

/**
 * Serve o logo do estabelecimento a partir do bytea no Postgres.
 * Sem checagem de sessão de propósito — a foto era pública mesmo quando
 * vivia num bucket R2 público, então manter assim não abre nada de novo.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const estabelecimento = await prisma.estabelecimento.findUnique({
    where: { id },
    select: { logo: true, logoContentType: true },
  });

  if (!estabelecimento?.logo) {
    return new Response("Logo não encontrado.", { status: 404 });
  }

  // Buffer é um Uint8Array de verdade em runtime e o Node aceita ele como
  // corpo da Response sem problema — o erro de tipo é só porque o tipo
  // Buffer<ArrayBufferLike> do @types/node não bate com o BodyInit<ArrayBuffer>
  // mais estrito do lib.dom. Sem risco real, só typing.
  return new Response(estabelecimento.logo as unknown as BodyInit, {
    headers: {
      "Content-Type": estabelecimento.logoContentType ?? "application/octet-stream",
      // Não é imutável: um logo pode em tese ser substituído sem trocar
      // de id/URL, então evita cache agressivo demais.
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}

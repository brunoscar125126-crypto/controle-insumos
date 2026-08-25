import { prisma } from "@/lib/prisma";

/**
 * Serve a foto do insumo a partir do bytea no Postgres.
 * Sem checagem de sessão de propósito — a foto era pública mesmo quando
 * vivia num bucket R2 público, então manter assim não abre nada de novo.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const insumo = await prisma.insumo.findUnique({
    where: { id },
    select: { foto: true, fotoContentType: true },
  });

  if (!insumo?.foto) {
    return new Response("Foto não encontrada.", { status: 404 });
  }

  // Buffer é um Uint8Array de verdade em runtime e o Node aceita ele como
  // corpo da Response sem problema — o erro de tipo é só porque o tipo
  // Buffer<ArrayBufferLike> do @types/node não bate com o BodyInit<ArrayBuffer>
  // mais estrito do lib.dom. Sem risco real, só typing.
  return new Response(insumo.foto as unknown as BodyInit, {
    headers: {
      "Content-Type": insumo.fotoContentType ?? "application/octet-stream",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}

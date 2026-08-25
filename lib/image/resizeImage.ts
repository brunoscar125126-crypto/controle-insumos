interface OpcoesRedimensionamento {
  /** Tamanho máximo do maior lado, em px. Imagens menores não são ampliadas. */
  ladoMaximo?: number;
  /** 0 a 1. */
  qualidade?: number;
  tipo?: "image/jpeg" | "image/webp";
}

/**
 * Redimensiona e comprime uma imagem no browser (via <canvas>) antes de
 * enviar pro servidor — as fotos vão parar direto numa coluna bytea do
 * Postgres, então vale a pena chegar pequenas.
 *
 * Sempre converte pra JPEG (fundo branco atrás de imagens com
 * transparência, tipo logo em PNG, já que JPEG não suporta alpha).
 */
export async function redimensionarImagem(
  arquivo: File | Blob,
  { ladoMaximo = 800, qualidade = 0.7, tipo = "image/jpeg" }: OpcoesRedimensionamento = {}
): Promise<Blob> {
  const bitmap = await createImageBitmap(arquivo);

  const escala = Math.min(1, ladoMaximo / Math.max(bitmap.width, bitmap.height));
  const largura = Math.max(1, Math.round(bitmap.width * escala));
  const altura = Math.max(1, Math.round(bitmap.height * escala));

  const canvas = document.createElement("canvas");
  canvas.width = largura;
  canvas.height = altura;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D não suportado neste navegador.");

  // Fundo branco antes de desenhar — sem isso, PNG com fundo transparente
  // (comum em logo) vira preto quando convertido pra JPEG.
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, largura, altura);
  ctx.drawImage(bitmap, 0, 0, largura, altura);

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, tipo, qualidade));
  if (!blob) throw new Error("Não foi possível processar essa imagem.");
  return blob;
}

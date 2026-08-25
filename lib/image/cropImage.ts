import type { Crop, PixelCrop } from "react-image-crop";

/**
 * Recorta a área selecionada (`crop`, nas coordenadas do <img> exibido em
 * tela) da imagem carregada em `imagem` e devolve um PNG com só esse
 * pedaço — sem perda, já que é só uma etapa intermediária antes da
 * compressão final em `redimensionarImagem`.
 */
export async function cortarImagem(imagem: HTMLImageElement, crop: Crop | PixelCrop): Promise<Blob> {
  // A imagem em tela pode estar redimensionada (CSS) em relação ao arquivo
  // original — escala pra converter as coordenadas do crop pro pixel real.
  const escalaX = imagem.naturalWidth / imagem.width;
  const escalaY = imagem.naturalHeight / imagem.height;

  const cropPx =
    crop.unit === "%"
      ? {
          x: (crop.x / 100) * imagem.width,
          y: (crop.y / 100) * imagem.height,
          width: (crop.width / 100) * imagem.width,
          height: (crop.height / 100) * imagem.height,
        }
      : crop;

  const largura = Math.max(1, Math.round(cropPx.width * escalaX));
  const altura = Math.max(1, Math.round(cropPx.height * escalaY));

  const canvas = document.createElement("canvas");
  canvas.width = largura;
  canvas.height = altura;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D não suportado neste navegador.");

  ctx.drawImage(
    imagem,
    cropPx.x * escalaX,
    cropPx.y * escalaY,
    largura,
    altura,
    0,
    0,
    largura,
    altura
  );

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) throw new Error("Não foi possível recortar a imagem.");
  return blob;
}

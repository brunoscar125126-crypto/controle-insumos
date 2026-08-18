export interface Paleta {
  corPrimaria: string;
  corSecundaria: string;
}

interface RGB {
  r: number;
  g: number;
  b: number;
}
interface HSL {
  h: number;
  s: number;
  l: number;
}

function rgbToHsl({ r, g, b }: RGB): HSL {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return { h, s, l };
}

function hslToRgb({ h, s, l }: HSL): RGB {
  if (s === 0) {
    const v = Math.round(l * 255);
    return { r: v, g: v, b: v };
  }
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return {
    r: Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
    g: Math.round(hue2rgb(p, q, h) * 255),
    b: Math.round(hue2rgb(p, q, h - 1 / 3) * 255),
  };
}

function rgbToHex({ r, g, b }: RGB): string {
  const toHex = (v: number) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Extrai a cor dominante de uma imagem (logo) e gera uma cor secundária de
 * contraste, 100% no browser via <canvas> — não sobe nada pro servidor só
 * pra calcular cor.
 *
 * Estratégia:
 *  1. Desenha a imagem reduzida (40x40) num canvas e lê os pixels.
 *  2. Ignora pixels quase transparentes, quase brancos e quase pretos
 *     (normalmente fundo do logo, não a "cor da marca").
 *  3. Agrupa cores parecidas (quantização) e pega o grupo mais frequente
 *     como dominante.
 *  4. Cor primária = dominante, com luminosidade ajustada pra funcionar
 *     bem como cor de destaque (header, botões, texto branco em cima).
 *  5. Cor secundária = mesmo tom (hue), bem clara e pouco saturada — pra
 *     usar em fundos/badges com bom contraste em relação à primária.
 */
export async function extrairPaleta(file: File): Promise<Paleta> {
  const bitmap = await createImageBitmap(file);
  const tamanho = 40;
  const canvas = document.createElement("canvas");
  canvas.width = tamanho;
  canvas.height = tamanho;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Canvas 2D não suportado neste navegador.");

  ctx.drawImage(bitmap, 0, 0, tamanho, tamanho);
  const { data } = ctx.getImageData(0, 0, tamanho, tamanho);

  const contagem = new Map<string, { rgb: RGB; count: number }>();
  const PASSO = 24; // quantização: agrupa cores em baldes de 24 em 24

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];

    if (a < 128) continue; // transparente
    if (r > 240 && g > 240 && b > 240) continue; // quase branco (fundo comum de logo)
    if (r < 15 && g < 15 && b < 15) continue; // quase preto

    const qr = Math.round(r / PASSO) * PASSO;
    const qg = Math.round(g / PASSO) * PASSO;
    const qb = Math.round(b / PASSO) * PASSO;
    const chave = `${qr},${qg},${qb}`;

    const atual = contagem.get(chave);
    if (atual) {
      atual.count++;
    } else {
      contagem.set(chave, { rgb: { r: qr, g: qg, b: qb }, count: 1 });
    }
  }

  let dominante: RGB = { r: 5, g: 122, b: 87 }; // fallback: verde emerald-700
  let maiorContagem = 0;
  for (const { rgb, count } of contagem.values()) {
    if (count > maiorContagem) {
      maiorContagem = count;
      dominante = rgb;
    }
  }

  const hsl = rgbToHsl(dominante);

  // Primária: mantém matiz/saturação da logo, mas garante que fique numa
  // faixa de luminosidade que funcione como cor de destaque (não muito
  // clara, não muito escura).
  const corPrimaria = rgbToHex(
    hslToRgb({
      h: hsl.h,
      s: Math.max(hsl.s, 0.35),
      l: Math.min(Math.max(hsl.l, 0.28), 0.5),
    })
  );

  // Secundária: mesmo matiz, bem clara e suave — pra fundos e badges.
  const corSecundaria = rgbToHex(
    hslToRgb({
      h: hsl.h,
      s: Math.min(hsl.s, 0.45),
      l: 0.94,
    })
  );

  return { corPrimaria, corSecundaria };
}

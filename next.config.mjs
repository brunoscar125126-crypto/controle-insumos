/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      // As fotos já chegam redimensionadas/comprimidas pelo browser
      // (lib/image/resizeImage.ts, ~800px/qualidade 0.7 — na prática
      // algumas centenas de KB), mas ainda assim é mais folga que o
      // padrão de 1MB. Como a imagem vai direto pra uma coluna bytea no
      // Postgres agora, vale manter esse teto relativamente apertado.
      bodySizeLimit: "4mb",
    },
  },
};

export default nextConfig;

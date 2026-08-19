/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      // Padrão é 1MB — pequeno demais pra fotos de insumo/logo direto do celular.
      bodySizeLimit: "8mb",
    },
  },
};

export default nextConfig;

import type { NextAuthConfig } from "next-auth";

/**
 * Config "edge-safe": sem PrismaAdapter nem client secrets, só o que o
 * proxy.ts precisa pra decidir se a sessão existe. Fica separada de
 * auth.ts porque o Prisma Client não roda no runtime do Proxy.
 */
export default {
  providers: [], // providers reais só em auth.ts — aqui só valida o token/sessão
  pages: {
    signIn: "/login",
  },
  // Necessário atrás de um proxy reverso (Railway, Render, Fly...) que
  // termina o TLS e repassa o Host real via x-forwarded-host — sem isso
  // o Auth.js recusa qualquer host que não seja localhost com
  // "UntrustedHost" (proteção padrão contra host header injection).
  // Railway já cuida do roteamento/TLS, então confiar no host aqui é seguro.
  trustHost: true,
} satisfies NextAuthConfig;

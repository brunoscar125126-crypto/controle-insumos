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
} satisfies NextAuthConfig;

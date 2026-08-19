import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import authConfig from "./auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  // Sessão em JWT (não em banco): o adapter continua cuidando da criação
  // de User/Account no primeiro login, mas ler a sessão em cada request
  // (proxy.ts, layouts) não precisa bater no Postgres — só decodificar o
  // cookie. Também é o que mantém proxy.ts compatível com o runtime dele.
  session: { strategy: "jwt" },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ],
  callbacks: {
    // Com sessão JWT, precisamos propagar o user.id manualmente (por
    // padrão só vem no objeto quando a estratégia é "database").
    async jwt({ token, user }) {
      if (user) token.sub = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) session.user.id = token.sub;
      return session;
    },
  },
});

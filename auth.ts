import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
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
  // É também um requisito do Credentials provider abaixo — ele não
  // funciona com sessão em banco (Auth.js não sabe como "logar via
  // senha" e persistir isso pelo adapter ao mesmo tempo).
  session: { strategy: "jwt" },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      // Sem isso, o Google pula direto pra conta já ativa no navegador
      // (mesmo depois de sair do app) em vez de deixar escolher outra.
      authorization: { params: { prompt: "select_account" } },
    }),
    Credentials({
      credentials: {
        email: { label: "E-mail", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        const email = String(credentials?.email ?? "")
          .trim()
          .toLowerCase();
        const password = String(credentials?.password ?? "");
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        // Sem senha cadastrada = conta só-Google, não tem como entrar por
        // aqui (impede também de "adivinhar" senha vazia).
        if (!user?.password) return null;

        const senhaCorreta = await bcrypt.compare(password, user.password);
        if (!senhaCorreta) return null;

        return { id: user.id, email: user.email, name: user.name, image: user.image };
      },
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
